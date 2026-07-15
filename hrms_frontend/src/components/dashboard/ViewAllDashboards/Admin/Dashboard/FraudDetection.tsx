"use client";

import type React from "react";
import { useEffect, useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Flag,
  X,
  Search,
  Filter,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useRouter } from "next/navigation";
import {
  listAllFrauds,
  cleanFraud,
} from "@/features/fraud1/fraudSlice1";
import { toast } from "sonner";
import type { FraudRecord, FraudStatus } from "@/lib/types/api/fraud";
import { getOrgIdFromToken } from "@/lib/authHelpers";

// --- Types & Constants ---

type Status = FraudStatus;

const STATUS_CONFIG = {
  Flagged: {
    bg: "bg-[#EF4444]",
    text: "text-white",
    iconBg: "bg-[#FFF1F0]",
    iconColor: "text-red-400",
    activeIconBg: "bg-red-50 text-red-500",
  },
  Suspicious: {
    bg: "bg-[#F97316]",
    text: "text-white",
    iconBg: "bg-[#FFF7ED]",
    iconColor: "text-orange-400",
    activeIconBg: "bg-orange-50 text-orange-500",
  },
  Clean: {
    bg: "bg-[#22C55E]",
    text: "text-white",
    iconBg: "bg-[#F0FFF4]",
    iconColor: "text-green-400",
    activeIconBg: "bg-green-50 text-green-500",
  },
} as const;

// --- Sub-components ---

const StatusBadge: React.FC<{ status: Status }> = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.Suspicious;
  return (
    <div className={cn(
      "inline-flex items-center justify-center rounded-[100px] text-[8px] font-medium w-[49px] h-[18px]",
      config.bg,
      config.text
    )}>
      {status}
    </div>
  );
};

const ActionButton: React.FC<{
  type: Status;
  isCurrent: boolean;
  onClick: () => void;
}> = ({ type, isCurrent, onClick }) => {
  const config = STATUS_CONFIG[type];
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-[20px] h-[20px] rounded-[2px] flex items-center justify-center transition-colors",
        isCurrent ? config.activeIconBg : `${config.iconBg} ${config.iconColor} hover:bg-opacity-80`
      )}
      title={`Mark as ${type}`}
    >
      <Flag className="h-[14px] w-[14px]" fill={isCurrent ? "currentColor" : "none"} />
    </button>
  );
};

const FraudDetailPanel: React.FC<{
  fraud: FraudRecord | null;
  onClose: () => void;
}> = ({ fraud, onClose }) => {
  if (!fraud) return null;

  return (
    <Card className="w-full border-0 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between px-0 pt-0">
        <CardTitle className="text-xl font-bold">Fraud Details</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
          <X className="h-5 w-5 text-gray-400" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6 px-0 pb-0">
        <DetailItem label="User Name" value={fraud.user_id.name} isPrimary />
        <DetailItem label="Assignment Title" value={fraud.assignmentId.title} />
        <DetailItem label="Fraud Type" value={fraud.fraudType} />
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</label>
          <div className="pt-1">
            <StatusBadge status={fraud.status as Status} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <DetailItem label="Created At" value={new Date(fraud.createdAt).toLocaleString()} />
          <DetailItem label="Updated At" value={new Date(fraud.updatedAt).toLocaleString()} />
        </div>
      </CardContent>
    </Card>
  );
};

const DetailItem: React.FC<{ label: string; value: string; isPrimary?: boolean }> = ({ label, value, isPrimary }) => (
  <div className="space-y-1">
    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</label>
    <p className={cn("text-gray-700", isPrimary ? "text-lg font-bold" : "text-sm font-medium")}>
      {value}
    </p>
  </div>
);

// --- Main Component ---

