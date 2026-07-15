"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import MoveBackIcon from "@/assets/Dashicons/move-back-icon.png";

export default function EmploymentInfoPage() {
  const router = useRouter();

  const details = [
    { label: "Date of Joining", value: "Not Added" },
    { label: "UAN", value: "Not Added" },
    { label: "PAN", value: "Not Added" },
    { label: "Aadhar card Number", value: "Not Added" },
    { label: "Aadhar Enrollment Number", value: "Not Added" },
    { label: "PF Number", value: "Not Added" },
    { label: "PF Joining Date", value: "Not Added" },
    { label: "ESI Details Available", value: "Not Added" },
    { label: "ESI No.", value: "Not Added" },
    { label: "PF Eligible", value: "No" },
    { label: "ESI Eligible", value: "No" },
    { label: "PT Eligible", value: "No" },
    { label: "LWF Eligible", value: "No" },
    { label: "EPS Eligible", value: "No" },
    { label: "HPS Eligible", value: "No" },
    { label: "EPS Joining Date", value: "Not Added" },
    { label: "EPS Exit Date", value: "Not Added" },
  ];

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

        <h1 className="text-[22px] font-bold text-gray-900 tracking-tight mb-6">Employment Information</h1>

        {/* Details Container */}
        <div className="w-full bg-white overflow-hidden rounded-[12px] border border-gray-200 flex flex-col shadow-sm">
          {details.map((item, index) => (
            <div
              key={index}
              className={`w-full px-5 py-[22px] flex items-center justify-between
                ${index !== details.length - 1 ? 'border-b border-gray-200' : ''}
              `}
            >
              <span className="text-[15px] font-medium text-[#99A1B7]">
                {item.label}
              </span>
              <span className="text-[14px] font-semibold text-[#1E293B]">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
