import repo from "../repositories/salary.repository.js";
import attendanceRepo from "../repositories/newAttendance.repository.js";
import ApiError from "../utils/apiError.js";

class SalaryService {

  // ---------------- TEMPLATE ----------------
  async createTemplate(data) {
    if (!data.name) {
      throw new ApiError(400, "Template name is required");
    }
    if (!data.staffType || !["REGULAR", "CONTRACTUAL"].includes(data.staffType)) {
      throw new ApiError(400, "Valid staff type is required");
    }
    return repo.createTemplate(data);
  }

  async getTemplates(organizationId) {
    return repo.findAllTemplates(organizationId);
  }


async addComponent(data) {
  // 🔥 1. Validate request body
  if (!data) {
    throw new ApiError(400, "Request body is required");
  }

  const { templateId, name, code, type, isEditable, organizationId } = data;

  // 🔥 2. Required field checks
  if (!templateId) {
    throw new ApiError(400, "templateId is required");
  }

  // ✅ Security Check
  const template = await repo.findTemplateById(templateId);
  if (!template || template.organizationId.toString() !== organizationId.toString()) {
    throw new ApiError(404, "Not found");
  }

  if (!name || !code || !type) {
    throw new ApiError(400, "name, code and type are required");
  }

  // 🔥 3. Fetch existing components safely
  const existing = await repo.findComponents(templateId);

  // 🔥 4. Residual validation
  if (type === "RESIDUAL") {
    if (existing.some(c => c.type === "RESIDUAL")) {
      throw new ApiError(400, "Only one residual component allowed");
    }
  }

  // 🔥 5. Create component
  return await repo.createComponent({
    templateId,
    name,
    code,
    type,
    isEditable,
  });
}

  async getComponents(templateId, organizationId) {
    if (!templateId) {
      throw new ApiError(400, "Template ID is required");
    }

    // ✅ Security Check
    const template = await repo.findTemplateById(templateId);
    if (!template || template.organizationId.toString() !== organizationId.toString()) {
      throw new ApiError(404, "Not found");
    }

    return repo.findComponents(templateId);
  }

 async replaceComponents(templateId, components, organizationId) {
  // 🔥 1. Validate templateId
  if (!templateId) {
    throw new ApiError(400, "templateId is required");
  }

  // ✅ Security Check
  const template = await repo.findTemplateById(templateId);
  if (!template || template.organizationId.toString() !== organizationId.toString()) {
    throw new ApiError(404, "Not found");
  }

  // 🔥 2. Validate components
  if (!components || !Array.isArray(components)) {
    throw new ApiError(400, "components array is required");
  }

  // 🔥 3. Validate each component
  for (const c of components) {
    if (!c.name || !c.code || !c.type) {
      throw new ApiError(400, "Invalid component structure");
    }
  }

  // 🔥 4. Residual check
  const residualCount = components.filter(
    c => c.type === "RESIDUAL"
  ).length;

  if (residualCount > 1) {
    throw new ApiError(400, "Only one residual allowed");
  }

  // 🔥 5. Replace
  await repo.deleteComponents(templateId);

  return await repo.createComponents(
    components.map(c => ({
      ...c,
      templateId,
    }))
  );
}

  // ---------------- SALARY ----------------
  async assignSalary(data) {
    const { employeeId, templateId, monthlyCTC, basic, organizationId } = data;

    // ✅ Security Checks
    const employee = await repo.findEmployeeById(employeeId);
    if (!employee || employee.organizationId.toString() !== organizationId.toString()) {
      throw new ApiError(404, "Not found");
    }

    const template = await repo.findTemplateById(templateId);
    if (!template || template.organizationId.toString() !== organizationId.toString()) {
      throw new ApiError(404, "Not found");
    }

    if (basic > monthlyCTC) {
      throw new ApiError(400, "Basic cannot exceed CTC");
    }

    const old = await repo.findActiveSalary(employeeId);
    if (old) await repo.deactivateSalary(old._id);

    return repo.createEmployeeSalary({
      ...data,
      specialAllowance: monthlyCTC - basic,
      effectiveFrom: new Date(),
    });
  }

