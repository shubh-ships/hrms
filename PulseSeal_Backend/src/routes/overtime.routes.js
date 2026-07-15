import * as OvertimeController from "../controllers/overtime.controller.js";
import express from "express";
import { protect } from "../middlewares/auth.js";


const router = express.Router();

router.post("/monthly", protect, OvertimeController.fetchMonthlyOvertime);
// router.post("/monthly/:id", protect, OvertimeController.fetchMonthlyOvertimeByUserId);

export default router;
