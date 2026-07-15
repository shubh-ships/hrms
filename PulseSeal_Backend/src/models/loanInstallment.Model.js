import mongoose from 'mongoose';

const installmentSchema = new mongoose.Schema({
  loan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loan',
    required: true
  },
  installmentNumber: {
    type: Number,
    required: true,
    min: 1
  },
  dueDate: {
    type: Date,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['due', 'paid', 'overdue'],
    default: 'due'
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  paidDate: Date,
  principalComponent: {
    type: Number,
    min: 0
  },
  interestComponent: {
    type: Number,
    min: 0
  }
}, {
  timestamps: true
});

installmentSchema.index({ loan: 1, installmentNumber: 1 }, { unique: true });
installmentSchema.index({ dueDate: 1, status: 1 });

export default mongoose.model('Installment', installmentSchema);