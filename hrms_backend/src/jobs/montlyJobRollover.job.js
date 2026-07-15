import cron from "node-cron";
import Organization from "../models/organization.Model.js";
import { monthlyLeaveRollover } from "../controllers/leaveBalanceManager.js";
import ApiError from "../utils/apiError.js";

const scheduleMonthlyLeaveRollover = () => {
  cron.schedule("10 0 1 * *", async () => {
//   cron.schedule("* * * * *", async () => {
    console.log("monthly Leave Rollover Job Started:", new Date().toISOString());

    try {
      const activeOrganizations = await Organization.find({ is_active: true });

      if (!activeOrganizations.length) {
        console.log("No active organizations found for leave rollover.");
        return;
      }

      for (const org of activeOrganizations) {
        console.log(`🔹 Processing leave rollover for Organization: ${org.name} (${org._id})`);
        await monthlyLeaveRollover(org._id);
      }

      console.log(" Monthly Leave Rollover Job Completed Successfully:", new Date().toISOString());
    } catch (error) {
      console.error("Error during Monthly leave rollover job:", error.message);
      throw new ApiError(500, "Internal Server Error");
    }
  });
};

export default scheduleMonthlyLeaveRollover;
