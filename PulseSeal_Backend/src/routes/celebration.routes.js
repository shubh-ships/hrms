import express from "express";
import {
  getBirthdayList,
  getAnniversaryList,
} from "../controllers/celebration.controller.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();

router.use(protect); // All routes require authentication

router.get("/birthdays", getBirthdayList);
router.get("/anniversaries", getAnniversaryList);

export default router;
