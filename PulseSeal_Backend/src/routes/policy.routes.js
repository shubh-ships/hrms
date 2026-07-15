import express from "express";
import {createOrUpdatePolicy,getPolicy,getOrganizationPolicies,togglePolicyStatus } from "../controllers/policy.controller.js";
import { protect } from '../middlewares/auth.js';

const router = express.Router();

// Create or Update Policy
router.post("/", protect, createOrUpdatePolicy);

// Get All Policies for Organization
router.get("/organization", protect,getOrganizationPolicies);

// Get Policy by Organization and Name
router.get("/:id", protect,getPolicy);

// Deactivate Policy
router.patch("/:policyId/active-deactivate", protect,togglePolicyStatus );

// Apply Late Entry Policy to Attendance
router.post("/apply/late-entry/:attendanceId", async (req, res) => {
  try {
    const attendance = await PolicyController.applyLateEntryPolicy(req.params.attendanceId);
    res.json({ success: true, attendance });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Apply Overtime Policy to Attendance
router.post("/apply/overtime/:attendanceId", async (req, res) => {
  try {
    const attendance = await PolicyController.applyOvertimePolicy(req.params.attendanceId);
    res.json({ success: true, attendance });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Apply Early Overtime Policy to Attendance
router.post("/apply/early-overtime/:attendanceId", async (req, res) => {
  try {
    const attendance = await PolicyController.applyEarlyOvertimePolicy(req.params.attendanceId);
    res.json({ success: true, attendance });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;