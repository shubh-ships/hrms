import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  requirements: [String],
  location: {
    type: String,
    required: true
  },
  salaryRange: {
    min: Number,
    max: Number,
    currency: String
  },
  employmentType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
    required: true
  },
  department: String,
  skillsRequired: [String],
  experienceLevel: {
    type: String,
    enum: ['Entry', 'Mid', 'Senior', 'Executive']
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Closed', 'Draft'],
    default: 'Active'
  },
  applicationDeadline: Date,
  numberOfOpenings: {
    type: Number,
    default: 1
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const Job  = mongoose.model('Job', jobSchema);

export default Job