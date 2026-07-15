"use client";

import React from "react";
import { 
  CreditCard, 
  Landmark, 
  User, 
  Info, 
  ClipboardList, 
  FileText, 
  Tv,
  ChevronRight,
  Pencil,
  IdCard,
  Banknote,
  CircleUser,
  IdCardLanyard,
  ScrollText
} from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import Link from "next/link";

export default function EmployeeSettingPage() {
  const user = useAppSelector((state) => state.auth.user);
  const settingsOptions = [
    { id: "account", label: "Account Settings", icon: IdCard, href: "/dashboard/dynamic/hrms/employee-setting/account" },
    { id: "bank", label: "Your Bank Details", icon: Banknote, href: "/dashboard/dynamic/hrms/employee-setting/bank" },
    { id: "personal", label: "Personal Info", icon: CircleUser, href: "/dashboard/dynamic/hrms/employee-setting/personal-info" },
    { id: "general", label: "General Info", icon: Info, href: "/dashboard/dynamic/hrms/employee-setting/general-info" },
    { id: "employment", label: "Employment Information", icon: IdCardLanyard, href: "/dashboard/dynamic/hrms/employee-setting/employment-info" },
    { id: "documents", label: "Document Center", icon: ScrollText, href: "/dashboard/dynamic/hrms/employee-setting/document-center" },
    { id: "broadcast", label: "Broadcast Messages", icon: Tv, href: "/dashboard/dynamic/hrms/broadcast-messages" },
  ];

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] p-4 flex justify-center">
      <div className="w-full">
        {/* Settings Container */}
        <div className="w-full bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 border-t-[6px] border-t-[#3f5a54] flex flex-col">
          
          {/* Header Profile Area */}
          <div className="bg-[#DFE8E5] w-full p-6 flex items-center gap-4 border-b border-gray-200">
            <Link 
              href="/dashboard/dynamic/setting"
              className="w-16 h-16 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center relative cursor-pointer hover:shadow-md transition-shadow"
            >
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover rounded-full" />
              ) : (
                <User className="w-7 h-7 text-[#3f5a54] fill-[#3f5a54]" />
              )}
              {/* Edit Badge */}
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm z-10 hover:bg-gray-50 transition-colors">
                <Pencil className="w-3 h-3 text-green-600" />
              </div>
            </Link>
            
            <div className="flex flex-col z-10">
              <h2 className="text-[18px] font-bold text-gray-800 leading-tight">{user?.name || "Unknown User"}</h2>
              <span className="text-[13px] text-blue-500 font-semibold tracking-wide">
                ID {user?.id ? user.id.slice(-6).toUpperCase() : 'N/A'}
              </span>
            </div>
          </div>

          {/* Links Area */}
          <div className="flex flex-col w-full">
            {settingsOptions.map((option, index) => {
              const IconComp = option.icon;
              return (
                <Link 
                  href={option.href}
                  key={option.id}
                  className={`w-full flex items-center justify-between p-5 hover:bg-gray-50 cursor-pointer transition-colors group
                    ${index !== settingsOptions.length - 1 ? 'border-b border-gray-200' : ''}
                  `}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-[#DFE8E5] text-[#3f5a54] group-hover:bg-[#DFE8E5]/80 transition-colors">
                      <IconComp className="w-5 h-5" strokeWidth={1.5} />
                    </div>
                    <span className="text-[15px] font-medium text-gray-700 group-hover:text-gray-900">
                      {option.label}
                    </span>
                  </div>
                  
                  <div className="text-gray-300 group-hover:text-gray-500 transition-colors pr-2">
                    <ChevronRight className="w-5 h-5" strokeWidth={2} />
                  </div>
                </Link>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}
