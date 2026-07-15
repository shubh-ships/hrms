import SalaryTemplate from "../models/salaryModels/salaryTemplate.Model.js";
import { SalaryTemplateComponent } from "../models/salaryModels/components.Model.js";
import { EmployeeSalary } from "../models/salaryModels/employeeSalary.Model.js";
import { SalaryRevision } from "../models/salaryModels/salaryRevision.Model.js";
import { Payroll } from "../models/salaryModels/payroll.Model.js";
import { PayrollBreakdown } from "../models/salaryModels/payrollBreakdowm.Model.js";
import { SalaryAction } from "../models/salaryModels/salaryAction.Model.js";
import Employee from "../models/employee.Model.js";
import ApiError from "../utils/apiError.js";

class SalaryRepository {
  // TEMPLATE
  async createTemplate(data) {
    try {
      return await SalaryTemplate.create(data);
    } catch (e) {
      throw new ApiError(500, e.message);
    }
  }

  async findTemplateById(id) {
    try {
      return await SalaryTemplate.findById(id).lean();
    } catch (e) {
      throw new ApiError(500, e.message);
    }
  }

  async findAllTemplates(organizationId) {
    try {
      return await SalaryTemplate.find({ organizationId }).lean();
    } catch (e) {
      throw new ApiError(500, e.message);
    }
  }


  // COMPONENTS
  async createComponent(data) {
    try {
      return await SalaryTemplateComponent.create(data);
    } catch (e) {
      throw new ApiError(500, e.message);
    }
  }

  async createComponents(data) {
    try {
      return await SalaryTemplateComponent.insertMany(data);
    } catch (e) {
      throw new ApiError(500, e.message);
    }
  }

  async findComponents(templateId) {
    try {
      return await SalaryTemplateComponent.find({ templateId }).lean();
    } catch (e) {
      throw new ApiError(500, e.message);
    }
  }

  async deleteComponents(templateId) {
    try {
      return await SalaryTemplateComponent.deleteMany({ templateId });
    } catch (e) {
      throw new ApiError(500, e.message);
    }
  }

  // SALARY
  async findActiveSalary(employeeId) {
    try {
      return await EmployeeSalary.findOne({ employeeId, isActive: true });
    } catch (e) {
      throw new ApiError(500, e.message);
    }
  }

  async createEmployeeSalary(data) {
    try {
      return await EmployeeSalary.create(data);
    } catch (e) {
      throw new ApiError(500, e.message);
    }
  }

  async deactivateSalary(id) {
    try {
      return await EmployeeSalary.findByIdAndUpdate(id, { isActive: false });
    } catch (e) {
      throw new ApiError(500, e.message);
    }
  }

  // REVISION
  async createRevision(data) {
    try {
      return await SalaryRevision.create(data);
    } catch (e) {
      throw new ApiError(500, e.message);
    }
  }

  // PAYROLL
  async findPayroll(employeeId, month, year) {
    try {
      return await Payroll.findOne({ employeeId, month, year });
    } catch (e) {
      throw new ApiError(500, e.message);
    }
  }

  async findAllPayrollsByEmployee(employeeId) {
    try {
      return await Payroll.find({ employeeId }).sort({ year: -1, month: -1 }).lean();
    } catch (e) {
      throw new ApiError(500, e.message);
    }
  }


  async createPayroll(data) {
    try {
      return await Payroll.create(data);
    } catch (e) {
      throw new ApiError(500, e.message);
    }
  }

  async createBreakdown(data) {
    try {
      return await PayrollBreakdown.insertMany(data);
    } catch (e) {
      throw new ApiError(500, e.message);
    }
  }

  async findBreakdownByPayroll(payrollId) {
    try {
      return await PayrollBreakdown.find({ payrollId }).lean();
    } catch (e) {
      throw new ApiError(500, e.message);
    }
  }


  async findEmployeeById(id) {
    try {
      return await Employee.findById(id).lean();
    } catch (e) {
      throw new ApiError(500, e.message);
    }
  }

  // SALARY ACTIONS
  async createSalaryAction(data) {
    try {
      return await SalaryAction.create(data);
    } catch (e) {
      throw new ApiError(500, e.message);
    }
  }

  async findSalaryActions(query) {
    try {
      return await SalaryAction.find(query).sort({ entryDate: -1 }).lean();
    } catch (e) {
      throw new ApiError(500, e.message);
    }
  }

  async deleteSalaryAction(id) {
    try {
      return await SalaryAction.findByIdAndDelete(id);
    } catch (e) {
      throw new ApiError(500, e.message);
    }
  }

  async findSalaryActionById(id) {
    try {
      return await SalaryAction.findById(id).lean();
    } catch (e) {
      throw new ApiError(500, e.message);
    }
  }
}

export default new SalaryRepository();