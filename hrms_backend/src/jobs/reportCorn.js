import cron from "node-cron";
import * as pulseEfficiencyService from "../services/pulseEfficiency.service.js";
import { sendReportEmail } from "../helper/reportMailer.js";
import User from "../models/user.Model.js";  

cron.schedule("0 9 1 * *", async () => {
// cron.schedule("* * * * *", async () => {
  console.log(" Starting Monthly Pulse Efficiency Report Job...");

  try {
    const users = await User.find({}, "_id email"); 

    if (!users || users.length === 0) {
      console.log(" No users found, skipping report job.");
      return;
    }

    const monthYear = new Date().toISOString().slice(0, 7); 
    const adminEmail = process.env.ADMIN_EMAIL; 

    let reports = [];

    for (const user of users) {
      const report = await pulseEfficiencyService.getPulseEfficiencyServiceMonthly(
        user._id,
        monthYear
      );
      reports.push({
        userId: user._id,
        email: user.email,
        report,
      });
    }

    await sendReportEmail({
      to: adminEmail,
      subject: `Monthly Pulse Efficiency Report - ${monthYear}`,
      report: reports, 
      type: "monthly-admin",
    });

    console.log(` Monthly report sent to Admin (${adminEmail})`);
  } catch (err) {
    console.error("Error while sending monthly reports:", err);
  }
});
