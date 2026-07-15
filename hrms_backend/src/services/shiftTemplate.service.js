import shiftTemplateRepository from "../repositories/shiftTemplate.repository.js";
import ApiError from "../utils/apiError.js";
import mongoose from "mongoose";

class ShiftTemplateService {
  // ─── Helper ──────────────────────────────────────────────────────────────

  #validateObjectId(id, label = "ID") {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(400, `Invalid ${label} format`);
    }
  }

  #validateEmployeeIds(employees) {
    if (!employees || !Array.isArray(employees) || employees.length === 0) {
      throw new ApiError(400, "employees must be a non-empty array");
    }
    employees.forEach((id, i) => {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, `Invalid employee ID at index ${i}: ${id}`);
      }
    });
  }
  async validateShift(data, excludeId = null) {
    // 🟢 ADDED: shiftCode validation
    if (!data.shiftCode) {
      throw new ApiError(400, "shiftCode is required");
    }

    const existing = await shiftTemplateRepository.findAllShiftTemplates({
      shiftCode: data.shiftCode.toUpperCase(),
      ...(excludeId && { _id: { $ne: excludeId } }),
    });

    if (existing.length > 0) {
      throw new ApiError(409, "Shift code already exists");
    }

    // 🔽 EXISTING LOGIC

    if (data.shiftType === "FIXED_SHIFT") {
      if (!data.startTime || !data.endTime || !data.minFullDayMinutes || !minHalfDayMinutes) {
        throw new ApiError(400, "StartTime, EndTime, Minimum FullDay Minutes and Minimum Half Day Minutes are required for FIXED_SHIFT");
      }

      if (data.breaks && !Array.isArray(data.breaks)) {
        throw new ApiError(400, "Breaks must be an array");
      }
    }

    if (data.shiftType === "OPEN_SHIFT") {
      const requiredFields = [
        "totalWorkingMinutes",
        "breakDuration",
        "minHalfDayMinutes",
        "minFullDayMinutes",
      ];

      requiredFields.forEach((field) => {
        if (data[field] == null) {
          throw new ApiError(400, `${field} is required for OPEN_SHIFT`);
        }
      });
      if (data.totalWorkingMinutes < data.minFullDayMinutes) {
        throw new ApiError(
          400,
          "totalWorkingMinutes must be greater than or equal to minFullDayMinutes",
        );
      }
      if (data.minFullDayMinutes <= data.minHalfDayMinutes) {
        throw new ApiError(
          400,
          "minFullDayMinutes must be greater than minHalfDayMinutes",
        );
      }
    }

    // 🔴 REMOVED: workHours validation (old model)
  }

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  async createShiftTemplate(req) {
    const { organizationId } = req.user;
    const data = req.body;
    if (!organizationId) {
      throw new ApiError(400, "Organization ID is required");
    }
    this.#validateObjectId(organizationId, "organization ID");

    // 🟢 UPDATED: central validation handles everything
    await this.validateShift(data);
    // Required field validation

    const shiftTemplate = await shiftTemplateRepository.createShiftTemplate({
      ...data,
      organizationId,
    });

    return shiftTemplate;
  }

  async getAllShiftTemplates(req) {
    const { organizationId } = req.user;
    const { search } = req.query;

    if (!organizationId) {
      throw new ApiError(400, "Organization ID is required");
    }
    this.#validateObjectId(organizationId, "organization ID");

    const query = { organizationId };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { shiftCode: { $regex: search, $options: "i" } },
      ];
    }

    return shiftTemplateRepository.findAllShiftTemplates(query);
  }

  async getShiftTemplateById(req) {
    const { id } = req.params;

    if (!id) throw new ApiError(400, "Shift template ID is required");
    this.#validateObjectId(id, "shift template ID");

    return shiftTemplateRepository.findShiftTemplateById(id);
  }

  async updateShiftTemplate(req) {
    const { id } = req.params;
    const updateData = req.body;

    if (!id) throw new ApiError(400, "Shift template ID is required");
    this.#validateObjectId(id, "shift template ID");
    // await this.validateShift(updateData, id); // Validate with existing ID to exclude from duplicate check
    // // Fetch existing template

    const duplicate = await shiftTemplateRepository.findShiftByCode(
      updateData.shiftCode,
      id,
    );
    if (duplicate) {
      throw new ApiError(
        409,
        `Shift template with code "${updateData.shiftCode.toUpperCase()}" already exists`,
      );
    }

    // Validate employee IDs if being updated
    if (updateData.employees && updateData.employees.length > 0) {
      this.#validateEmployeeIds(updateData.employees);
    }

    return shiftTemplateRepository.updateShiftTemplate(id, updateData);
  }

  async deleteShiftTemplate(req) {
    const { id } = req.params;

    if (!id) throw new ApiError(400, "Shift template ID is required");
    this.#validateObjectId(id, "shift template ID");

    // Existence check
    await shiftTemplateRepository.findShiftTemplateById(id);
    return shiftTemplateRepository.deleteShiftTemplate(id);
  }

  // ─── Employee Assignment ──────────────────────────────────────────────────

  async getTemplateEmployees(req) {
    const { templateId } = req.params;
    const { unassignedStaff, page = 1, limit = 10, search } = req.query;
    const { organizationId } = req.user; // assuming organizationId is passed in query or from user

    if (!templateId) {
      throw new ApiError(400, "Template ID is required");
    }
    if (!mongoose.Types.ObjectId.isValid(templateId)) {
      throw new ApiError(400, "Invalid template ID format");
    }
    if (!organizationId) {
      throw new ApiError(400, "Organization ID is required");
    }

    // Verify template exists and belongs to organization
    const template = await shiftTemplateRepository.findShiftTemplateById(templateId);
    if (!template) {
      throw new ApiError(404, "Shift template not found in this organization");
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      search,
    };

    if (unassignedStaff === "true") {
      // Get employees not assigned to this template
      return await shiftTemplateRepository.findUnassignedToTemplate(
        templateId,
        organizationId,
        options,
      );
    } else {
      // Get employees assigned to this template
      return await shiftTemplateRepository.findAssignedToTemplate(
        templateId,
        organizationId,
        options,
      );
    }
  }

  async assignEmployeesToShift(req) {
    const { shiftTemplateId, employees } = req.body;

    if (!shiftTemplateId)
      throw new ApiError(400, "shiftTemplateId is required");
    this.#validateObjectId(shiftTemplateId, "shift template ID");
    this.#validateEmployeeIds(employees);

    // Ensure shift exists
    const shift =
      await shiftTemplateRepository.findShiftTemplateById(shiftTemplateId);

    if (!shift) {
      throw new ApiError(404, "Shift template not found");
    }

    return shiftTemplateRepository.assignEmployeesToShift(
      shiftTemplateId,
      employees,
    );
  }

  async removeEmployeesFromShift(req) {
    const { shiftTemplateId, employees } = req.body;

    if (!shiftTemplateId) {
      throw new ApiError(400, "shiftTemplateId is required");
    }

    this.#validateObjectId(shiftTemplateId, "shift template ID");
    this.#validateEmployeeIds(employees);

    // ✅ Delegate everything to repo
    const result = await shiftTemplateRepository.removeEmployeesFromShift(
      shiftTemplateId,
      employees,
    );

    // Optional validation based on repo response
    if (result.notAssigned?.length > 0) {
      throw new ApiError(
        400,
        `These employees are not assigned to this shift: ${result.notAssigned.join(", ")}`,
      );
    }

    return result;
  }
}

export default new ShiftTemplateService();
