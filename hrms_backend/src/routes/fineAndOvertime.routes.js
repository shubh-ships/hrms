import express from "express";
import { protect } from "../middlewares/auth.js";
import * as fineAndOvertimeController from "../controllers/fineAndOvertime.controller.js";

const router = express.Router();

router.use(protect);


// ✅ Create Fine
router.post("/fine", fineAndOvertimeController.createFine);

// ✅ Create Overtime
router.post("/overtime", fineAndOvertimeController.createOvertime);


router.patch("/action", fineAndOvertimeController.handleAction);

export default router;