  async editSalary(employeeId, basic, organizationId) {
    // ✅ Security Check
    const employee = await repo.findEmployeeById(employeeId);
    if (!employee || employee.organizationId.toString() !== organizationId.toString()) {
      throw new ApiError(404, "Not found");
    }

    const salary = await repo.findActiveSalary(employeeId);

    if (!salary) throw new ApiError(404, "Salary not found");

    if (basic > salary.monthlyCTC) {
      throw new ApiError(400, "Basic cannot exceed CTC");
    }

    salary.basic = basic;
    salary.specialAllowance = salary.monthlyCTC - basic;

    return salary.save();
  }

  async reviseSalary(data) {
    const { employeeId, percent, newCTC, newBasic, organizationId } = data;

    // ✅ Security Check
    const employee = await repo.findEmployeeById(employeeId);
    if (!employee || employee.organizationId.toString() !== organizationId.toString()) {
      throw new ApiError(404, "Not found");
    }

    const oldSalary = await repo.findActiveSalary(employeeId);

    let finalCTC = newCTC;
    if (percent) {
      finalCTC = oldSalary.monthlyCTC * (1 + percent / 100);
    }

    if (newBasic > finalCTC) {
      throw new ApiError(400, "Basic cannot exceed CTC");
    }

    await repo.deactivateSalary(oldSalary._id);

    const newSalary = await repo.createEmployeeSalary({
      ...data,
      templateId: oldSalary.templateId,
      monthlyCTC: finalCTC,
      basic: newBasic,
      specialAllowance: finalCTC - newBasic,
      effectiveFrom: new Date(),
    });

    await repo.createRevision({
      organizationId,
      employeeId,
      salaryId: newSalary._id,
      oldCTC: oldSalary.monthlyCTC,
      newCTC: finalCTC,
      oldBasic: oldSalary.basic,
      newBasic,
      oldSpecialAllowance: oldSalary.specialAllowance,
      newSpecialAllowance: finalCTC - newBasic,
      percentageChange: percent,
      effectiveFrom: newSalary.effectiveFrom,
    });

    return newSalary;
  }

  // ---------------- PAYROLL ----------------
  async _calculateMonthlyPayroll(employeeId, month, year, organizationId) {
    const salary = await repo.findActiveSalary(employeeId);
    if (!salary) throw new ApiError(404, "Active salary not found for employee");

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    const summary = await attendanceRepo.getPayrollSummary(
      employeeId,
      start,
      end
    );

    const totalDays = 30;
    const perDay = salary.monthlyCTC / totalDays;

    const baseSalary = perDay * summary.payableDays;

    // Fetch Manual Salary Actions
    const manualActions = await repo.findSalaryActions({
      employeeId,
      month,
      year,
      organizationId,
    });

    let manualEarnings = 0;
    let manualDeductions = 0;
    const manualBreakdownItems = [];

    for (const action of manualActions) {
      if (action.type === "EARNING") {
        manualEarnings += action.amount;
      } else {
        // DEDUCTION or PAYMENT (Advance)
        manualDeductions += action.amount;
      }

      manualBreakdownItems.push({
        type: action.type === "EARNING" ? "EARNING" : "DEDUCTION",
        code: action.category.toUpperCase().replace(/\s+/g, "_"),
        name: action.category,
        amount: action.amount,
        description: action.description,
      });
    }

    const grossSalary = baseSalary + summary.overtimeAmount + manualEarnings;
    const totalDeductions = summary.fineAmount + manualDeductions;
    const netSalary = grossSalary - totalDeductions;

    const payrollData = {
      organizationId,
      employeeId,
      salaryId: salary._id,
      month,
      year,
      monthlyCTC: salary.monthlyCTC,
      basic: salary.basic,
      specialAllowance: salary.specialAllowance,
      totalDays,
      payableDays: summary.payableDays,
      overtimeAmount: summary.overtimeAmount,
      fineAmount: summary.fineAmount,
      grossSalary,
      totalDeductions,
      netSalary,
    };

    const components = await repo.findComponents(salary.templateId);

    // 🔥 Dynamic Breakdown
    const breakdownItems = [];
    
    // Add Template Components
    for (const comp of components) {
      let monthlyAmount = 0;
      if (comp.code === "BASIC") {
        monthlyAmount = salary.basic;
      } else if (comp.type === "RESIDUAL") {
        monthlyAmount = salary.specialAllowance;
      } else {
        monthlyAmount = comp.amount || 0;
      }

      const proratedAmount = (monthlyAmount / totalDays) * summary.payableDays;

      breakdownItems.push({
        type: "EARNING",
        code: comp.code,
        name: comp.name,
        amount: Math.round(proratedAmount * 100) / 100,
      });
    }

    // Add Overtime and Fines
    if (summary.overtimeAmount > 0) {
      breakdownItems.push({
        type: "EARNING",
        code: "OVERTIME",
        name: "Overtime",
        amount: summary.overtimeAmount,
      });
    }

    if (summary.fineAmount > 0) {
      breakdownItems.push({
        type: "DEDUCTION",
        code: "FINE",
        name: "Fine",
        amount: summary.fineAmount,
      });
    }

    // Add Manual Actions to Breakdown
    for (const mb of manualBreakdownItems) {
      breakdownItems.push(mb);
    }

    return { payrollData, breakdownItems };
  }

