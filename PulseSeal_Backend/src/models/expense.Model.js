import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const expenseSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  expenseType: {
    type: String,
    enum: ['Travel', 'Food'],
    required: true
  },
  expenseDate: {
    type: Date,
    required: true
  },
  billNumber: {
    type: String
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true
  },
  proofs: [{
    public_id: String,
    url: String
  }],
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  rejectedReason: {
    type: String,
    default: null
  },
  handledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  handledAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

expenseSchema.plugin(mongoosePaginate);

export const Expense = mongoose.model('Expense', expenseSchema);