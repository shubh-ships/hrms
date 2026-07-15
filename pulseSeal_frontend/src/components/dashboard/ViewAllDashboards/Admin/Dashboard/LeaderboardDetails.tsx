"use client";

import type React from "react";
import { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Crown,
  Trophy,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { format, addMonths, subMonths, isValid } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { 
  fetchOrganizationLeaderboard, 
  selectLeaderboard, 
  selectLeaderboardLoading, 
  selectLeaderboardError 
} from "@/features/leaderBoard/leaderboardSlice";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCw } from "lucide-react";

// --- Sub-components ---

const PerformanceTag: React.FC<{ value: number; type: "g" | "y" | "r" }> = ({ value, type }) => {
  const colors = {
    g: "bg-[#DCFCE7] text-[#16A34A]",
    y: "bg-[#FEF9C3] text-[#CA8A04]",
    r: "bg-[#FEE2E2] text-[#DC2626]",
  };
  return (
    <span className={cn("text-[8px] font-bold px-1.5 py-0.5 rounded-[2px] min-w-[24px] text-center", colors[type])}>
      {value}{type.toUpperCase()}
    </span>
  );
};

const PodiumBlock: React.FC<{ user: any; rank: number }> = ({ user, rank }) => {
  const isFirst = rank === 1;
  const height = isFirst ? "h-[180px]" : rank === 2 ? "h-[140px]" : "h-[110px]";
  const order = rank === 2 ? "order-1" : isFirst ? "order-2" : "order-3";

  return (
    <div className={cn("flex flex-col items-center justify-end flex-1", order)}>
      <div className="flex flex-col items-center mb-8">
        <div className="relative mb-3">
          <div className="w-[48px] h-[48px] rounded-full border-2 border-white overflow-hidden bg-gray-200">
            <img src={user.avatar} alt={user.name} width={48} height={48} className="object-cover" />
          </div>
        </div>
        <span className="text-white text-[14px] font-medium whitespace-nowrap tracking-wide">{user.name}</span>
      </div>
      <div className="relative w-[240px]">
        <div className={cn(
          "w-full bg-linear-to-b from-white to-transparent rounded-t-[4px] flex flex-col items-center justify-center shadow-lg",
          height
        )}>
          <span className="text-[#1F2937] text-[20px] font-medium mt-2">{user.score}</span>
          <span className="text-[#FFFFFF] text-[14px] font-medium tracking-wider">Score</span>
        </div>
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
          {user.rank === 1 && (
            <div
              style={{
                maskImage: 'url(/assets/Dashicons/crown.png)',
                maskSize: 'contain',
                maskRepeat: 'no-repeat',
                backgroundColor: '#D4AF37'
              }}
              className="w-[40px] h-[40px]"
            />
          )}
          {user.rank === 2 && (
            <div
              style={{
                maskImage: 'url(/assets/Dashicons/crown.png)',
                maskSize: 'contain',
                maskRepeat: 'no-repeat',
                backgroundColor: '#A8A8A8'
              }}
              className="w-[40px] h-[40px]"
            />
          )}
          {user.rank === 3 && (
            <div
              style={{
                maskImage: 'url(/assets/Dashicons/crown.png)',
                maskSize: 'contain',
                maskRepeat: 'no-repeat',
                backgroundColor: '#E6A15C'
              }}
              className="w-[40px] h-[40px]"
            />
          )}
        </div>
      </div>
    </div>
  );
};

