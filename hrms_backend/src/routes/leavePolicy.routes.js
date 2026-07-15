import express from "express";
import { createLeavePolicy, getLeavePoliciesByOrganization, getLeavePolicyById, updateLeavePolicy, deleteLeavePolicy } from "../controllers/leavePolicy.controller.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();

router.post("/", protect, createLeavePolicy);
router.get("/organization",protect, getLeavePoliciesByOrganization);
router.get("/:policyId",protect, getLeavePolicyById);
router.put("/:policyId",protect, updateLeavePolicy);
router.delete("/:policyId",protect, deleteLeavePolicy);

export default router;