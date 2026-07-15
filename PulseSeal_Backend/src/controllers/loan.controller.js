import Loan from '../models/loan.Model.js';
import Installment from '../models/loanInstallment.Model.js';
import loanInterestPresetModel from '../models/LoanInterestPreset.Model.js';
import ApiError from '../utils/apiError.js';
import { successResponse } from '../utils/apiResponse.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import Employee from '../models/employee.Model.js';

const calculateMonthlyInstallment = (principal, annualRate, tenure, interestType) => {
  const monthlyRate = annualRate / 12 / 100;
  
  if (interestType === 'simple') {
    const totalInterest = principal * monthlyRate * tenure;
    return (principal + totalInterest) / tenure;
  } else {
    return principal * monthlyRate * Math.pow(1 + monthlyRate, tenure) / 
           (Math.pow(1 + monthlyRate, tenure) - 1);
  }
};

// Create loan request (Employee)
export const createLoanRequest = asyncHandler(async (req, res) => {
  const {organizationId} = req.user;
  const {
    loanName,
    description,
    principalAmount,
    disbursementDate,
    repaymentStartMonth,
    interestPreset,
    interestRate,
    interestType,
    tenure,
    employeeId
  } = req.body;

  let employee;
  
  if (employeeId) {
    employee = await Employee.findById(employeeId).select('_id');
  } else {
    employee = await Employee.findOne({ userId: req.user._id }).select('_id');
  }

  if (!employee) {
    throw new ApiError(404, 'Employee record not found for this user');
  }

  let finalInterestRate = interestRate;
  let finalInterestType = interestType;

  // If interest preset is provided, use its values
  if (interestPreset && interestPreset !== 'custom') {
    const preset = await loanInterestPresetModel.findById(interestPreset);
    if (!preset) {
      throw new ApiError(404, 'Interest preset not found');
    }
    finalInterestRate = preset.interestRate;
    finalInterestType = preset.interestType;
  }

  if (!finalInterestRate || !finalInterestType) {
    throw new ApiError(400, 'Interest rate and type are required');
  }

  const monthlyInstallment = calculateMonthlyInstallment(
    principalAmount,
    finalInterestRate,
    tenure,
    finalInterestType
  );

  const totalPayable = monthlyInstallment * tenure;

  const loan = await Loan.create({
    loanName,
    description,
    employeeId: employee._id,
    principalAmount,
    disbursementDate: new Date(disbursementDate),
    repaymentStartMonth: new Date(repaymentStartMonth),
    interestPreset: interestPreset !== 'custom' ? interestPreset : null,
    interestRate: finalInterestRate,
    interestType: finalInterestType,
    tenure,
    monthlyInstallment,
    totalPayable,
    createdBy: req.user._id,
    organizationId,
    status: 'pending'
  });

  successResponse(res, 'Loan request created successfully', loan);
});

// Get employee's loans
export const getEmployeeLoans = asyncHandler(async (req, res) => {
  const { status } = req.query;

  const employee = await Employee.findOne({ userId: req.user._id }).select('_id');
  
  if (!employee) {
    throw new ApiError(404, 'Employee record not found for this user');
  }

  const filter = { employeeId: employee._id };
  
  if (status) {
    filter.status = status;
  }

  const loans = await Loan.find(filter)
    .populate('interestPreset', 'name interestRate interestType')
    .populate('approvedBy', 'name email')
    .sort({ createdAt: -1 });

  successResponse(res, 'Loans fetched successfully', loans);
});

// Get all loans (Admin)
export const getAllLoans = asyncHandler(async (req, res) => {
  const { status, employeeId } = req.query;
  const filter = {organizationId:req.user.organizationId};
  
  if (status) filter.status = status;
  if (employeeId) filter.employeeId = employeeId;

  const loans = await Loan.find(filter)
    .populate('employeeId', 'personal.firstName personal.lastName employment.employeeCode employment.departmentId userId')
    .populate('interestPreset', 'name interestRate interestType')
    .populate('approvedBy', 'name email')
    .sort({ createdAt: -1 });

  successResponse(res, 'Loans fetched successfully', loans);
});

