// import mongoose from "mongoose";

// const { Schema, model } = mongoose;

// /**
//  * Condition Schema
//  */
// const conditionSchema = new Schema(
//   {
//     minMinutes: {
//       type: Number,
//       required: true,
//       min: 0,
//     },
//     calculationType: {
//       type: String,
//       required: true,
//       enum: [
//         "FIXED_AMOUNT",
//         "AMOUNT_PER_MINUTE",
//         "AMOUNT_PER_HOUR"  //this enum for overtime and early overtime only
//       ],
//     },
//     calculationValue: {
//       type: Number,
//       required: true,
//       min: 1,
//     },
//   },
//   { _id: false }
// );

// /**
//  * Deduct Salary Rule
//  */
// const deductSalaryRuleSchema = new Schema(
//   {
//     rules: {
//       type: [conditionSchema],
//       default: [],
//     },
//     minOccuranceType: {
//       type: String,
//       enum: [
//         "COUNT",
//         "CYCLE_MINUTE",
//       ],
//       default:"COUNT"
//     },
//     minOccuranceValue: {
//       type: Number,
//       min: 0,
//       default:0
//     },
//   },
//   { _id: false }
// );

// /**
//  * Penalty Rule (Half Day / Absent)
//  */
// const penaltyRuleSchema = new Schema(
//   {
//     minMinutes: {
//       type: Number,
//       min: 0,
//       default:0
//     },
//     minOccuranceType: {
//       type: String,
//       enum: [
//         "COUNT",
//         "CYCLE_MINUTE",
//       ],
//       default:"COUNT"
//     },
//     minOccuranceValue: {
//       type: Number,
//       min: 0,
//       default:0
//     },
//   },
//   { _id: false }
// );

// const overtimeSalaryRuleSchema = new Schema(
//   {
//     rules: {
//       type: [conditionSchema],
//       default: [],
//     }
//   },
//   { _id: false }
// );

// const overtimeRuleSchema = new Schema(
//   {
//     minMinutes: {
//       type: Number,
//       min: 0,
//     },
//     calculationType: {
//       type: String,
//       enum: [
//         "SALARY_MULTIPLIER"
//       ],
//       default:"SALARY_MULTIPLIER"
//     },
//     calculationValue: {
//       type: Number,
//       default: 0
//     },
//   },
//   { _id: false }
// );

// /**
//  * Main Schema
//  */
// const automationRuleSchema = new Schema(
//   {
//     type: {
//       type: String,
//       required: true,
//       enum: [
//         "late_fine",
//         "early_out",
//         "break",
//         "overtime",
//         "early_overtime",
//       ],
//       index:true
//     },

//     name: { //this field for all type
//       type: String,
//       required: true,
//       trim: true,
//     },

//     rules: {
//       deductSalaryRule: { //this field for late fine, early out and break
//         type: deductSalaryRuleSchema,
//         default: null,
//       },

//       markHalfDayRule: { //this field for late fine, early out and break
//         type: penaltyRuleSchema,
//         default: null,
//       },

//       markAbsentRule: { //this field for late fine, early out and break
//         type: penaltyRuleSchema,
//         default: null,
//       },

//       includeGraceMinutes: { //this field for all type
//         type: Boolean,
//         default: false,
//       },

//       //overtime
//       addSalaryRule:{ //this field for overtime and early overtime
//         type:overtimeSalaryRuleSchema,
//         default :null
//       },

//       addHalfDaySalaryRule:{ //this field for overtime and early overtime
//         type: overtimeRuleSchema,
//         default: null
//       },

//       addFullDaySalaryRule:{ //this field for overtime and early overtime
//         type: overtimeRuleSchema,
//         default: null
//       },

//       overtimeCalculationType:{ // this field for overtime and early overtime but when early overtime it will null
//         type:String,
//         enum:["POST_PAYABLE_HOURS","POST_PAYABLE_HOURS_AND_SHIFT_END","POST_PAYABLE_HOURS_OR_SHIFT_END","SHIFT_END"],
//         default:null
//       }
//     }
//   },
//   {
//     timestamps: true,
//   },
// );

// export const AutomationRuleTemplate = model(
//   "AutomationRule",
//   automationRuleSchema,
// );

import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * Condition Schema – used for defining slabs/rules with amount calculation.
 */
const conditionSchema = new Schema(
  {
    minMinutes: {
      type: Number,
      required: true,
      min: 0,
    },
    calculationType: {
      type: String,
      required: true,
      enum: ["FIXED_AMOUNT", "AMOUNT_PER_MINUTE", "AMOUNT_PER_HOUR","SALARY_MULTIPLIER"],
    },
    calculationValue: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false },
);

/**
 * Deduct Salary Rule – used for late fine, early out, break.
 */
