"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const generateHeatmapData = () => {
  const data = []
  const daysInWeek = 7
  const weeksToShow = 8

  for (let week = 0; week < weeksToShow; week++) {
    const weekData = []
    for (let day = 0; day < daysInWeek; day++) {
      const random = Math.random()
      let status = "no-data"

      if (random > 0.8) status = "poor"
      else if (random > 0.6) status = "average"
      else if (random > 0.2) status = "good"

      weekData.push(status)
    }
    data.push(weekData)
  }
  return data
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "good":
      return "bg-green-500"
    case "average":
      return "bg-yellow-500"
    case "poor":
      return "bg-red-500"
    default:
      return "bg-gray-200"
  }
}

export default function SignalHeatmap() {
  const heatmapData = generateHeatmapData()
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Signal Heatmap Calendar</CardTitle>
        <p className="text-sm text-gray-600">
          Visualizing daily task health: Green (Good), Yellow (Average), Red (Poor), Grey (No Data).
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Day labels */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayLabels.map((day) => (
              <div key={day} className="text-xs text-gray-500 text-center font-medium">
                {day}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="space-y-1">
            {heatmapData.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 gap-1">
                {week.map((status, dayIndex) => (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    className={`w-8 h-8 rounded ${getStatusColor(status)} hover:opacity-80 cursor-pointer transition-opacity`}
                    title={`Week ${weekIndex + 1}, ${dayLabels[dayIndex]}: ${status}`}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center space-x-6 mt-6 pt-4 border-t">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-xs text-gray-600">Good</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span className="text-xs text-gray-600">Average</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-xs text-gray-600">Poor</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-200 rounded"></div>
              <span className="text-xs text-gray-600">No Data</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
