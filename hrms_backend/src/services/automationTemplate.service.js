import automationRuleRepository from "../repositories/automationTemplate.repository.js";
import ApiError from "../utils/apiError.js";
import Employee from "../models/employee.Model.js";
import { AutomationRuleTemplate } from "../models/automationRuleTemplate.Model.js";
import mongoose from "mongoose";

class AutomationRuleService {
  // ---------- CREATE ----------
  async createAutomationRule(req) {
    const { organizationId } = req.user;
    const { type, name, rules } = req.body;

    // Basic required fields
    if (!organizationId || !type || !name) {
      throw new ApiError(400, "Missing required fields: type, name");
    }

    // Check uniqueness of name within organization
    const existing = await automationRuleRepository.findOne({
      organizationId,
      name,
    });
    if (existing) {
      throw new ApiError(
        409,
        "An automation rule with this name already exists in your organization",
      );
    }

    // Build the document
    const ruleData = {
      organizationId,
      type,
      name,
      rules: rules || {}, // rules object may contain nested fields
    };

    // Additional type-specific validations (optional – schema already enforces)
    this.validateTypeFields(type, rules);

    // Save
    const created = await automationRuleRepository.create(ruleData);
    return created;
  }

  // ---------- UPDATE ----------
  async updateAutomationRule(req) {
    const { organizationId } = req.user;
    const { id } = req.params;
    const { type, name, rules } = req.body;

    // Find existing rule and ensure it belongs to the organization
    const existingRule = await automationRuleRepository.findById(id);
    if (!existingRule) {
      throw new ApiError(404, "Automation rule not found");
    }

    // If name is being changed, check uniqueness (excluding current document)
    if (name && name !== existingRule.name) {
      const nameConflict = await automationRuleRepository.findOne({
        organizationId,
        name,
        _id: { $ne: id },
      });
      if (nameConflict) {
        throw new ApiError(
          409,
          "An automation rule with this name already exists in your organization",
        );
      }
    }

    // Build update payload
    const updateData = {};
    if (type) updateData.type = type;
    if (name) updateData.name = name;
    if (rules !== undefined) updateData.rules = rules; // rules can be an object

    // Type-specific validation (if type or rules changed)
    const finalType = type || existingRule.type;
    const finalRules = rules !== undefined ? rules : existingRule.rules;
    this.validateTypeFields(finalType, finalRules);

    // Perform update
    const updated = await automationRuleRepository.update(id, updateData);
    if (!updated) {
      throw new ApiError(500, "Failed to update automation rule");
    }
    return updated;
  }

  // ---------- DELETE ----------
  async deleteAutomationRule(req) {
    const { organizationId } = req.user;
    const { id } = req.params;

    const rule = await automationRuleRepository.findById(id);
    if (!rule) {
      throw new ApiError(404, "Automation rule not found");
    }

    const deleted = await automationRuleRepository.delete(id);
    return deleted; // or just return success indicator
  }

  // ---------- GET SINGLE ----------
  async getAutomationRule(req) {
    const { id } = req.params;

    const rule = await automationRuleRepository.findById(id);
    if (!rule) {
      throw new ApiError(404, "Automation rule not found");
    }
    return rule;
  }

  // ---------- GET BY TYPE (with optional filters) ----------
  async getAutomationRulesByType(req) {
    const { organizationId } = req.user;
    const { type } = req.query; // e.g., ?type=late_fine

    const query = { organizationId };
    if (type) {
      if (
        ![
          "late_fine",
          "early_out",
          "break",
          "overtime",
          "early_overtime",
        ].includes(type)
      ) {
        throw new ApiError(400, "Invalid type value");
      }
      query.type = type;
    }

    const rules = await automationRuleRepository.find(query);
    return rules;
  }

  // ---------- PRIVATE VALIDATION HELPER ----------
  validateTypeFields(type, rules) {
    // Additional business logic beyond schema can be added here.
    // For example, ensure that if type is "late_fine", at least one action rule is provided.
    if (!rules) return;

    if (["late_fine", "early_out", "break"].includes(type)) {
      // At least one of deductSalaryRule, markHalfDayRule, markAbsentRule should be non-null?
      // This is optional; if you want to enforce, uncomment below.
      if (
        !rules.deductSalaryRule &&
        !rules.markHalfDayRule &&
        !rules.markAbsentRule
      ) {
        throw new ApiError(
          400,
          `At least one action rule is required for type ${type}`,
        );
      }
    } else if (["overtime", "early_overtime"].includes(type)) {
      // Similarly, at least one salary addition rule?
      if (
        !rules.addSalaryRule &&
        !rules.addHalfDaySalaryRule &&
        !rules.addFullDaySalaryRule
      ) {
        throw new ApiError(
          400,
          `At least one salary addition rule is required for type ${type}`,
        );
      }
    }
  }

