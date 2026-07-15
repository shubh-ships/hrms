import mongoose from 'mongoose';

const loanSchema = new mongoose.Schema({
  loanName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  principalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  disbursementDate: {
    type: Date,
    required: true
  },
  repaymentStartMonth: {
    type: Date,
    required: true
  },
  interestPreset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InterestPreset'
  },
  interestRate: {
    type: Number,
    min: 0
  },
  interestType: {
    type: String,
    enum: ['simple', 'compound'],
    required: true
  },
  tenure: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'active', 'completed'],
    default: 'pending'
  },
  monthlyInstallment: {
    type: Number,
    min: 0
  },
  totalPayable: {
    type: Number,
    min: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  rejectionReason: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

loanSchema.index({ employee: 1, status: 1 });
loanSchema.index({ status: 1 });

export default mongoose.model('Loan', loanSchema);