"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const monthlyData = [
  { month: "Jan", value: 78 },
  { month: "Feb", value: 82 },
  { month: "Mar", value: 85 },
  { month: "Apr", value: 88 },
  { month: "May", value: 90 },
  { month: "Jun", value: 87 },
  { month: "Jul", value: 92 },
  { month: "Aug", value: 94 },
  { month: "Sep", value: 96 },
  { month: "Oct", value: 98 },
  { month: "Nov", value: 95 },
  { month: "Dec", value: 100 },
]

export default function PulseEfficiencyTrend() {
  const maxValue = Math.max(...monthlyData.map((d) => d.value))
  const minValue = Math.min(...monthlyData.map((d) => d.value))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Pulse Efficiency Trend</CardTitle>
        <p className="text-sm text-gray-600">Monthly average efficiency score over the last year.</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>70</span>
            <span>80</span>
            <span>90</span>
            <span>100</span>
          </div>

          <div className="relative h-48 border-l border-b border-gray-200">
            <svg className="w-full h-full" viewBox="0 0 400 200">
              {[0, 1, 2, 3, 4].map((i) => (
                <line key={i} x1="0" y1={i * 40} x2="400" y2={i * 40} stroke="#f3f4f6" strokeWidth="1" />
              ))}

              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                points={monthlyData
                  .map((d, i) => {
                    const x = (i * 400) / (monthlyData.length - 1)
                    const y = 200 - ((d.value - 70) / 30) * 200
                    return `${x},${y}`
                  })
                  .join(" ")}
              />

              {monthlyData.map((d, i) => {
                const x = (i * 400) / (monthlyData.length - 1)
                const y = 200 - ((d.value - 70) / 30) * 200
                return <circle key={i} cx={x} cy={y} r="4" fill="#10b981" stroke="white" strokeWidth="2" />
              })}
            </svg>
          </div>

          <div className="flex justify-between text-xs text-gray-500 mt-2">
            {monthlyData.map((d) => (
              <span key={d.month}>{d.month}</span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
