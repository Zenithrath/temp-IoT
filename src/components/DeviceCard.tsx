"use client"

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from "chart.js"
import { Line } from "react-chartjs-2"
import { TrendingUp, TrendingDown, Cpu } from "lucide-react"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

export interface DeviceData {
  id: string
  name: string
  location: string | null
  temperature: number
  humidity: number
  tempChange: number
  humChange: number
  history: { temp: number; hum: number; created_at?: string }[]
  lastSeen: string | null
  isOnline: boolean
}

interface DeviceCardProps {
  device: DeviceData
}

export function DeviceCard({ device }: DeviceCardProps) {
  const allData = device.history
  const chartLabels = allData.map((h) => {
    if (!h.created_at) return ""
    const d = new Date(h.created_at)
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " " +
           d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
  })

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: "Temperature (°C)",
        data: allData.map((h) => h.temp),
        borderColor: "#e8772e",
        backgroundColor: "rgba(232, 119, 46, 0.08)",
        borderWidth: 1.5,
        pointRadius: allData.length > 100 ? 0 : 2,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: "#e8772e",
        pointHoverBorderColor: "#1a1a1a",
        pointHoverBorderWidth: 2,
        tension: 0.3,
        fill: true,
      },
      {
        label: "Humidity (%)",
        data: allData.map((h) => h.hum),
        borderColor: "#9ca3af",
        backgroundColor: "rgba(156, 163, 175, 0.04)",
        borderWidth: 1.5,
        pointRadius: allData.length > 100 ? 0 : 2,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: "#9ca3af",
        pointHoverBorderColor: "#1a1a1a",
        pointHoverBorderWidth: 2,
        tension: 0.3,
        fill: true,
      },
    ],
  }

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    plugins: {
      tooltip: {
        enabled: true,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        titleColor: "#1a1a1a",
        bodyColor: "#374151",
        borderColor: "rgba(0,0,0,0.08)",
        borderWidth: 1,
        titleFont: { size: 10, weight: "bold" as const },
        bodyFont: { size: 10 },
        padding: { top: 6, bottom: 6, left: 10, right: 10 },
        cornerRadius: 8,
        displayColors: true,
        boxWidth: 6,
        boxHeight: 6,
        boxPadding: 3,
        callbacks: {
          title: (ctx: any[]) => ctx[0]?.label || "",
          label: (ctx: any) => ctx.datasetIndex === 0 ? ` ${ctx.parsed.y.toFixed(1)}°C` : ` ${ctx.parsed.y.toFixed(0)}%`,
        },
      },
      legend: { display: false },
    },
    scales: {
      x: { display: false },
      y: { display: false, min: 0, max: 100 },
    },
  }

  return (
    <div className="flex flex-col bg-background rounded-md p-2.5 sm:p-4 h-full transition-all duration-300 border border-cream-200/60 shadow-card hover:shadow-card-hover hover:border-primary/20 group">
      <div className="flex items-center justify-between mb-1.5 sm:mb-2">
        <div className="flex items-center gap-1.5 sm:gap-2 bg-cream-50 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-md border border-cream-200/60">
          <Cpu className="h-3 w-3 text-primary" />
          <h3 className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate max-w-[60px] sm:max-w-full">
            {device.name}
          </h3>
        </div>
        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
          device.isOnline
            ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse'
            : 'bg-gray-300'
        }`} title={device.isOnline ? 'Online' : 'Offline'} />
      </div>

      {device.location && (
        <div className="mb-1.5 sm:mb-2 px-0.5">
          <span className="text-[9px] font-semibold text-gray-600 uppercase tracking-wider">{device.location}</span>
        </div>
      )}

      <div className="flex gap-2 sm:gap-3 mb-1.5 sm:mb-2 px-0.5 sm:px-1">
        <div className="flex flex-col flex-1">
          <div className="flex items-baseline gap-0.5">
            <span className="text-base sm:text-xl font-extrabold text-gray-900 tabular-nums tracking-tight">
              {device.temperature.toFixed(1)}
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-gray-500">°C</span>
          </div>
          <div className="flex items-center gap-0.5 mt-0.5">
            {device.tempChange >= 0 ? (
              <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-emerald-400" />
            ) : (
              <TrendingDown className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-red-400" />
            )}
            <span className={`text-[9px] sm:text-[10px] font-bold ${device.tempChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {device.tempChange >= 0 ? '+' : ''}{device.tempChange}%
            </span>
          </div>
        </div>
        <div className="w-[2px] bg-cream-200 rounded-full" />
        <div className="flex flex-col flex-1 pl-1.5">
          <div className="flex items-baseline gap-0.5">
            <span className="text-base sm:text-xl font-extrabold text-gray-900 tabular-nums tracking-tight">
              {device.humidity.toFixed(0)}
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-gray-500">%</span>
          </div>
          <div className="flex items-center gap-0.5 mt-0.5">
            {device.humChange >= 0 ? (
              <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-emerald-400" />
            ) : (
              <TrendingDown className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-red-400" />
            )}
            <span className={`text-[9px] sm:text-[10px] font-bold ${device.humChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {device.humChange >= 0 ? '+' : ''}{device.humChange}%
            </span>
          </div>
        </div>
      </div>

      <div className="h-[50px] sm:h-[70px] mt-auto">
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  )
}
