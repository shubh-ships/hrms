import express from 'express';
import * as organizationTimingController from '../controllers/organizationTiming.controller.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.get('/getOfficeTiming',protect,organizationTimingController.getOfficeTiming)
router.post('/createOfficeTiming',protect,organizationTimingController.createOfficeTiming)
router.put('/updateOfficeTiming',protect,organizationTimingController.updateOfficeTiming) 


export default router;