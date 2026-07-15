// src/services/payroll.service.js
import * as payrollRepo from "../repositories/payroll.repository.js";
import {salaryslipService} from "./salaryslip.services.js"; 
import User from "../models/user.Model.js"; 

export const initiatePayroll = async (organizationId, month, year, userId) => {
  const payrollRun = await payrollRepo.createPayrollRun({
    organizationId,
    month,
    year,
    initiatedBy: userId,
    status: "pending",
  });

  const employees = await User.find({ organizationId, isActive: true });

 
  let totalAmount = 0;
  for (const emp of employees) {
    const slip = await salaryslipService({
      userId: emp._id,
      month,
      year,
      organizationId: emp.organizationId,
      payrollRunId: payrollRun._id
    });
    totalAmount += slip.data?.summary.netSalary || 0; 
  
  }
 
  return await payrollRepo.updatePayrollRun(payrollRun._id, {
    totalEmployees: employees.length,
    totalAmount,
    status: "processed",
  });
};

export const completePayroll = async (payrollRunId) => {
  return await payrollRepo.updatePayrollRun(payrollRunId, { status: "completed" });
};

export const listPayroll= async(organizationId)=>{
    const listPayroll= await payrollRepo.listPayrollRuns(organizationId)
    return listPayroll
}
