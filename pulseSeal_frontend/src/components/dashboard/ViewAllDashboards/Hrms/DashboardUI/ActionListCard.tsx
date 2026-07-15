"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { ChevronRight, NotebookPen } from "lucide-react";
import { useRouter } from "next/navigation";

interface ActionItem {
    icon: React.ReactNode;
    label: string;
    subtext: string;
    colorClass: string;
    url?: string;
    path?: string;
}

interface Props {
    title: string;
    items: ActionItem[];
    className?: string;
}

const ActionListCard: React.FC<Props> = ({ title, items, className }) => {
    const router = useRouter();
    return (
        <Card className={`bg-white rounded-xl shadow-sm border border-[#E5E7EB] p-0 overflow-hidden flex flex-col ${className || 'h-[340px] w-[406px]'}`}>
            <div className="flex items-center px-[20px] py-[20px] border-gray-300 shadow-sm">
                <div className="flex items-center w-[183px] h-[36px] gap-[16px]">
                    <div className="h-[36px] w-[36px] rounded-lg bg-[#DCFCE7] flex items-center justify-center shrink-0">
                        <NotebookPen className="text-[#22C55E] h-[20px] w-[20px]" />
                    </div>
                    <div className="w-[131px] h-[24px] flex items-center">
                        <h2 className="text-[16px] font-medium text-[#1F2937] leading-none">{title}</h2>
                    </div>
                </div>
            </div>

            <div className="flex flex-col flex-1">
                {items.map((item, index) => (
                    <div
                        key={index}
                        onClick={() => {
                            const target = item.path || item.url;
                            if (target) router.push(target);
                        }}
                        className={`flex flex-col w-full cursor-pointer group hover:bg-gray-50/50 transition-all ${index < items.length - 1 ? 'border-b border-[#E5E7EB]' : ''}`}
                    >
                        <div className={`flex items-center justify-between h-[41px] mb-[14px] px-[22px] ${index === 0 ? 'mt-0' : 'mt-[14px]'}`}>
                            <div className="flex items-center gap-[16px]">
                                <div className={`h-[36px] w-[36px] rounded-[8px] flex items-center justify-center shrink-0 ${item.colorClass}`}>
                                    {item.icon}
                                </div>

                                <div className="flex flex-col justify-center">
                                    <p className="text-[16px]  font-medium text-[#4B5563]">{item.label}</p>
                                    <p className="text-[10px] text-[#4B5563] font-normal">{item.subtext}</p>
                                </div>
                            </div>

                            <div>
                                <ChevronRight className="h-[16px] w-[16px] text-[#4B5563] group-hover:text-gray-600 transition-colors shrink-0" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Card >
    );
};

export default ActionListCard;
