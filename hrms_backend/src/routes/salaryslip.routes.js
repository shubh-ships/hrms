import * as salaryslipController from '../controllers/salaryslip.controller.js';
import express from 'express';
import { protect } from '../middlewares/auth.js';

const router = express.Router();



router.post('/genrateSalarySlip',protect,salaryslipController.generateSalarySlip)
router.post('/genrateSalarySlip/:id',protect,salaryslipController.generateSalarySlipInParams);

export default router;