const deductSalaryRuleSchema = new Schema(
  {
    rules: {
      type: [conditionSchema],
      default: [],
    },
    minOccuranceType: {
      type: String,
      enum: ["COUNT", "CYCLE_MINUTE"],
      default: "COUNT",
    },
    minOccuranceValue: {
      type: Number,
      required: true, // must be explicitly provided when this object exists
      min: 0,
      validate: {
        validator: function (v) {
          // If minOccuranceType is COUNT, value must be an integer
          if (this.minOccuranceType === "COUNT" && !Number.isInteger(v)) {
            return false;
          }
          return true;
        },
        message:
          "minOccuranceValue must be an integer when minOccuranceType is COUNT.",
      },
    },
  },
  { _id: false },
);

/**
 * Penalty Rule (Half Day / Absent) – shared structure.
 */
const penaltyRuleSchema = new Schema(
  {
    minMinutes: {
      type: Number,
      required: true, // required when this object is provided
      min: 0,
    },
    minOccuranceType: {
      type: String,
      enum: ["COUNT", "CYCLE_MINUTE"],
      default: "COUNT",
    },
    minOccuranceValue: {
      type: Number,
      required: true, // must be explicitly provided
      min: 0,
      validate: {
        validator: function (v) {
          if (this.minOccuranceType === "COUNT" && !Number.isInteger(v)) {
            return false;
          }
          return true;
        },
        message:
          "minOccuranceValue must be an integer when minOccuranceType is COUNT.",
      },
    },
  },
  { _id: false },
);

/**
 * Overtime Salary Rule – used for overtime/early overtime salary addition.
 */
const overtimeSalaryRuleSchema = new Schema(
  {
    rules: {
      type: [conditionSchema],
      default: [],
    },
  },
  { _id: false },
);

/**
 * Overtime Rule (Half/Full Day Salary) – used for adding half/full day salary.
 */
const overtimeRuleSchema = new Schema(
  {
    minMinutes: {
      type: Number,
      required: true, // required when this object is provided
      min: 0,
    },
    calculationType: {
      type: String,
      enum: ["SALARY_MULTIPLIER"],
      default: "SALARY_MULTIPLIER",
    },
    calculationValue: {
      type: Number,
      default:0,
      min: 0,
    //   validate: {
    //     validator: function (v) {
    //       // For salary multiplier, it should be > 0 (business rule)
    //       if (v <= 0) return false;
    //       return true;
    //     },
    //     message:
    //       "calculationValue must be greater than 0 for salary multiplier.",
    //   },
    },
  },
  { _id: false },
);

/**
 * Main Automation Rule Schema
 */
const automationRuleSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["late_fine", "early_out", "break", "overtime", "early_overtime"],
      index: true,
    },

    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      index: true, // add if you search by name frequently
    },

    rules: {
      deductSalaryRule: {
        type: deductSalaryRuleSchema
      },

      markHalfDayRule: {
        type: penaltyRuleSchema
      },

      markAbsentRule: {
        type: penaltyRuleSchema
      },

      includeGraceMinutes: {
        type: Boolean,
        default: false,
      },

      // Overtime-specific fields
      addSalaryRule: {
        type: overtimeSalaryRuleSchema
      },

      addHalfDaySalaryRule: {
        type: overtimeRuleSchema
      },

      addFullDaySalaryRule: {
        type: overtimeRuleSchema
      },

      overtimeCalculationType: {
        type: String,
        enum: [
          "POST_PAYABLE_HOURS",
          "POST_PAYABLE_HOURS_AND_SHIFT_END",
          "POST_PAYABLE_HOURS_OR_SHIFT_END",
          "SHIFT_END",
        ]
      },
    },
  },
  {
    timestamps: true,
  },
);

// ----- Conditional Validation Middleware -----
automationRuleSchema.pre("validate", function (next) {
  const doc = this;
  const type = doc.type;
  const rules = doc.rules || {};

  // Helper to check if any non-null value exists in given paths
  const hasAny = (...paths) => paths.some((path) => rules[path] != null);

  // Type-specific field restrictions
  if (["late_fine", "early_out", "break"].includes(type)) {
    if (
      hasAny("addSalaryRule", "addHalfDaySalaryRule", "addFullDaySalaryRule")
    ) {
      return next(
        new Error(
          `Type "${type}" cannot contain overtime-specific fields (addSalaryRule, etc.)`,
        ),
      );
    }
  } else if (["overtime", "early_overtime"].includes(type)) {
    if (hasAny("deductSalaryRule", "markHalfDayRule", "markAbsentRule")) {
      return next(
        new Error(
          `Type "${type}" cannot contain deduction/penalty fields (deductSalaryRule, etc.)`,
        ),
      );
    }
  }

  // Additional business rule: if deductSalaryRule is provided, its rules array should not be empty (optional, adjust as needed)
  if (rules.deductSalaryRule && rules.deductSalaryRule.rules.length === 0) {
    return next(
      new Error(
        "deductSalaryRule.rules cannot be empty if deductSalaryRule is provided.",
      ),
    );
  }

  // All other required checks are already enforced by sub-schema `required: true` and validators.
  next();
});

// Optional: unique name per type
// automationRuleSchema.index({ type: 1, name: 1 }, { unique: true });

export const AutomationRuleTemplate = model(
  "AutomationRule",
  automationRuleSchema,
);
