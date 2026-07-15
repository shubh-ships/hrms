import mongoose from 'mongoose';

const { Schema, Types, model } = mongoose;

const SummarySchema = new Schema({
  amount: {
    type: Number,
    required: true
  },
  operation: {
    type: String,
    enum: ["credit", "debit"],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const AccountBalanceSchema = new Schema({
  userId: {
    type: Types.ObjectId,
    ref: "User",
    required: true
  },
  organizationId: {
    type: Types.ObjectId,
    ref: "Organization",
    required: true
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  history: [SummarySchema]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for unique user-organization combination
AccountBalanceSchema.index({ userId: 1, organizationId: 1 }, { unique: true });

export const AccountBalance = model("AccountBalance", AccountBalanceSchema);