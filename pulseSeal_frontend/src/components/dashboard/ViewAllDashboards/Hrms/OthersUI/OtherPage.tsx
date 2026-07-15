"use client";

import React, { useState } from "react";
import SettingsCard from "./SettingsCard";
import { Search } from "lucide-react";
import BusinessInfoPopups from "./views/BusinessInfoPopups";

const OtherPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activePopup, setActivePopup] = useState<string | null>(null);

  return (
    <div>
      <div className="text-xl font-bold my-5">Others</div>
      <div className="relative w-full shadow-xs">
        {/* Search Icon */}
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          <Search className="w-4 h-4 text-slate-400" />
        </div>

        {/* Input Field */}
        <input
          type="text"
          placeholder="Search Settings..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full py-2.5 pl-11 pr-4 bg-white border border-gray-200 rounded-lg text-[15px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
        />
      </div>
      <SettingsCard 
        searchQuery={searchQuery} 
        onSettingClick={(id) => setActivePopup(id)} 
      />
      <BusinessInfoPopups 
        activePopup={activePopup} 
        onClose={() => setActivePopup(null)} 
      />
    </div>
  );
};

export default OtherPage;
