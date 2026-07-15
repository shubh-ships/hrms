import cron from "node-cron";
import TotalWorkingDays from "../models/workingDays.Model.js";
import Organization from "../models/organization.Model.js";

cron.schedule("0 0 1 * *", async () => {
  try {
    const now = new Date();
    const currentMonth = now.toLocaleString("default", { month: "long", timeZone: "Asia/Kolkata" });
    const currentYear = now.getFullYear().toString();

    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonth = prevDate.toLocaleString("default", { month: "long", timeZone: "Asia/Kolkata" });
    const prevYear = prevDate.getFullYear().toString();

    const organizations = await Organization.find();

    for (const org of organizations) {
      const existing = await TotalWorkingDays.findOne({
        month: currentMonth,
        year: currentYear,
        organizationId: org._id,
      });

      if (existing) {
        console.log(`Skipping ${org.name} - ${currentMonth} ${currentYear} (already exists)`);
        continue; 
      }

  
      const prevRecord = await TotalWorkingDays.findOne({
        month: prevMonth,
        year: prevYear,
        organizationId: org._id,
      });

      const totalWorkingDays = prevRecord?.totalWorkingDays ?? 30;
      const isWeekOffIncludes = prevRecord?.isWeekOffIncludes ?? true;

      
      await TotalWorkingDays.create({
        month: currentMonth,
        year: currentYear,
        organizationId: org._id,
        totalWorkingDays,
        isWeekOffIncludes,
      });

      console.log(
        ` Created working days for ${org.name} - ${currentMonth} ${currentYear} (copied from ${prevMonth} ${prevYear})`
      );
    }

    console.log(" Monthly working days check complete.");
  } catch (err) {
    console.error(" Error creating monthly working days:", err);
  }
});
