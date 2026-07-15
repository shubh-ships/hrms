import { AutomationRuleTemplate } from "../models/automationRuleTemplate.Model.js";
import { EmployeeAutomationAssignment } from "../models/automationEmployeeAssign.Model.js";
import ApiError from "../utils/apiError.js";
import mongoose from "mongoose";
import Employee from "../models/employee.Model.js";

class AutomationRuleRepository {
  async create(data) {
    try {
      return await AutomationRuleTemplate.create(data);
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  async findOne(query) {
    try {
      return await AutomationRuleTemplate.findOne(query).lean();
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  async findById(id) {
    try {
      return await AutomationRuleTemplate.findById(id).lean();
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  async find(query, sort = { createdAt: -1 }) {
    try {
      return await AutomationRuleTemplate.find(query).sort(sort).lean();
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  async update(id, data) {
    try {
      return await AutomationRuleTemplate.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true },
      ).lean();
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  async delete(id) {
    try {
      return await AutomationRuleTemplate.findByIdAndDelete(id).lean();
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  async assign(data) {
    try {
      return await EmployeeAutomationAssignment.create(data);
    } catch (error) {
      // Handle duplicate key error (employeeId + type)
      if (error.code === 11000) {
        throw new ApiError(409, "Employee already has a template of this type");
      }
      throw new ApiError(500, error.message);
    }
  }

  async findOneAssignee(query) {
    try {
      return await EmployeeAutomationAssignment.findOne(query).lean();
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  async findAssignee(organizationId) {
    try {
      console.log(organizationId);
      return await EmployeeAutomationAssignment.find({ organizationId })
        .populate("templateId")
        .populate("employeeId")
        .lean();
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  async deleteAssignee(id) {
    try {
      return await EmployeeAutomationAssignment.findByIdAndDelete(id).lean();
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  // Optional: find assignments by employee and populate template details
  async findByEmployeeWithTemplate(employeeId, organizationId) {
    try {
      return await EmployeeAutomationAssignment.find({
        employeeId,
        organizationId,
      })
        .populate("templateId")
        .lean();
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  async findByTemplateWithEmployeeDetails(templateId) {
    try {
      return await EmployeeAutomationAssignment.find({ templateId })
        .populate({
          path: "employeeId",
          select:
            "personal.firstName personal.lastName shiftId employment.status", // adjust fields as needed
          populate: {
            path: "shiftId",
            select: "name",
          },
        })
        .lean();
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  async findAssignedToTemplate(templateId, organizationId, options = {}) {
    try {
      const { page = 1, limit = 10, search = "" } = options;
      const skip = (page - 1) * limit;

      // Build aggregation pipeline
      const pipeline = [
        {
          $match: {
            templateId: new mongoose.Types.ObjectId(templateId),
            organizationId: new mongoose.Types.ObjectId(organizationId),
          },
        },
        {
          $lookup: {
            from: "employees", // actual collection name
            localField: "employeeId",
            foreignField: "_id",
            as: "employee",
          },
        },
        { $unwind: "$employee" },
        {
          $match: {
            $or: [
              {
                "employee.personal.firstName": {
                  $regex: search,
                  $options: "i",
                },
              },
              {
                "employee.personal.lastName": { $regex: search, $options: "i" },
              },
              { "employee.personal.email": { $regex: search, $options: "i" } },
              {
                "employee.employment.employeeCode": {
                  $regex: search,
                  $options: "i",
                },
              },
            ],
          },
        },
        {
          $facet: {
            metadata: [{ $count: "total" }],
            data: [
              { $skip: skip },
              { $limit: limit },
              {
                $project: {
                  _id: "$employee._id",
                  name: {
                    $trim: {
                      input: {
                        $concat: [
                          "$employee.personal.firstName",
                          " ",
                          { $ifNull: ["$employee.personal.lastName", ""] },
                        ],
                      },
                    },
                  },
                  email: "$employee.personal.email",
                  employeeCode: "$employee.employment.employeeCode",
                },
              },
            ],
          },
        },
      ];

      const result = await EmployeeAutomationAssignment.aggregate(pipeline);
      const { data, metadata } = result[0];
      const total = metadata[0]?.total || 0;

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  /**
   * Get employees not assigned to any template of the given type.
   * Excludes employees who already have an assignment of the same type.
   */
  async findUnassignedToTemplate(
    templateId,
    organizationId,
    options = {},
    type,
  ) {
    try {
      const { page = 1, limit = 10, search = "" } = options;
      const skip = (page - 1) * limit;

      // First, get all employee IDs that have an assignment of this type
      const assignedEmployeeIds = await EmployeeAutomationAssignment.distinct(
        "employeeId",
        {
          organizationId,
          type,
        },
      );

      // Build query for employees not in the assigned list
      const query = {
        organizationId,
        _id: { $nin: assignedEmployeeIds },
      };

      if (search) {
        query.$or = [
          { "personal.firstName": { $regex: search, $options: "i" } },
          { "personal.lastName": { $regex: search, $options: "i" } },
          { "personal.email": { $regex: search, $options: "i" } },
          { "employment.employeeCode": { $regex: search, $options: "i" } },
        ];
      }

      const employees = await Employee.find(query)
        .select(
          "personal.firstName personal.lastName personal.email employment.employeeCode",
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Employee.countDocuments(query);

      const formattedEmployees = employees.map((emp) => ({
        _id: emp._id,
        name: `${emp.personal.firstName} ${emp.personal.lastName || ""}`.trim(),
        email: emp.personal.email,
        employeeCode: emp.employment.employeeCode,
      }));

      return {
        data: formattedEmployees,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }
}

export default new AutomationRuleRepository();
