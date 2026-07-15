import weeklyOffTemplateRepository from "../repositories/weekOffTemplate.repository.js";
import ApiError from "../utils/apiError.js";
import mongoose from "mongoose";

class WeeklyOffTemplateService {
  async createWeeklyOffTemplate(req) {
    const { organizationId } = req.user;
    const { name, rules } = req.body;
    const creator = req.user?.id || req.body.creator;

    // Validate required fields
    if (!organizationId || !name || !creator) {
      throw new ApiError(
        400,
        "Missing required fields: organizationId, name, creator",
      );
    }

    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      throw new ApiError(400, "Invalid organization ID format");
    }

    if (!mongoose.Types.ObjectId.isValid(creator)) {
      throw new ApiError(400, "Invalid creator ID format");
    }

    // Check if template with same name exists in organization
    const existingTemplate =
      await weeklyOffTemplateRepository.findByNameAndOrganization(
        name,
        organizationId,
      );

    if (existingTemplate) {
      throw new ApiError(
        409,
        "Weekly off template with this name already exists in your organization",
      );
    }

    // Validate rules if provided
    if (rules && rules.length > 0) {
      this.validateRules(rules);
    }

    const weeklyOffTemplateData = {
      organizationId,
      name,
      rules: rules || [],
      creator,
    };

