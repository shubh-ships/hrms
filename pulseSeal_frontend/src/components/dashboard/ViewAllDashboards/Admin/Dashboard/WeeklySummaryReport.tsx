"use client";

import type React from "react";
import { useEffect, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { listAllFrauds, selectAllFrauds, selectFraudLoading } from "@/features/fraud1/fraudSlice1";
import { getOrgIdFromToken } from "@/lib/authHelpers";
import dayjs from "dayjs";

// --- Types & Constants ---
const STATUS_CONFIG = {
  Flagged: { bg: "bg-[#EF4444]", text: "text-white" },
  Clean: { bg: "bg-[#22C55E]", text: "text-white" },
  Suspicious: { bg: "bg-[#F97316]", text: "text-white" },
} as const;

// --- Sub-components ---

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.Flagged;
  let bg = config.bg;
  if (status === "Resolved") bg = "bg-[#22C55E]";
  
  return (
    <div className={cn(
      "inline-flex items-center justify-center rounded-[100px] text-[8px] font-medium w-[49px] h-[18px]",
      bg,
      config.text
    )}>
      {status}
    </div>
  );
};

const WeeklySummaryReport: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const frauds = useAppSelector(selectAllFrauds);
  const loading = useAppSelector(selectFraudLoading);

  useEffect(() => {
    const orgId = getOrgIdFromToken();
    if (orgId) {
      dispatch(listAllFrauds(orgId));
    }
  }, [dispatch]);

  const displayData = useMemo(() => {
    if (!Array.isArray(frauds)) return [];

    // Get current week start (Monday) to match backend logic
    const now = dayjs();
    const dayOfWeek = now.day(); // 0=Sunday, 1=Monday...
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startOfWeek = now.subtract(diffToMonday, "day").startOf("day");
    
    // Filter frauds to show only this week's data
    return frauds.filter((item) => {
      const itemDate = dayjs(item.createdAt);
      return itemDate.isSame(startOfWeek) || itemDate.isAfter(startOfWeek);
    });
  }, [frauds]);

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] p-[40px] space-y-8 font-sans">
      {/* Header Section */}
      <div className="flex flex-col gap-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#3F5A54] hover:text-[#1E293B] transition-colors w-fit group"
        >
          <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[16px] font-medium">Back</span>
        </button>
        <h1 className="text-[20px] font-semibold text-[#1F2937] tracking-tight">Weekly Summary</h1>
      </div>

      {/* Main Table Content */}
      <div className="bg-white rounded-[8px] shadow-sm border border-[#F0F0F0] overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-[400px] gap-3">
              <Loader2 className="w-8 h-8 text-[#3F5A54] animate-spin" />
              <p className="text-[#4B5563] text-sm animate-pulse">Fetching report data...</p>
            </div>
          ) : (
            <Table className="table-fixed w-full">
              <TableHeader className="bg-[#F0F0F0] text-[12px] font-medium text-[#4B5563] border-none">
                <TableRow className="h-[39px] border-none hover:bg-transparent">
                  <TableHead className="border-none w-[20%] px-6 h-[39px]">Username</TableHead>
                  <TableHead className="border-none w-[20%] px-6 h-[39px] text-left">Assignment Title</TableHead>
                  <TableHead className="border-none w-[20%] px-6 h-[39px] text-left">Fraud Type</TableHead>
                  <TableHead className="border-none w-[20%] px-6 h-[39px] text-center">Status</TableHead>
                  <TableHead className="border-none w-[20%] px-6 h-[39px] text-center">Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayData.length > 0 ? (
                  displayData.map((item, index) => (
                    <TableRow
                      key={item._id || index}
                      className="border-b border-[#E5E7EB] last:border-b-0 hover:bg-gray-50 transition-colors"
                    >
                      <TableCell className="py-[10px] px-6 border-none overflow-hidden text-ellipsis whitespace-nowrap">
                        <span className="text-[12px] font-regular text-[#1F2937] truncate block">
                          {item.user_id?.name || "N/A"}
                        </span>
                      </TableCell>
                      <TableCell className="py-[10px] px-6 border-none overflow-hidden text-ellipsis whitespace-nowrap">
                        <span className="text-[12px] text-[#1F2937] font-regular truncate block">
                          {item.assignmentId?.title || "N/A"}
                        </span>
                      </TableCell>
                      <TableCell className="py-[10px] px-6 border-none overflow-hidden text-ellipsis whitespace-nowrap">
                        <span className="text-[12px] text-[#1F2937] font-regular truncate block" title={item.fraudType}>
                          {item.fraudType}
                        </span>
                      </TableCell>
                      <TableCell className="py-[10px] px-6 border-none text-center">
                        <StatusBadge status={item.status} />
                      </TableCell>
                      <TableCell className="py-[10px] px-6 border-none text-center">
                        <span className="text-[12px] font-regular text-[#9CA3AF]">
                          {item.createdAt ? dayjs(item.createdAt).format("DD/MM/YYYY") : "N/A"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                     <TableCell colSpan={5} className="h-[200px] text-center text-[#4B5563] text-sm italic">
                        No summary data found for the current period.
                     </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeeklySummaryReport;

