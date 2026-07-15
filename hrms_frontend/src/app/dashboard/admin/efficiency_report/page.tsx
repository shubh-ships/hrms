'use client'
import { usePathname } from "next/navigation";
import EfficiencyReport from "@/components/dashboard/ViewAllDashboards/Admin/efficiency-report/EfficiencyReport";
 
function page() {
  return (
    <>
      <EfficiencyReport />
    </>
  );
}
 
export default page;