    const weeklyOffTemplate = await weeklyOffTemplateRepository.create(
      weeklyOffTemplateData,
    );
    return weeklyOffTemplate;
  }

  async getWeeklyOffTemplateById(req) {
    const { id } = req.params;

    if (!id) {
      throw new ApiError(400, "Weekly off template ID is required");
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(400, "Invalid weekly off template ID format");
    }

    const weeklyOffTemplate = await weeklyOffTemplateRepository.findById(id);
    return weeklyOffTemplate;
  }

  async getAllWeeklyOffTemplates(req) {
    const { organizationId } = req.user;
    const { page = 1, limit = 10, search } = req.query;

    if (!organizationId) {
      throw new ApiError(400, "Organization ID is required");
    }

    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      throw new ApiError(400, "Invalid organization ID format");
    }

    const query = { organizationId };

    // Add search functionality
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
    };

    const result = await weeklyOffTemplateRepository.findAll(query, options);
    return result;
  }

  async updateWeeklyOffTemplate(req) {
    const { id } = req.params;
    const updateData = req.body;

    if (!id) {
      throw new ApiError(400, "Weekly off template ID is required");
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(400, "Invalid weekly off template ID format");
    }

    // Check if template exists
    const existingTemplate = await weeklyOffTemplateRepository.findById(id);

    // If updating name, check for duplicates in same organization
    if (updateData.name && updateData.name !== existingTemplate.name) {
      const duplicateTemplate =
        await weeklyOffTemplateRepository.findByNameAndOrganization(
          updateData.name,
          existingTemplate.organizationId,
          id,
        );

      if (duplicateTemplate) {
        throw new ApiError(
          409,
          "Weekly off template with this name already exists in your organization",
        );
      }
    }

    // Validate rules if updating
    if (updateData.rules) {
      this.validateRules(updateData.rules);
    }

    const updatedTemplate = await weeklyOffTemplateRepository.update(
      id,
      updateData,
    );
    return updatedTemplate;
  }

  async deleteWeeklyOffTemplate(req) {
    const { id } = req.params;

    if (!id) {
      throw new ApiError(400, "Weekly off template ID is required");
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(400, "Invalid weekly off template ID format");
    }

    // Check if template exists before deleting
    await weeklyOffTemplateRepository.findById(id);

    return await weeklyOffTemplateRepository.delete(id);
  }

  // Helper method to validate rules
  validateRules(rules) {
    if (!Array.isArray(rules)) {
      throw new ApiError(400, "Rules must be an array");
    }

    const daysSet = new Set();

    rules.forEach((rule, index) => {
      // Validate day
      if (rule.day === undefined || rule.day < 0 || rule.day > 6) {
        throw new ApiError(
          400,
          `Invalid day value at index ${index}. Day must be between 0 (Sunday) and 6 (Saturday)`,
        );
      }

      // Check for duplicate days
      if (daysSet.has(rule.day)) {
        throw new ApiError(400, `Duplicate rule for day ${rule.day} found`);
      }
      daysSet.add(rule.day);

      // Validate weekOffs if provided
      if (rule.weekOffs && rule.weekOffs.length > 0) {
        this.validateWeekOffs(rule.weekOffs, rule.day);
      }
    });
  }

  // Helper method to validate week offs
  validateWeekOffs(weekOffs, day) {
    if (!Array.isArray(weekOffs)) {
      throw new ApiError(400, "Week offs must be an array");
    }

    const weekNumbersSet = new Set();

    weekOffs.forEach((weekOff, index) => {
      // Validate week number
      if (
        !weekOff.weekNumber ||
        weekOff.weekNumber < 1 ||
        weekOff.weekNumber > 5
      ) {
        throw new ApiError(
          400,
          `Invalid week number at index ${index} for day ${day}. Week number must be between 1 and 5`,
        );
      }

      // Check for duplicate week numbers
      if (weekNumbersSet.has(weekOff.weekNumber)) {
        throw new ApiError(
          400,
          `Duplicate week number ${weekOff.weekNumber} found for day ${day}`,
        );
      }
      weekNumbersSet.add(weekOff.weekNumber);

      // Validate type
      if (weekOff.type && !["FULL_DAY", "HALF_DAY"].includes(weekOff.type)) {
        throw new ApiError(
          400,
          `Invalid type at index ${index} for day ${day}. Type must be FULL_DAY or HALF_DAY`,
        );
      }
    });
  }

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
    const template = await weeklyOffTemplateRepository.findOne({
      _id: templateId,
      organizationId,
    });
    if (!template) {
      throw new ApiError(
        404,
        "Weekly off template not found in this organization",
      );
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      search,
    };

    if (unassignedStaff === "true") {
      // Get employees not assigned to this template
      return await weeklyOffTemplateRepository.findUnassignedToTemplate(
        templateId,
        organizationId,
        options,
      );
    } else {
      // Get employees assigned to this template
      return await weeklyOffTemplateRepository.findAssignedToTemplate(
        templateId,
        organizationId,
        options,
      );
    }
  }

  async assignEmployeesToTemplate(req) {
    const { templateId } = req.params;
    const { staffIds } = req.body;
    const { organizationId } = req.user; // or from user

    if (!templateId) {
      throw new ApiError(400, "Template ID is required");
    }
    if (!staffIds || !Array.isArray(staffIds) || staffIds.length === 0) {
      throw new ApiError(400, "Staff IDs array is required");
    }
    if (!organizationId) {
      throw new ApiError(400, "Organization ID is required");
    }

    if (!mongoose.Types.ObjectId.isValid(templateId)) {
      throw new ApiError(400, "Invalid template ID format");
    }

    // Verify template exists and belongs to organization
    const template = await weeklyOffTemplateRepository.findOne({
      _id: templateId,
      organizationId,
    });
    if (!template) {
      throw new ApiError(
        404,
        "Weekly off template not found in this organization",
      );
    }

    // Validate all staffIds belong to the organization
    await weeklyOffTemplateRepository.validateStaffIds(
      staffIds,
      organizationId,
    );

    // Assign template to employees
    const result = await weeklyOffTemplateRepository.assignTemplateToEmployees(
      templateId,
      staffIds,
    );

    return {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    };
  }

  async removeEmployeesFromTemplate(req) {
    const { templateId } = req.params;
    const { staffIds } = req.body;
    const { organizationId } = req.user; // or from user

    if (!templateId) {
      throw new ApiError(400, "Template ID is required");
    }
    if (!staffIds || !Array.isArray(staffIds) || staffIds.length === 0) {
      throw new ApiError(400, "Staff IDs array is required");
    }
    if (!organizationId) {
      throw new ApiError(400, "Organization ID is required");
    }

    if (!mongoose.Types.ObjectId.isValid(templateId)) {
      throw new ApiError(400, "Invalid template ID format");
    }

    // Verify template exists (optional, but good)
    const template = await weeklyOffTemplateRepository.findOne({
      _id: templateId,
      organizationId,
    });
    if (!template) {
      throw new ApiError(
        404,
        "Weekly off template not found in this organization",
      );
    }

    // Validate all staffIds belong to the organization
    await weeklyOffTemplateRepository.validateStaffIds(
      staffIds,
      organizationId,
    );

    // Remove template from employees (set to null)
    const result =
      await weeklyOffTemplateRepository.removeTemplateFromEmployees(staffIds);

    return {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    };
  }
}

export default new WeeklyOffTemplateService();
