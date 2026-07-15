import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type TabType = "Loans" | "Loan Applications";

interface LoansFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: TabType;
  selectedStatus: string[];
  selectedInterest: string | null;
  onApply: (status: string[], interest: string | null) => void;
}

export default function LoansFilterModal({
  isOpen,
  onClose,
  activeTab,
  selectedStatus,
  selectedInterest,
  onApply
}: LoansFilterModalProps) {
  const [localStatus, setLocalStatus] = useState<string[]>([]);
  const [localInterest, setLocalInterest] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLocalStatus(selectedStatus);
      setLocalInterest(selectedInterest);
    }
  }, [isOpen, selectedStatus, selectedInterest]);

  const statusOptions =
    activeTab === "Loans"
      ? ["Open", "Closed", "Paused", "Written off"]
      : [
          "Pending",
          "Expired",
          "Rejected",
          "Approved",
          "Partially Approved",
        ];

  const interestOptions = ["Simple Interest", "Compound Interest"];

  const toggleStatus = (status: string) => {
    if (localStatus.includes(status)) {
      setLocalStatus(localStatus.filter((s) => s !== status));
    } else {
      setLocalStatus([...localStatus, status]);
    }
  };

  const handleClear = () => {
    setLocalStatus([]);
    setLocalInterest(null);
    onApply([], null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[420px] p-6 bg-white overflow-hidden rounded-[20px] border-none shadow-[0_8px_30px_rgb(0,0,0,0.08)] [&>button]:right-5 [&>button]:top-5 [&>button]:bg-gray-100 [&>button]:rounded-md [&>button]:w-7 [&>button]:h-7 [&>button]:flex [&>button]:items-center [&>button]:justify-center [&>button]:opacity-100 hover:[&>button]:bg-gray-200">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-[22px] font-bold text-gray-900 tracking-tight text-left">
            Filter By
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          {/* Status Section */}
          <div className="flex flex-col gap-4">
            <h3 className="text-[17px] font-bold text-gray-900">Status</h3>
            <div className="flex flex-wrap gap-2.5">
              {statusOptions.map((status) => {
                const isSelected = localStatus.includes(status);
                return (
                  <button
                    key={status}
                    onClick={() => toggleStatus(status)}
                    className={`px-4 py-2 rounded-full text-[14px] font-medium transition-colors border
                      ${
                        isSelected
                          ? "bg-slate-100 border-gray-300 text-gray-900"
                          : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-800"
                      }
                    `}
                  >
                    {status}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="w-full h-px bg-gray-100 my-2" />

          {/* Interest Type Section */}
          <div className="flex flex-col gap-4">
            <h3 className="text-[17px] font-bold text-gray-900">
              Interest Type
            </h3>
            <div className="flex flex-col gap-5">
              {interestOptions.map((interest) => {
                const isSelected = localInterest === interest;
                return (
                  <label
                    key={interest}
                    className="flex items-center gap-3.5 cursor-pointer group"
                    onClick={(e) => {
                      e.preventDefault();
                      setLocalInterest(interest);
                    }}
                  >
                    <div
                      className={`w-[22px] h-[22px] shrink-0 rounded-full border-[1.5px] flex items-center justify-center transition-colors
                        ${
                          isSelected
                            ? "border-gray-500"
                            : "border-gray-400 group-hover:border-gray-500"
                        }
                      `}
                    >
                      {isSelected && (
                        <div className="w-2.5 h-2.5 rounded-full bg-gray-600 shadow-sm" />
                       )}
                    </div>
                    <span
                      className="text-[15px] text-gray-700 font-medium select-none"
                    >
                      {interest}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-row gap-4 mt-8">
          <button
            onClick={handleClear}
            className="flex-1 py-3 px-4 bg-white border border-gray-300 text-gray-600 rounded-[10px] text-[15px] font-medium hover:bg-gray-50 hover:text-gray-800 transition-colors"
          >
            Clear Filter
          </button>
          <button
            onClick={() => {
              onApply(localStatus, localInterest);
              onClose();
            }}
            className="flex-1 py-3 px-4 bg-[#3f5a54] text-white rounded-[10px] text-[15px] font-medium hover:bg-[#3f5a54]/90 transition-colors shadow-sm"
          >
            Apply Filter
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
