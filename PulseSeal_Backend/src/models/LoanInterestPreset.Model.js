import mongoose from 'mongoose';

const interestPresetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  interestRate: {
    type: Number,
    required: true,
    min: 0
  },
  interestType: {
    type: String,
    enum: ['simple', 'compound'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

interestPresetSchema.index({ name: 1 }, { unique: true });

export default mongoose.model('InterestPreset', interestPresetSchema);