  async assignTemplate(req) {
    const { employeeId, templateId } = req.body;
    const assignedBy = req.user._id; // assuming user info is in req.user
    const { organizationId } = req.user;

    if (!organizationId) {
      throw new ApiError(400, "organizationId is required");
    }

    if (!employeeId || !templateId) {
      throw new ApiError(400, "employeeId and templateId are required");
    }

    // Optional: verify employee exists (if you have an employee repository)
    // const employee = await employeeRepository.findById(employeeId);
    // if (!employee) throw new ApiError(404, "Employee not found");

    // Verify template exists and belongs to the organization
    const template = await automationRuleRepository.findById(templateId);

    if (!template) {
      throw new ApiError(404, "Template not found or not accessible");
    }

    // Create assignment – repository will enforce unique (employeeId, type)
    const assignment = await automationRuleRepository.assign({
      employeeId,
      templateId,
      assignedBy,
      organizationId,
    });

    return assignment;
  }

  async unassignTemplate(req) {
    const { id } = req.params; // assignment id
    const { organizationId } = req.user;

    const assignment = await automationRuleRepository.findOneAssignee({
      _id: id,
    });
    if (!assignment) {
      throw new ApiError(404, "Assignment not found");
    }

    // Optional: verify that the template belongs to the same organization
    const template = await automationRuleRepository.findById(
      assignment.templateId,
    );

    if (!template) {
      throw new ApiError(403, "You cannot delete this assignment");
    }

    await automationRuleRepository.deleteAssignee(id);
    return { message: "Assignment removed successfully" };
  }

  async getAssignmentsByEmployee(req) {
    const { employeeId } = req.params;
    const { organizationId } = req.user;

    // Optional: verify employee belongs to same organization (if applicable)

    const assignments =
      await automationRuleRepository.findByEmployeeWithTemplate(
        employeeId,
        organizationId,
      );

    return assignments;
  }

  async getTemplateEmployees(req) {
    const { templateId } = req.params;
    const { unassignedStaff, page = 1, limit = 10, search } = req.query;
    const { organizationId } = req.user; // assume user object has organizationId

    // Validation
    if (!templateId) throw new ApiError(400, "Template ID is required");
    if (!mongoose.Types.ObjectId.isValid(templateId)) {
      throw new ApiError(400, "Invalid template ID format");
    }
    if (!organizationId) throw new ApiError(400, "Organization ID is required");

    // Verify template exists and belongs to organization
    const template = await AutomationRuleTemplate.findOne({
      _id: templateId,
      organizationId,
    });
    if (!template) {
      throw new ApiError(
        404,
        "Automation template not found in this organization",
      );
    }

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      search,
    };

    if (unassignedStaff === "true") {
      return await automationRuleRepository.findUnassignedToTemplate(
        templateId,
        organizationId,
        options,
        template.type, // pass type to exclude employees already assigned to any template of this type
      );
    } else {
      return await automationRuleRepository.findAssignedToTemplate(
        templateId,
        organizationId,
        options,
      );
    }
  }

  // For admin dashboard: get all assignments for an organization with pagination
  async getAllAssignments(req) {
    const { organizationId } = req.user;
    // This is more complex if you need to join with templates and employees.
    // You can implement a paginated aggregation pipeline.
    // For brevity, we return a simple list.
    const assignments =
      await automationRuleRepository.findAssignee(organizationId);

    return assignments;
  }

  async getTemplateAssignmentStatus(req) {
    const { templateId } = req.params;
    const { organizationId } = req.user;

    // Verify template
    const template = await automationRuleRepository.findById(templateId);

    if (!template) {
      throw new ApiError(404, "Template not found");
    }

    // Get all active employees (adjust status filter as needed)
    const allEmployees = await Employee.find({
      organizationId,
      "employment.status": "active", // optional
    });

    // Get assignments with populated employee details (using your updated populate)
    const assignments =
      await automationRuleRepository.findByTemplateWithEmployeeDetails(
        templateId,
      );

    const assignedEmployeeIds = new Set(
      assignments.map((a) => a.employeeId._id.toString()),
    );

    const assignedEmployees = assignments.map((a) => ({
      id: a.employeeId._id,
      name: `${a.employeeId.personal.firstName} ${a.employeeId.personal.lastName}`.trim(),
      shift: a.employeeId.shiftId
        ? { id: a.employeeId.shiftId._id, name: a.employeeId.shiftId.name }
        : null,
      employmentStatus: a.employeeId.employment?.status,
      assignedAt: a.assignedAt,
      assignedBy: a.assignedBy, // optionally populate user details
    }));

    const remainingEmployees = allEmployees
      .filter((emp) => !assignedEmployeeIds.has(emp._id.toString()))
      .map((emp) => ({
        id: emp._id,
        name: `${emp.personal.firstName} ${emp.personal.lastName}`.trim(),
        shift: emp.shiftId
          ? { id: emp.shiftId, name: emp.shiftId?.name }
          : null,
        employmentStatus: emp.employment?.status,
      }));

    return {
      templateId,
      templateName: template.name,
      totalEmployees: allEmployees.length,
      assignedCount: assignedEmployees.length,
      remainingCount: remainingEmployees.length,
      assignedEmployees,
      remainingEmployees,
    };
  }
}

export default new AutomationRuleService();
