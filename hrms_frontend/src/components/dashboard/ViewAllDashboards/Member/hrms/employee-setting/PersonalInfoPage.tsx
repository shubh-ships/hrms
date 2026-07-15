"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import MoveBackIcon from "@/assets/Dashicons/move-back-icon.png";
import { ChevronDown, ChevronUp } from "lucide-react";

interface AccordionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const Accordion = ({ title, isOpen, onToggle, children }: AccordionProps) => {
  return (
    <div className="w-full bg-white rounded-[12px] border border-gray-200 shadow-sm overflow-hidden mb-4">
      <button
        onClick={onToggle}
        className="w-full px-5 py-[22px] flex items-center justify-between text-left focus:outline-none transition-colors hover:bg-gray-50/50"
      >
        <span className="text-[15px] font-bold text-[#1E293B]">{title}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-400" strokeWidth={1.5} />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" strokeWidth={1.5} />
        )}
      </button>
      {isOpen && (
        <div className="w-full border-t border-gray-200 flex flex-col bg-white">
          {children}
        </div>
      )}
    </div>
  );
};

export default function PersonalInfoPage() {
  const router = useRouter();

  // Set all to closed by default
  const [openSections, setOpenSections] = useState({
    profile: false,
    personal: false,
    addresses: false
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const profileData = [
    { label: "Name", value: "CHIRAG" },
    { label: "ID", value: "DE1309" },
    { label: "Contact Number", value: "4927594722" },
  ];

  const personalData = [
    { label: "Email", value: "Not Added" },
    { label: "Gender", value: "Male" },
    { label: "Date of Birth", value: "1 Jan, 2026" },
    { label: "Marital Status", value: "Not Added" },
    { label: "Blood Group", value: "Not Added" },
    { label: "Emergency Contact", value: "Not Added" },
    { label: "Father's Name", value: "Not Added" },
    { label: "Mother's Name", value: "Not Added" },
    { label: "Spouse's Name", value: "Not Added" },
    { label: "Physically Challenged?", value: "No" },
  ];

  const addressData = [
    { label: "Current Address", value: "Not Added" },
    { label: "Permanent Address", value: "Not Added" },
  ];

  const renderRow = (item: { label: string, value: string }, index: number, totalLength: number) => (
    <div
      key={index}
      className={`w-full px-5 py-[22px] flex items-center justify-between
        ${index !== totalLength - 1 ? 'border-b border-gray-200' : ''}
      `}
    >
      <span className="text-[15px] font-medium text-[#99A1B7]">
        {item.label}
      </span>
      <span className="text-[14px] font-bold text-[#1E293B]">
        {item.value}
      </span>
    </div>
  );

  const renderStackedRow = (item: { label: string, value: string }, index: number, totalLength: number) => (
    <div
      key={index}
      className={`w-full px-5 py-[22px] flex flex-col gap-1 text-left
        ${index !== totalLength - 1 ? 'border-b border-gray-200' : ''}
      `}
    >
      <span className="text-[14px] font-bold text-[#1E293B]">
        {item.label}
      </span>
      <span className="text-[13px] font-medium text-[#99A1B7]">
        {item.value}
      </span>
    </div>
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

        <h1 className="text-[22px] font-bold text-gray-900 tracking-tight mb-6 mt-2">Personal Info</h1>

        <Accordion
          title="Profile Information"
          isOpen={openSections.profile}
          onToggle={() => toggleSection('profile')}
        >
          {profileData.map((item, idx) => renderRow(item, idx, profileData.length))}
        </Accordion>

        <Accordion
          title="Personal Information"
          isOpen={openSections.personal}
          onToggle={() => toggleSection('personal')}
        >
          {personalData.map((item, idx) => renderRow(item, idx, personalData.length))}
        </Accordion>

        <Accordion
          title="Addresses"
          isOpen={openSections.addresses}
          onToggle={() => toggleSection('addresses')}
        >
          {addressData.map((item, idx) => renderStackedRow(item, idx, addressData.length))}
        </Accordion>
      </div>
    </div>
  );
}
