import { PayrollRun } from "../models/payroll.Model.js";

export const createPayrollRun = async (data) => {
  return await PayrollRun.create(data);
};

export const updatePayrollRun = async (id, updates) => {
  return await PayrollRun.findByIdAndUpdate(id, updates, { new: true });
};

export const getPayrollRunById = async (id) => {
  return await PayrollRun.findById(id);
};

export const listPayrollRuns = async (organizationId) => {
  return await PayrollRun.find({organizationId}).sort({ createdAt: -1 }).populate('initiatedBy', 'name email');
};