// Update loan request (Admin)
export const updateLoanRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const loan = await Loan.findById(id);
  if (!loan) {
    throw new ApiError(404, 'Loan not found');
  }

  if (loan.status !== 'pending') {
    throw new ApiError(400, 'Only pending loans can be edited');
  }

  // Recalculate if financial details changed
  if (updateData.principalAmount || updateData.interestRate || 
      updateData.interestType || updateData.tenure) {
    
    const principal = updateData.principalAmount || loan.principalAmount;
    const interestRate = updateData.interestRate || loan.interestRate;
    const interestType = updateData.interestType || loan.interestType;
    const tenure = updateData.tenure || loan.tenure;

    updateData.monthlyInstallment = calculateMonthlyInstallment(
      principal,
      interestRate,
      tenure,
      interestType
    );
    updateData.totalPayable = updateData.monthlyInstallment * tenure;
  }

  Object.assign(loan, updateData);
  await loan.save();

  successResponse(res, 'Loan request updated successfully', loan);
});

// Approve loan (Admin)
export const approveLoan = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const loan = await Loan.findById(id);
  if (!loan) {
    throw new ApiError(404, 'Loan not found');
  }

  if (loan.status !== 'pending') {
    throw new ApiError(400, 'Only pending loans can be approved');
  }

  loan.status = 'approved';
  loan.approvedBy = req.user._id;
  loan.approvedAt = new Date();
  await loan.save();

  successResponse(res, 'Loan approved successfully', loan);
});

// Reject loan (Admin)
export const rejectLoan = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rejectionReason } = req.body;

  if (!rejectionReason) {
    throw new ApiError(400, 'Rejection reason is required');
  }

  const loan = await Loan.findById(id);
  if (!loan) {
    throw new ApiError(404, 'Loan not found');
  }

  if (loan.status !== 'pending') {
    throw new ApiError(400, 'Only pending loans can be rejected');
  }

  loan.status = 'rejected';
  loan.rejectionReason = rejectionReason;
  await loan.save();

  successResponse(res, 'Loan rejected successfully', loan);
});

// Disburse loan (Admin - activate loan)
export const disburseLoan = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const loan = await Loan.findById(id);
  if (!loan) {
    throw new ApiError(404, 'Loan not found');
  }

  if (loan.status !== 'approved') {
    throw new ApiError(400, 'Only approved loans can be disbursed');
  }

  // Create installments
  const installments = [];
  const dueDate = new Date(loan.repaymentStartMonth);
  
  for (let i = 1; i <= loan.tenure; i++) {
    const installmentDueDate = new Date(dueDate);
    installmentDueDate.setMonth(installmentDueDate.getMonth() + i - 1);

    installments.push({
      loan: loan._id,
      installmentNumber: i,
      dueDate: installmentDueDate,
      amount: loan.monthlyInstallment,
      status: 'due'
    });
  }

  await Installment.insertMany(installments);

  loan.status = 'active';
  await loan.save();

  successResponse(res, 'Loan disbursed and installments created successfully', {
    loan,
    installments
  });
});

