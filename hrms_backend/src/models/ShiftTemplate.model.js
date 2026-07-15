import mongoose from "mongoose";

/**
 * 🔹 Break Schema (for FIXED_SHIFT)
 */
const breakSchema = new mongoose.Schema(
  {
    startTime: {
      type: String,
      required: true,
      trim: true,
    },
    endTime: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false },
);

/**
 * 🔹 Main Shift Template Schema
 */
const shiftTemplateSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },

  name: {
    type: String,
    required: true,
  },
  shiftCode: {
    type: String,
    required: true,
    unique: true,
  },
  shiftType: {
    type: String,
    enum: ["FIXED_SHIFT", "OPEN_SHIFT"],
    required: true,
  },

  /**
   * 🔹 FIXED SHIFT TIMINGS
   */
  startTime: {
    type: String,
    trim: true,
    validate: {
      validator: function (value) {
        if (this.shiftType === "FIXED_SHIFT") {
          return value != null && value !== "";
        }
        return value == null;
      },
      message: "startTime is required only for FIXED_SHIFT",
    },
  },

  endTime: {
    type: String,
    trim: true,
    validate: {
      validator: function (value) {
        if (this.shiftType === "FIXED_SHIFT") {
          return value != null && value !== "";
        }
        return value == null;
      },
      message: "endTime is required only for FIXED_SHIFT",
    },
  },

  /**
   * 🔹 BREAKS (ONLY FOR FIXED SHIFT)
   */
  breaks: {
    type: [breakSchema],
    validate: {
      validator: function (breaks) {
        if (this.shiftType === "FIXED_SHIFT") {
          return breaks.every((b) => b.startTime && b.endTime);
        }
        return breaks.length === 0;
      },
      message: "Breaks with start/end allowed only for FIXED_SHIFT",
    },
  },

  /**
   * 🔹 OPEN SHIFT CONFIG
   */
  totalWorkingMinutes: {
    type: Number, // in minutes
    validate: {
      validator: function (value) {
        if (this.shiftType === "OPEN_SHIFT") {
          return value != null && value > 0;
        }
        return value == null;
      },
      message: "minimumWorkingMinutes is required only for OPEN_SHIFT",
    },
  },

  breakDuration: {
    type: Number, // in minutes
    validate: {
      validator: function (value) {
        if (this.shiftType === "OPEN_SHIFT") {
          return value != null && value >= 0;
        }
        return value == null;
      },
      message: "breakDuration is required only for OPEN_SHIFT",
    },
  },

  minHalfDayMinutes: {
    type: Number,
    required: true,
  },

  minFullDayMinutes: {
    type: Number, // in minutes
    required: true,
  },

  /**
   * 🔹 COMMON
   */
  isActive: {
    type: Boolean,
    default: true,
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

/**
 * 🔹 Cross-field validation
 */
shiftTemplateSchema.pre("validate", function (next) {
  // OPEN_SHIFT: full > half
  if (this.shiftType === "OPEN_SHIFT") {
    if (this.fullDayMinimumHours <= this.halfDayMinimumHours) {
      return next(
        new Error(
          "fullDayMinimumHours must be greater than halfDayMinimumHours",
        ),
      );
    }
  }

  next();
});

export default mongoose.model("ShiftTemplate", shiftTemplateSchema);
