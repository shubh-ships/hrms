"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Filter, Calendar, Clock, Paperclip } from "lucide-react";
import movebackIcon from '@/assets/Dashicons/move-back-icon.png';
import BroadcastAttachmentsModal from "./BroadcastAttachmentsModal";
import BroadcastFilterModal from "./BroadcastFilterModal";

export default function BroadcastMessagesPage() {
  const [isAttachmentsOpen, setIsAttachmentsOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return (
    <div className="w-full min-h-screen bg-[#fcfcfc] p-4 lg:p-8 relative pb-32">
      <div className="max-w-[1400px] mx-auto w-full">

        {/* Header Area */}
        <div className="mb-8 flex flex-col items-start min-w-0">
          <Link href="/dashboard/dynamic/hrms/dashboard" className="inline-block mb-7 hover:opacity-80 transition-opacity">
            <Image src={movebackIcon} alt="Back" className="w-[80px] h-auto object-contain" />
          </Link>

          <div className="w-full flex items-center justify-between mb-2">
            <h1 className="text-[22px] font-bold text-slate-800">Broadcast Messages</h1>
            <button
              onClick={() => setIsFilterOpen(true)}
              className="flex items-center gap-2 bg-[#f4f5f7] border border-[#e5e7eb] text-slate-600 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Filter size={16} strokeWidth={2} />
              <span className="text-[14px] font-medium tracking-wide">Filter</span>
            </button>
          </div>
        </div>

        {/* Message Cards List */}
        <div className="flex flex-col gap-4">

          {/* Card Component */}
          <div className="bg-white border border-[#f1f1f1] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)] rounded-xl py-6 px-7">

            <div className="flex items-start justify-between mb-4">
              <span className="px-3 py-1.5 bg-[#4db4ff] text-white rounded-full text-[11px] font-semibold tracking-wide">
                Order Status Not Available
              </span>
              <div className="flex items-center gap-4 text-gray-800 font-medium pb-1">
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} strokeWidth={2} />
                  <span className="text-[12px] font-semibold">09 Jan 2026</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={14} strokeWidth={2} />
                  <span className="text-[12px] font-semibold">08:29 AM</span>
                </div>
              </div>
            </div>

            <p className="text-[12px] font-semibold text-gray-500 tracking-wide mb-3">
              From Hardik
            </p>

            <p className="text-[13px] font-medium text-slate-500 leading-[1.6] mb-6 max-w-[98%]">
              I placed an order on the official website a few days ago and received the confirmation email successfully. However, since then, there has been no further communication regarding the order status. I am unable to track the shipment and there is no information available about dispatch or delivery timelines.
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-400">
                <Paperclip size={14} strokeWidth={2.5} />
                <span className="text-[10px] font-medium mt-[1px]">Attachments available (1)</span>
              </div>
              <button
                onClick={() => setIsAttachmentsOpen(true)}
                className="text-[12px] font-bold text-[#1f2937] hover:underline transition-all"
              >
                View attachments
              </button>
            </div>

          </div>

        </div>

      </div>

      <BroadcastAttachmentsModal
        isOpen={isAttachmentsOpen}
        onClose={() => setIsAttachmentsOpen(false)}
      />

      <BroadcastFilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
      />
    </div>
  );
}
