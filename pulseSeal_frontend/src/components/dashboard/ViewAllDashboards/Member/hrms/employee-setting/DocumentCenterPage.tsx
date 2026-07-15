"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import MoveBackIcon from "@/assets/Dashicons/move-back-icon.png";
import CloudIcon from "@/assets/Dashicons/Cloud.png";
import { Search, FileText, ChevronDown, ChevronUp } from "lucide-react";

export default function DocumentCenterPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedDoc, setExpandedDoc] = useState<number | null>(null);

  const mockDocs = [
    { id: 1, name: "Chiw.png", date: "27 Jan'26", note: "Hello Ji" },
    { id: 2, name: "Resu-v4.pdf", date: "27 Jan'26", note: "" },
  ];

  const filteredDocs = mockDocs.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] p-4 flex justify-center">
      <div className="w-full">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="hover:opacity-80 transition-opacity mb-6 block"
        >
          <Image
            src={MoveBackIcon}
            alt="Back"
            className="w-[80px] h-auto object-contain"
          />
        </button>

        <h1 className="text-[22px] font-bold text-gray-900 tracking-tight mb-6 mt-2">Document Center</h1>

        {/* Search Bar */}
        <div className="w-full relative mb-8">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" strokeWidth={2} />
          </div>
          <input
            type="text"
            className="w-full pl-11 pr-4 py-[14px] bg-white border border-gray-200 rounded-[12px] text-[14px] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#3f5a54] focus:ring-1 focus:ring-[#3f5a54]/20 transition-all shadow-sm"
            placeholder="Search for documents"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {filteredDocs.length > 0 ? (
          <>
            <h2 className="text-[16px] font-bold text-gray-900 mb-4">Organization Documents</h2>

            <div className="flex flex-col gap-4">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="w-full bg-white border border-gray-200 rounded-[12px] shadow-sm overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedDoc(expandedDoc === doc.id ? null : doc.id)}
                    className="w-full p-5 flex items-center justify-between text-left hover:bg-gray-50/50 transition-colors focus:outline-none"
                  >
                    <div className="flex items-center gap-4">
                      {/* Document Icon Box */}
                      <div className="w-11 h-11 rounded-xl bg-[#3f5a54]/[0.06] flex items-center justify-center shrink-0">
                        <FileText className="w-[22px] h-[22px] text-[#3f5a54]" strokeWidth={1.5} />
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <span className="text-[15px] font-medium text-gray-800">{doc.name}</span>
                        <span className="text-[12px] font-medium text-[#99A1B7]">Created At: {doc.date}</span>
                      </div>
                    </div>

                    <div className="text-gray-400 pl-4">
                      {expandedDoc === doc.id ? (
                        <ChevronUp className="w-5 h-5" strokeWidth={1.5} />
                      ) : (
                        <ChevronDown className="w-5 h-5" strokeWidth={1.5} />
                      )}
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {expandedDoc === doc.id && (
                    <div className="w-full px-5 py-4 border-t border-gray-200 bg-white">
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-semibold text-[#99A1B7]">Description/Notes</span>
                        <p className="text-[14px] font-medium text-[#1E293B] mt-1">
                          {doc.note || "No description / notes provided."}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Empty State Container */
          <div className="w-full bg-white border border-gray-200 rounded-[12px] shadow-sm py-32 flex flex-col items-center justify-center">
            <Image
              src={CloudIcon}
              alt="No documents"
              className="w-28 h-auto object-contain mb-5 opacity-90"
            />
            <span className="text-[12px] font-semibold text-[#99A1B7]">No Documents Found</span>
          </div>
        )}

      </div>
    </div>
  );
}
