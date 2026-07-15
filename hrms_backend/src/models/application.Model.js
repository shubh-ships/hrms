import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  candidate: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: String,
    location: String,
    portfolio: String,
    linkedin: String,
    github: String
  },
  resume: {
    type:{
        public_id:String,
        url:String
      },
    required:true
  },
  coverLetter: String,
  status: {
    type: String,
    enum: ['Applied', 'Shortlisted', 'Rejected', 'Interview', 'Hired'],
    default: 'Applied'
  },
  applicationDate: {
    type: Date,
    default: Date.now
  },
  interviewDate: Date,
  interviewNotes: String,
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  notes: String,
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  source: {
    type: String,
    default: 'Career Portal'
  }
}, {
  timestamps: true
});

// Index for better query performance
applicationSchema.index({ job: 1, status: 1 });
applicationSchema.index({ candidate: 1 });
applicationSchema.index({ organization: 1 });

const Application = mongoose.model('Application', applicationSchema);

export default Application;