  async getPayrollOverview(data) {
    const { employeeId, month, year, organizationId } = data;

    // ✅ Security Check
    const employee = await repo.findEmployeeById(employeeId);
    if (!employee || employee.organizationId.toString() !== organizationId.toString()) {
      throw new ApiError(404, "Not found");
    }

    const exists = await repo.findPayroll(employeeId, month, year);
    if (exists) {
      const breakdownItems = await repo.findBreakdownByPayroll(exists._id);
      return { 
        payroll: exists, 
        breakdown: breakdownItems,
        isPreview: false 
      };
    }

    const { payrollData, breakdownItems } = await this._calculateMonthlyPayroll(employeeId, month, year, organizationId);
    return { 
      payroll: { ...payrollData, status: "PREVIEW" }, 
      breakdown: breakdownItems,
      isPreview: true 
    };
  }

  async runPayroll(data) {
    const { employeeId, month, year, organizationId } = data;

    // ✅ Security Check
    const employee = await repo.findEmployeeById(employeeId);
    if (!employee || employee.organizationId.toString() !== organizationId.toString()) {
      throw new ApiError(404, "Not found");
    }

    const exists = await repo.findPayroll(employeeId, month, year);
    if (exists) throw new ApiError(400, "Payroll already exists");

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    await attendanceRepo.lockAttendance(employeeId, start, end);

    const { payrollData, breakdownItems } = await this._calculateMonthlyPayroll(employeeId, month, year, organizationId);

    const payroll = await repo.createPayroll({
      ...payrollData,
      status: "PROCESSED",
      processedAt: new Date(),
    });

    const breakdownItemsWithPayrollId = breakdownItems.map(item => ({
      ...item,
      payrollId: payroll._id,
    }));

    await repo.createBreakdown(breakdownItemsWithPayrollId);
    
    return payroll;
  }

  async getEmployeePayrollHistory(employeeId, organizationId) {
    // ✅ Security Check
    const employee = await repo.findEmployeeById(employeeId);
    if (!employee || employee.organizationId.toString() !== organizationId.toString()) {
      throw new ApiError(404, "Not found");
    }

    return await repo.findAllPayrollsByEmployee(employeeId);
  }


  // ---------------- SALARY ACTIONS ----------------
  async addSalaryAction(data) {
    const { employeeId, organizationId, type, category, amount, month, year } = data;

    if (!employeeId || !type || !category || !amount || !month || !year) {
      throw new ApiError(400, "Missing required fields for salary action");
    }

    // Security Check
    const employee = await repo.findEmployeeById(employeeId);
    if (!employee || employee.organizationId.toString() !== organizationId.toString()) {
      throw new ApiError(404, "Employee not found");
    }

    // Check if payroll already processed
    const payroll = await repo.findPayroll(employeeId, month, year);
    if (payroll && payroll.status !== "DRAFT") {
      throw new ApiError(400, "Cannot add action to processed payroll. Revert first.");
    }

    return await repo.createSalaryAction(data);
  }

  async getSalaryActions(employeeId, month, year, organizationId) {
    return await repo.findSalaryActions({
      employeeId,
      month,
      year,
      organizationId,
    });
  }

  async deleteSalaryAction(id, organizationId) {
    const action = await repo.findSalaryActionById(id);
    if (!action || action.organizationId.toString() !== organizationId.toString()) {
      throw new ApiError(404, "Action not found");
    }

    // Check if payroll already processed
    const payroll = await repo.findPayroll(action.employeeId, action.month, action.year);
    if (payroll && payroll.status !== "DRAFT") {
      throw new ApiError(400, "Cannot delete action from processed payroll. Revert first.");
    }

    return await repo.deleteSalaryAction(id);
  }
}

export default new SalaryService();