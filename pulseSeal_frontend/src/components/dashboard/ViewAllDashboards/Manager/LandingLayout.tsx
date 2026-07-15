import React from "react";
import PendingSeals from "./PendingSeals";
import { ScrollArea } from "@/components/ui/scroll-area";
import TeamInsightsSidebar from "./TeamInsightsSidebar";

function LandingLayout() {
  return  <div className="flex h-full">
  
      <ScrollArea className="flex-1 ">
        <div className="p-4 space-y-6">
          <PendingSeals/>
        </div>
      </ScrollArea>
      
      <TeamInsightsSidebar />
    </div>;
}

export default LandingLayout;