const FraudDetection: React.FC = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { allFrauds, loading } = useAppSelector((state) => state.fraud1);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFraud, setSelectedFraud] = useState<FraudRecord | null>(null);

  useEffect(() => {
    const orgId = getOrgIdFromToken();
    if (orgId) {
      dispatch(listAllFrauds(orgId));
    }
  }, [dispatch]);

  const filteredData = useMemo(() => {
    return allFrauds.filter((item: FraudRecord) => {
      const search = searchTerm.toLowerCase();
      return (
        item.user_id.name.toLowerCase().includes(search) ||
        item.assignmentId.title.toLowerCase().includes(search) ||
        item.fraudType.toLowerCase().includes(search)
      );
    });
  }, [allFrauds, searchTerm]);

  const handleStatusChange = async (fraudId: string, newStatus: Status) => {
    try {
      await dispatch(cleanFraud({ fraudId, status: newStatus })).unwrap();
      toast.success(`Status updated to ${newStatus}`);
      const orgId = getOrgIdFromToken();
      if (orgId) dispatch(listAllFrauds(orgId));
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

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
        <div className="flex items-center justify-between">
          <h1 className="text-[20px] font-semibold text-[#1F2937] tracking-tight">Fraud Detection</h1>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="bg-white rounded-[8px] shadow-sm border border-[#F0F0F0]  overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8"></div>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400 space-y-2">
            <Filter className="h-10 w-10 opacity-20" />
            <p className="text-sm font-medium">No fraud records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="table-fixed w-full">
              <TableHeader className="bg-[#F0F0F0] text-[12px] font-medium text-[#4B5563] border-none">
                <TableRow className="h-[39px] border-none hover:bg-transparent">
                  <TableHead className="border-none w-[16.6%] px-6">Username</TableHead>
                  <TableHead className="border-none w-[16.6%] px-6 text-left">Assignment Title</TableHead>
                  <TableHead className="border-none w-[16.6%] px-6 text-left">Fraud Type</TableHead>
                  <TableHead className="border-none w-[16.6%] px-6 text-center">Status</TableHead>
                  <TableHead className="border-none w-[16.6%] px-6 text-center">Created At</TableHead>
                  <TableHead className="border-none w-[16.6%] px-6 text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item) => (
                  <TableRow
                    key={item._id}
                    className="border-b border-[#E5E7EB] last:border-b-0 hover:bg-blue-50/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedFraud(item)}
                  >
                    <TableCell className="py-[10px] px-6 border-none overflow-hidden text-ellipsis whitespace-nowrap">
                      <span className="text-[12px] font-regular text-[#1F2937] truncate block">{item.user_id.name}</span>
                    </TableCell>
                    <TableCell className="py-[10px] px-6 border-none overflow-hidden text-ellipsis whitespace-nowrap">
                      <span className="text-[12px] text-[#1F2937] font-regular truncate block">{item.assignmentId.title}</span>
                    </TableCell>
                    <TableCell className="py-[10px] px-6 border-none overflow-hidden text-ellipsis whitespace-nowrap">
                      <span className="text-[12px] text-[#1F2937] font-regular truncate block" title={item.fraudType}>
                        {item.fraudType}
                      </span>
                    </TableCell>
                    <TableCell className="py-[10px] px-6 border-none text-center">
                      <StatusBadge status={item.status as Status} />
                    </TableCell>
                    <TableCell className="py-[10px] px-6 border-none text-center">
                      <span className="text-[12px] font-regular text-[#9CA3AF]">
                        {new Date(item.createdAt).toLocaleDateString("en-GB")}
                      </span>
                    </TableCell>
                    <TableCell className="py-[10px] px-6 border-none" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <ActionButton
                          type="Flagged"
                          isCurrent={item.status === "Flagged"}
                          onClick={() => handleStatusChange(item._id, "Flagged")}
                        />
                        <ActionButton
                          type="Clean"
                          isCurrent={item.status === "Clean"}
                          onClick={() => handleStatusChange(item._id, "Clean")}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Slideout Detail Panel */}
      {selectedFraud && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setSelectedFraud(null)} />
          <div className="relative w-[480px] h-full bg-white shadow-[-8px_0_24px_rgba(0,0,0,0.1)] p-8 animate-in slide-in-from-right duration-300">
            <FraudDetailPanel
              fraud={selectedFraud}
              onClose={() => setSelectedFraud(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FraudDetection;