const LeaderboardDetails: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  
  const deptName = searchParams.get('dept') || "All Departments";
  const deptId = searchParams.get('deptId') || "all";
  
  const leaderboardData = useAppSelector(selectLeaderboard);
  const loading = useAppSelector(selectLeaderboardLoading);
  const error = useAppSelector(selectLeaderboardError);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const monthYearStr = format(selectedDate, "yyyy-MM");

  useEffect(() => {
    dispatch(fetchOrganizationLeaderboard({
      monthYear: monthYearStr,
      departmentId: deptId
    }));
  }, [dispatch, monthYearStr, deptId]);

  const currentLeaderboard = useMemo(() => {
    if (!leaderboardData || leaderboardData.length === 0) return null;
    return leaderboardData[0];
  }, [leaderboardData]);

  const top3 = useMemo(() => {
    if (!currentLeaderboard?.leaderboard) return [];
    return currentLeaderboard.leaderboard.slice(0, 3);
  }, [currentLeaderboard]);

  const restOfList = useMemo(() => {
    if (!currentLeaderboard?.leaderboard) return [];
    return currentLeaderboard.leaderboard;
  }, [currentLeaderboard]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDate(prev => subMonths(prev, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDate(prev => addMonths(prev, 1));
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] p-[40px] space-y-8 font-sans">
      {/* Header Section */}
      <div className="flex flex-col gap-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#3F5A54] hover:text-[#1E293B] transition-colors w-fit group"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-[16px] font-medium">Back</span>
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-[20px] font-bold text-[#1F2937] flex items-center gap-2">
            Leaderboard <span className="text-[#9CA3AF] text-[16px] font-medium tracking-wider">({deptName})</span>
          </h1>

          <div className="flex items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <div className="flex items-center justify-center h-[34px] w-[170px] bg-white rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:bg-gray-50 transition-all select-none px-2">
                  <CalendarDays className="w-4 h-4 text-[#4B5563] mr-2" />
                  <ChevronLeft
                    className="w-4 h-4 text-[#4B5563] hover:text-gray-900 transition-colors"
                    onClick={handlePrevMonth}
                  />
                  <span className="text-[13px] font-medium text-[#4B5563] min-w-[70px] text-center">
                    {format(selectedDate, "MMM yyyy")}
                  </span>
                  <ChevronRight
                    className="w-4 h-4 text-[#4B5563] hover:text-gray-900 transition-colors"
                    onClick={handleNextMonth}
                  />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border-none shadow-xl outline-none ring-0" align="end">
                <CalendarUI
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <Button variant="outline" size="sm" onClick={() => dispatch(fetchOrganizationLeaderboard({ monthYear: monthYearStr, departmentId: deptId }))}>
              <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Podium Section */}
      {loading ? (
        <PodiumSkeleton />
      ) : error ? (
        <ErrorCard message={error} />
      ) : top3.length > 0 ? (
        <div
          style={{
            background: 'linear-gradient(90deg, #3F5A54D6 0%, #6F9289 25%, #95B3AA 50%, #98B5AC 75%, #BED1CA 100%)',
            boxShadow: '0px 10px 60px rgba(226, 236, 249, 0.5)'
          }}
          className="rounded-[8px] h-[343px] relative overflow-hidden flex items-end justify-center px-[150px] gap-0"
        >
          <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-black/5 to-transparent pointer-events-none" />
          {top3.map((user, index) => (
            <PodiumBlock key={user.userId || index} user={user} rank={index + 1} />
          ))}
        </div>
      ) : (
        <div className="bg-gray-100 rounded-lg h-[343px] flex items-center justify-center text-gray-500 italic">
          No performance data found for the selected period.
        </div>
      )}

      {/* Complete Leaderboard Section */}
      <div className="bg-white rounded-[12px] shadow-sm border border-[#F0F0F0] overflow-hidden flex flex-col gap-0">
        <div className="flex justify-between py-[20px] px-[20px]">
          <h2 className="text-[16px] font-medium text-[#0F172A]">Complete Leaderboard</h2>
          <span className="text-[14px] font-medium text-[#9CA3AF]">
            Total: {restOfList.length}
          </span>
        </div>
        {loading ? (
          <TableSkeleton />
        ) : restOfList.length > 0 ? (
          <div className="overflow-x-auto overflow-hidden">
            <table className="w-full table-fixed border-separate border-spacing-y-2.5">
              <thead className="bg-[#F0F0F0] text-[12px] font-medium text-[#1F2937]">
                <tr className="h-[39px]">
                  <th className="w-[8px] p-0 border-none"></th>
                  <th className="text-left font-semibold w-[14.2%] pl-[20px]">Rank</th>
                  <th className="text-left font-semibold w-[14.2%]">Participant</th>
                  <th className="text-left font-semibold w-[14.2%]">Efficiency Score</th>
                  <th className="text-left font-semibold w-[14.2%]">Attendance</th>
                  <th className="text-left font-semibold w-[14.2%]">Total Tasks</th>
                  <th className="text-left font-semibold w-[14.2%]">Approved</th>
                  <th className="text-left font-semibold w-[14.2%] text-center">Performance</th>
                  <th className="w-[8px] p-0 border-none"></th>
                </tr>
              </thead>
              <tbody className="border-none">
                <tr className="border-none"><td colSpan={9} className="border-none"></td></tr>
                {restOfList.map((item, index) => (
                  <tr
                    key={item.userId || index}
                    className="bg-white rounded-[8px] h-[46px] group transition-all"
                  >
                    <td className="w-[8px] p-0 border-none bg-transparent"></td>
                    <td className="border-y border-l border-[#E5E7EB] rounded-l-[8px] pl-0">
                      <div className={cn(
                        "flex items-center justify-center w-[90px] h-[36px] rounded-[6px] relative overflow-hidden ml-0",
                        index === 0 && "bg-linear-to-r from-[#FDE68A]/50 to-transparent",
                        index === 1 && "bg-linear-to-r from-[#F1F5F9] to-transparent",
                        index === 2 && "bg-linear-to-r from-[#FFEDD5]/50 to-transparent"
                      )}>
                        {/* Left Accent Bar */}
                        {index < 3 && (
                          <div
                            className={cn(
                              "absolute left-0 top-0 bottom-0 w-[4px]",
                              index === 0 && "bg-[#D4AF37]",
                              index === 1 && "bg-[#A8A8A8]",
                              index === 2 && "bg-[#E6A15C]"
                            )}
                          />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center">
                          {index === 0 && (
                            <div
                              style={{
                                maskImage: 'url(/assets/Dashicons/position.png)',
                                maskSize: 'contain',
                                maskRepeat: 'no-repeat',
                                backgroundColor: '#D4AF37',
                              }}
                              className="w-[24px] h-[24px]"
                            />
                          )}
                          {index === 1 && (
                            <div
                              style={{
                                maskImage: 'url(/assets/Dashicons/position2.png)',
                                maskSize: 'contain',
                                maskRepeat: 'no-repeat',
                                backgroundColor: '#A8A8A8',
                              }}
                              className="w-[24px] h-[24px]"
                            />
                          )}
                          {index === 2 && (
                            <div
                              style={{
                                maskImage: 'url(/assets/Dashicons/position3.png)',
                                maskSize: 'contain',
                                maskRepeat: 'no-repeat',
                                backgroundColor: '#E6A15C',
                              }}
                              className="w-[24px] h-[24px]"
                            />
                          )}
                        </div>
                        {index >= 3 && (
                          <span className="text-[10px] font-medium text-[#000000]">#{index + 1}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-0 border-y border-[#E5E7EB]">
                      <div className="flex items-center gap-1">
                        <div className="w-[24px] h-[24px] rounded-full overflow-hidden bg-gray-100 border border-white">
                          {item.avatar ? (
                            <img src={item.avatar} alt={item.name} width={24} height={24} />
                          ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-[10px] font-bold">
                                  {item.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                                </div>
                          )}
                        </div>
                        <span className="text-[12px] font-regular text-[#1F2937]">{item.name}</span>
                      </div>
                    </td>
                    <td className="py-0 border-y border-[#E5E7EB]">
                      <span className="text-[12px] font-regular text-[#1F2937]">{item.efficiency?.toFixed(2) || '0.00'}</span>
                    </td>
                    <td className="py-0 border-y border-[#E5E7EB]">
                      <span className="text-[12px] text-[#1F2937]">{item.attendanceAverage?.toFixed(1) || '0.0'}%</span>
                    </td>
                    <td className="py-0 border-y border-[#E5E7EB]">
                      <span className="text-[12px] text-[#1F2937]">{item.totalTasks || 0}</span>
                    </td>
                    <td className="py-0 border-y border-[#E5E7EB]">
                      <span className="text-[12px] text-[#1F2937]">{item.approvedCount || 0}</span>
                    </td>
                    <td className="py-0 border-y border-r border-[#E5E7EB] rounded-r-[8px]">
                      <div className="flex items-center gap-2">
                        <PerformanceTag value={item.greenCount} type="g" />
                        <PerformanceTag value={item.yellowCount} type="y" />
                        <PerformanceTag value={item.redCount} type="r" />
                      </div>
                    </td>
                    <td className="w-[8px] p-0 border-none bg-transparent"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-24 flex items-center justify-center text-gray-500 italic">
            No data available.
          </div>
        )}
      </div>
    </div>
  );
};

const PodiumSkeleton = () => (
  <div className="rounded-[8px] h-[343px] bg-gray-200 animate-pulse flex items-center justify-center">
    <div className="h-4 w-48 bg-gray-300 rounded"></div>
  </div>
);

const TableSkeleton = () => (
  <div className="p-10 space-y-4">
    {[...Array(5)].map((_, i) => (
      <Skeleton key={i} className="h-10 w-full" />
    ))}
  </div>
);

const ErrorCard = ({ message }: { message: string }) => (
  <Card className="border-red-200 bg-red-50 p-6 flex items-center gap-4">
    <AlertCircle className="w-8 h-8 text-red-500" />
    <div>
      <h3 className="font-semibold text-red-700">Error fetching leaderboard</h3>
      <p className="text-sm text-red-600">{message}</p>
    </div>
  </Card>
);

export default LeaderboardDetails;
