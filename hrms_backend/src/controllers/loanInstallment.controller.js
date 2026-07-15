import Installment from '../models/loanInstallment.Model.js';
import Loan from '../models/loan.Model.js';
import ApiError from '../utils/apiError.js';
import { successResponse } from '../utils/apiResponse.js';
import asyncHandler from '../middlewares/asyncHandler.js';


export const getLoanInstallments = asyncHandler(async (req, res) => {
  const { loanId } = req.params;
  const { status } = req.query;


  const loan = await Loan.findById(loanId);
  if (!loan) {
    throw new ApiError(404, 'Loan not found');
  }

  // if (loan.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
  //   throw new ApiError(403, 'Access denied');
  // }

  const filter = { loan: loanId };
  if (status) filter.status = status;

  const installments = await Installment.find(filter)
    .sort({ installmentNumber: 1 });

  const summary = {
    totalInstallments: loan.tenure,
    paidInstallments: await Installment.countDocuments({ 
      loan: loanId, 
      status: 'paid' 
    }),
    dueInstallments: await Installment.countDocuments({ 
      loan: loanId, 
      status: 'due' 
    }),
    totalPaid: await Installment.aggregate([
      { $match: { loan: loan._id, status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$paidAmount' } } }
    ]),
    totalDue: await Installment.aggregate([
      { $match: { loan: loan._id, status: { $in: ['due', 'overdue'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
  };

  successResponse(res, 'Installments fetched successfully', {
    installments,
    summary
  });
});


export const markInstallmentPaid = asyncHandler(async (req, res) => {
  const { installmentId } = req.params;
  const { paidAmount, paidDate } = req.body;

  const installment = await Installment.findById(installmentId)
    .populate('loan');
  
  if (!installment) {
    throw new ApiError(404, 'Installment not found');
  }

  if (installment.status === 'paid') {
    throw new ApiError(400, 'Installment is already paid');
  }

  const actualPaidAmount = paidAmount || installment.amount;
  
  installment.paidAmount = actualPaidAmount;
  installment.paidDate = paidDate ? new Date(paidDate) : new Date();
  installment.status = 'paid';
  await installment.save();
  const remainingInstallments = await Installment.countDocuments({
    loan: installment.loan._id,
    status: { $ne: 'paid' }
  });

  if (remainingInstallments === 0) {
    await Loan.findByIdAndUpdate(installment.loan._id, { status: 'completed' });
  }

  successResponse(res, 'Installment marked as paid successfully', installment);
});

// Get installment payment history
export const getPaymentHistory = asyncHandler(async (req, res) => {
  const { loanId } = req.params;

  const loan = await Loan.findById(loanId);
  if (!loan) {
    throw new ApiError(404, 'Loan not found');
  }

  // if (loan.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
  //   throw new ApiError(403, 'Access denied');
  // }

  const paymentHistory = await Installment.find({ 
    loan: loanId,
    status: 'paid'
  }).sort({ paidDate: -1 });

  successResponse(res, 'Payment history fetched successfully', paymentHistory);
});