import * as payrollService from "../services/payroll.services.js";

export const createPayrollRun = async (req, res, next) => {
  try {
    const { month, year } = req.body;
    const organizationId = req.user.organizationId; 
    const userId = req.user._id;

    const payroll = await payrollService.initiatePayroll(
      organizationId,
      month,
      year,
      userId
    );

    res.status(201).json({ success: true, payroll });
  } catch (error) {
    next(error);
  }
};

export const completePayrollRun = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payroll = await payrollService.completePayroll(id);
    res.status(200).json({ success: true, payroll });
  } catch (error) {
    next(error);
  }
};


export const listPayroll =async(req,res)=>{
    const organizationId= req.user.organizationId;
    const listPayrollData= await payrollService.listPayroll(organizationId);
    res.status(200).json({data:listPayrollData})
}