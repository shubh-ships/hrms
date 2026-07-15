"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { ChevronRight, NotebookPen } from "lucide-react";
import { useRouter } from "next/navigation";

interface StatItem {
    label: string;
    value: string | number;
}

interface Props {
    icon: React.ReactNode;
    title: string;
    items: StatItem[];
    url?: string;
    className?: string;
    showChevron?: boolean;
}

const StatusCard: React.FC<Props> = ({ icon, title, items, url, className, showChevron = true }) => {
    const router = useRouter();
    return (
        <Card
            className={`rounded-xl shadow-sm border border-gray-200 bg-white p-0 flex flex-col ${url ? "cursor-pointer transition-colors" : ""} ${className || ""}`}
            onClick={() => url && router.push(url)}
        >
            <div className="flex items-center justify-between px-[20px] h-[76px] border-b border-[#E5E7EB]">
                <div className="flex items-center gap-[16px]">
                    <div className="h-[36px] w-[36px] shrink-0">
                        {icon}
                    </div>
                    <h2 className="text-[16px] font-medium text-[#1F2937]">{title}</h2>
                </div>

                {showChevron && <ChevronRight className="h-[16px] w-[16px] text-[#4B5563]" />}
            </div>

            <div className="flex items-center px-[20px]">
                <div className="flex justify-between w-full">
                    {items.map((item, index) => (
                        <div key={index} className="flex flex-col gap-[8px]">
                            <p className="text-[10px] text-[#4B5563] font-normal flex items-center gap-[6px]">
                                {item.label}
                                {item.label === "Upcoming" && <span className="text-[10px] text-[#4B5563] cursor-help opacity-60">ⓘ</span>}
                            </p>
                            <p className="text-[10px] font-medium text-[#000000]">{item.value}</p>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
};

export default StatusCard;
