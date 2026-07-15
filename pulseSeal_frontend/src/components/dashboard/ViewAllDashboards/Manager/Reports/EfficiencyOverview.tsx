"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HelpCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const kpiData = [
  {
    title: "Tasks Completed on Time",
    value: "92",
    unit: "%",
    change: "+2%",
    changeType: "positive",
    description: "Percentage of tasks completed within deadline",
  },
  {
    title: "Average Resolution Time",
    value: "4.2",
    unit: "hrs",
    change: "+1%",
    changeType: "negative",
    description: "Average time taken to resolve tasks",
  },
  {
    title: "Open Tasks",
    value: "78",
    unit: "",
    change: "+3%",
    changeType: "negative",
    description: "Number of currently open tasks",
  },
  {
    title: "Team Pulse Score",
    value: "8.7",
    unit: "/10",
    change: "+0.1%",
    changeType: "positive",
    description: "Overall team satisfaction and engagement score",
  },
]

export default function EfficiencyOverview() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Key Performance Indicators</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi, index) => (
          <Card key={index} className="relative">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 pr-2">{kpi.title}</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{kpi.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline space-x-1">
                <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
                <div className="text-sm text-gray-500">{kpi.unit}</div>
              </div>
              <div className="flex items-center mt-2">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    kpi.changeType === "positive" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}
                >
                  {kpi.change}
                </span>
                <span className="text-xs text-gray-500 ml-2">compared to previous period</span>
              </div>

              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${kpi.changeType === "positive" ? "bg-green-500" : "bg-blue-500"}`}
                    style={{
                      width:
                        kpi.title === "Team Pulse Score"
                          ? `${(Number.parseFloat(kpi.value) / 10) * 100}%`
                          : kpi.title === "Tasks Completed on Time"
                            ? `${kpi.value}%`
                            : "70%",
                    }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
