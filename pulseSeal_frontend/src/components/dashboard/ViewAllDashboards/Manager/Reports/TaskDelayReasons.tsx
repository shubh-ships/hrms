"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const delayReasons = [
  { reason: "Resource Shortage", percentage: 28, color: "bg-green-500" },
  { reason: "Unclear Requirements", percentage: 24, color: "bg-green-400" },
  { reason: "Dependencies/Blocks", percentage: 20, color: "bg-green-400" },
  { reason: "Scope Change", percentage: 16, color: "bg-green-300" },
  { reason: "Technical Issues", percentage: 14, color: "bg-green-300" },
  { reason: "Unreported", percentage: 8, color: "bg-green-200" },
]

export default function TaskDelayReasons() {
  const maxPercentage = Math.max(...delayReasons.map((d) => d.percentage))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Task Delay Reasons</CardTitle>
        <p className="text-sm text-gray-600">Top reasons for task delays in the current period.</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {delayReasons.map((item, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="w-32 text-sm text-gray-700 text-right">{item.reason}</div>
              <div className="flex-1 relative">
                <div className="w-full bg-gray-200 rounded-full h-6">
                  <div
                    className={`h-6 rounded-full ${item.color} flex items-center justify-end pr-2`}
                    style={{ width: `${(item.percentage / maxPercentage) * 100}%` }}
                  >
                    <span className="text-xs font-medium text-white">{item.percentage}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-between text-xs text-gray-500 mt-4 ml-32">
            <span>0</span>
            <span>7</span>
            <span>14</span>
            <span>21</span>
            <span>28</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
