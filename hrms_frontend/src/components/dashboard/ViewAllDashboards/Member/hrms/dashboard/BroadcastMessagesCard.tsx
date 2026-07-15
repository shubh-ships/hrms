import React from "react";
import { Cake, ChevronRight } from "lucide-react";
import Image from "next/image";
import CloudIcon from "@/assets/Dashicons/Cloud.png";
import Link from "next/link";

export default function BroadcastMessagesCard() {
  return (
    <Link href="/dashboard/dynamic/hrms/broadcast-messages" className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full min-h-[350px] hover:shadow-md transition-shadow cursor-pointer block">
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-purple-100 p-2 rounded-lg text-purple-500">
            <Cake size={20} />
          </div>
          <h2 className="text-lg font-semibold text-gray-800">Broadcast Messages</h2>
        </div>
        <button className="text-gray-400 hover:text-gray-600 transition-colors">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="p-6 flex-1 flex flex-col items-center justify-center">
        <div className="relative mb-3">
            <Image src={CloudIcon} alt="No data found" className="h-[72px] w-auto object-contain" />
        </div>
        <p className="text-xs text-gray-400 font-medium">No data found</p>
      </div>
    </Link>
  );
}
