"use client";

import React, { useEffect, useMemo } from "react";
import { ArrowLeft, TrendingUp, TrendingDown, Target, Users, AlertTriangle, ShieldAlert, Activity } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchWeeklyPulseEfficiency } from "@/features/efficiencyReport/pulseEfficiencySlice";
import { listAllFrauds, selectAllFrauds } from "@/features/fraud1/fraudSlice1";
import { getOrgIdFromToken } from "@/lib/authHelpers";
import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const PulseAnalytics: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { weeklyData, loading: efficiencyLoading } = useAppSelector((state) => state.pulseEfficiency);
  const frauds = useAppSelector(selectAllFrauds);
  const fraudLoading = useAppSelector((state) => state.fraud1.loading);

  useEffect(() => {
    dispatch(fetchWeeklyPulseEfficiency());
    const orgId = getOrgIdFromToken();
    if (orgId) {
      dispatch(listAllFrauds(orgId));
    }
  }, [dispatch]);

  const stats = useMemo(() => {
    const latest = weeklyData && weeklyData.length > 0 ? weeklyData[weeklyData.length - 1] : null;
    return {
      pulseScore: latest ? Math.round(latest.efficiency) : 0,
      attendance: latest ? Math.round(latest.attendanceAverage) : 0,
      taskCompletion: latest ? Math.round(latest.sealSubmissionRate) : 0,
      totalFrauds: frauds.length,
      trend: latest ? (latest.efficiency > 70 ? "up" : "down") : "stable"
    };
  }, [weeklyData, frauds]);

  const chartData = useMemo(() => {
    if (!weeklyData) return [];
    return weeklyData.map(item => ({
      name: item.month.substring(0, 3),
      efficiency: Math.round(item.efficiency),
      attendance: Math.round(item.attendanceAverage),
    }));
  }, [weeklyData]);

  const loading = efficiencyLoading || fraudLoading;

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] p-[40px] space-y-8 font-sans">
      {/* Header Section */}
      <div className="flex flex-col gap-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#3F5A54] hover:text-[#1E293B] transition-colors w-fit group"
        >
          <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[16px] font-medium">Back</span>
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-[24px] font-bold text-[#1F2937] tracking-tight">
            Pulse Analytics
          </h1>
          <div className="flex items-center gap-2 px-3 py-1 bg-white border rounded-full shadow-sm">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[12px] font-medium text-[#4B5563]">Live Updates</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B82F6]"></div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnalyticsCard
              title="Pulse Score"
              value={stats.pulseScore}
              unit="%"
              icon={<Activity className="w-5 h-5" />}
              color="text-blue-600"
              bg="bg-blue-50"
              trend={stats.trend === "up" ? "positive" : "negative"}
            />
            <AnalyticsCard
              title="Avg Attendance"
              value={stats.attendance}
              unit="%"
              icon={<Users className="w-5 h-5" />}
              color="text-green-600"
              bg="bg-green-50"
              trend="positive"
            />
            <AnalyticsCard
              title="Task Completion"
              value={stats.taskCompletion}
              unit="%"
              icon={<Target className="w-5 h-5" />}
              color="text-purple-600"
              bg="bg-purple-50"
              trend="positive"
            />
            <AnalyticsCard
              title="Frauds Detected"
              value={stats.totalFrauds}
              icon={<ShieldAlert className="w-5 h-5" />}
              color="text-red-600"
              bg="bg-red-50"
              trend={stats.totalFrauds > 0 ? "negative" : "positive"}
              onClick={() => router.push("/dashboard/admin/fraud_detection")}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 shadow-sm border-0 bg-white p-6">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="text-[18px] font-semibold text-[#1F2937]">Efficiency Trend</CardTitle>
                <CardDescription className="text-[14px]">Weekly efficiency and attendance metrics</CardDescription>
              </CardHeader>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94A3B8', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94A3B8', fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="efficiency"
                      stroke="#3B82F6"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="attendance"
                      stroke="#10B981"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="shadow-sm border-0 bg-white p-6">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="text-[18px] font-semibold text-[#1F2937]">Recent Alerts</CardTitle>
              </CardHeader>
              <div className="space-y-4">
                {frauds.length > 0 ? (
                  frauds.slice(0, 5).map((fraud) => (
                    <div key={fraud._id} className="flex items-start gap-3 p-3 rounded-[8px] bg-red-50/50 border border-red-100">
                      <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[12px] font-medium text-[#1F2937]">{fraud.user_id.name}</p>
                        <p className="text-[10px] text-[#64748B] line-clamp-1">{fraud.fraudType}</p>
                        <p className="text-[10px] font-semibold text-red-600 mt-1 uppercase">{fraud.status}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-[200px] text-center">
                    <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-3">
                      <ShieldAlert className="w-6 h-6 text-green-500" />
                    </div>
                    <p className="text-[14px] font-medium text-[#1F2937]">System Clean</p>
                    <p className="text-[12px] text-[#64748B]">No recent fraud attempts detected</p>
                  </div>
                )}
                {frauds.length > 5 && (
                  <button
                    onClick={() => router.push("/dashboard/admin/fraud_detection")}
                    className="w-full py-2 text-[12px] font-medium text-[#3B82F6] hover:bg-blue-50 rounded-[6px] transition-colors"
                  >
                    View All Fraud Records
                  </button>
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  trend?: "positive" | "negative";
  onClick?: () => void;
}

const AnalyticsCard: React.FC<AnalyticsCardProps> = ({
  title, value, unit, icon, color, bg, trend, onClick
}) => {
  return (
    <Card
      className={cn(
        "border-0 shadow-sm transition-all duration-200 cursor-default",
        onClick && "cursor-pointer hover:shadow-md hover:-translate-y-1"
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("p-2 rounded-[10px]", bg, color)}>
            {icon}
          </div>
          {trend && (
            <div className={cn(
              "flex items-center gap-1 text-[12px] font-medium",
              trend === "positive" ? "text-green-600" : "text-red-600"
            )}>
              {trend === "positive" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trend === "positive" ? "↑" : "↓"}
            </div>
          )}
        </div>
        <div>
          <p className="text-[14px] font-medium text-[#64748B] mb-1">{title}</p>
          <h3 className="text-[28px] font-bold text-[#1F2937] leading-none">
            {value}{unit && <span className="text-[16px] ml-1 opacity-60">{unit}</span>}
          </h3>
        </div>
      </CardContent>
    </Card>
  );
};

export default PulseAnalytics;