export const approveAndDisburseLoan = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const session = await Loan.startSession();
  session.startTransaction();

  try {
    // 1. Find the loan within the transaction
    const loan = await Loan.findById(id).session(session);
    if (!loan) {
      throw new ApiError(404, 'Loan not found');
    }

    // 2. Ensure the loan is pending
    if (loan.status !== 'pending') {
      throw new ApiError(400, 'Only pending loans can be approved and disbursed');
    }

    // 3. Set approval details
    loan.approvedBy = req.user._id;
    loan.approvedAt = new Date();

    // 4. Prepare installments
    const installments = [];
    const dueDate = new Date(loan.repaymentStartMonth);
    for (let i = 1; i <= loan.tenure; i++) {
      const installmentDueDate = new Date(dueDate);
      installmentDueDate.setMonth(installmentDueDate.getMonth() + i - 1);
      installments.push({
        loan: loan._id,
        installmentNumber: i,
        dueDate: installmentDueDate,
        amount: loan.monthlyInstallment,
        status: 'due'
      });
    }

    // 5. Insert installments and update loan status atomically
    await Installment.insertMany(installments, { session });
    loan.status = 'active';
    await loan.save({ session });

    // 6. Commit transaction
    await session.commitTransaction();
    session.endSession();

    // 7. Return success response
    successResponse(res, 'Loan approved and disbursed successfully', {
      loan,
      installments
    });
  } catch (error) {
    // Rollback transaction on error
    await session.abortTransaction();
    session.endSession();
    throw error; // Pass to global error handler
  }
});

export const createAndDisburseLoan = asyncHandler(async (req, res) => {
  const { organizationId } = req.user;
  const {
    loanName,
    description,
    principalAmount,
    disbursementDate,
    repaymentStartMonth,
    interestPreset,
    interestRate,
    interestType,
    tenure
  } = req.body;

  // 1. Find the employee record for this user
  const employee = await Employee.findOne({ userId: req.user._id }).select('_id');
  if (!employee) {
    throw new ApiError(404, 'Employee record not found for this user');
  }

  // 2. Resolve interest preset if provided
  let finalInterestRate = interestRate;
  let finalInterestType = interestType;
  if (interestPreset && interestPreset !== 'custom') {
    const preset = await loanInterestPresetModel.findById(interestPreset);
    if (!preset) {
      throw new ApiError(404, 'Interest preset not found');
    }
    finalInterestRate = preset.interestRate;
    finalInterestType = preset.interestType;
  }
  if (!finalInterestRate || !finalInterestType) {
    throw new ApiError(400, 'Interest rate and type are required');
  }

  // 3. Calculate monthly installment
  const monthlyInstallment = calculateMonthlyInstallment(
    principalAmount,
    finalInterestRate,
    tenure,
    finalInterestType
  );
  const totalPayable = monthlyInstallment * tenure;

  // 4. Start a transaction
  const session = await Loan.startSession();
  session.startTransaction();

  try {
    // 5. Create the loan document (initially pending)
    const loan = await Loan.create([{
      loanName,
      description,
      employeeId: employee._id,
      principalAmount,
      disbursementDate: new Date(disbursementDate),
      repaymentStartMonth: new Date(repaymentStartMonth),
      interestPreset: interestPreset !== 'custom' ? interestPreset : null,
      interestRate: finalInterestRate,
      interestType: finalInterestType,
      tenure,
      monthlyInstallment,
      totalPayable,
      createdBy: req.user._id,
      organizationId,
      status: 'pending',
      approvedBy: req.user._id,      // Auto‑approve
      approvedAt: new Date()
    }], { session });

    const newLoan = loan[0];

    // 6. Generate installments
    const installments = [];
    const dueDate = new Date(newLoan.repaymentStartMonth);
    for (let i = 1; i <= newLoan.tenure; i++) {
      const installmentDueDate = new Date(dueDate);
      installmentDueDate.setMonth(installmentDueDate.getMonth() + i - 1);
      installments.push({
        loan: newLoan._id,
        installmentNumber: i,
        dueDate: installmentDueDate,
        amount: newLoan.monthlyInstallment,
        status: 'due'
      });
    }

    // 7. Insert installments
    await Installment.insertMany(installments, { session });

    // 8. Update loan status to active
    newLoan.status = 'active';
    await newLoan.save({ session });

    // 9. Commit transaction
    await session.commitTransaction();
    session.endSession();

    // 10. Return populated loan with installments
    const populatedLoan = await Loan.findById(newLoan._id)
      .populate('employeeId', 'name employeeId')
      .populate('approvedBy', 'name email');

    successResponse(res, 'Loan created and disbursed successfully', {
      loan: populatedLoan,
      installments
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});