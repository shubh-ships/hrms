"use client";

import React from "react";
import { X, Eye, Download as DownloadIcon, FileText } from "lucide-react";

interface BroadcastAttachmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  // attachments: any[]; // Optionally passed in an actual implementation
}

export default function BroadcastAttachmentsModal({ isOpen, onClose }: BroadcastAttachmentsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[480px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white">
          <h2 className="text-[18px] font-bold text-slate-800">Attachments (1)</h2>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-slate-500"
          >
            <X size={20} className="stroke-[2.5px]" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 pb-8 bg-white flex flex-col gap-4">
          
          {/* Attachment Item */}
          <div className="flex items-center justify-between group">
            <div className="flex items-center gap-4 min-w-0">
              
              {/* File Icon Container */}
              <div className="w-12 h-12 rounded-xl bg-[#3f5a54]/10 flex items-center justify-center shrink-0">
                <FileText size={22} className="text-[#3f5a54] fill-[#3f5a54]/20" strokeWidth={1.5} />
              </div>
              
              {/* File Info */}
              <div className="flex flex-col min-w-0">
                <p className="text-[14px] font-bold text-slate-800 truncate" title="PHOTO-2026-01-21-09-44-...">
                  PHOTO-2026-01-21-09-44-...
                </p>
                <p className="text-[12px] font-medium text-slate-500 mt-0.5">
                  Created At: 06 Apr &apos;26
                </p>
              </div>

            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 shrink-0 pl-4 text-[#3f5a54]">
              <button className="p-2 hover:bg-[#3f5a54]/10 rounded-lg transition-colors" title="View">
                <Eye size={18} strokeWidth={2} />
              </button>
              <button className="p-2 hover:bg-[#3f5a54]/10 rounded-lg transition-colors" title="Download">
                <DownloadIcon size={18} strokeWidth={2} />
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
