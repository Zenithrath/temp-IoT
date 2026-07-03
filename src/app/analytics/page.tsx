"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { TrendingUp, TrendingDown, Calendar, ArrowUpRight } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

type Period = "weekly" | "biweekly" | "monthly";

const mockData: Record<Period, { 
  labels: string[]; 
  temp: number[]; 
  hum: number[]; 
  avgTemp: number; 
  avgHum: number; 
  minTemp: number; 
  maxTemp: number; 
  minHum: number; 
  maxHum: number; 
  tempChange: number; 
  humChange: number; 
}> = {
  weekly: {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    temp: [26.2, 27.1, 28.0, 28.8, 29.2, 28.7, 28.5],
    hum: [58, 60, 62, 64, 66, 65, 65],
    avgTemp: 28.1,
    avgHum: 62.9,
    minTemp: 26.2,
    maxTemp: 29.2,
    minHum: 58,
    maxHum: 66,
    tempChange: 2.3,
    humChange: -1.2,
  },
  biweekly: {
    labels: ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9", "W10", "W11", "W12", "W13", "W14"],
    temp: [25.0, 25.5, 26.2, 27.1, 28.0, 28.8, 29.2, 28.7, 28.5, 27.8, 26.5, 27.0, 28.2, 28.5],
    hum: [55, 56, 58, 60, 62, 64, 66, 65, 65, 63, 61, 62, 64, 65],
    avgTemp: 27.4,
    avgHum: 61.6,
    minTemp: 25.0,
    maxTemp: 29.2,
    minHum: 55,
    maxHum: 66,
    tempChange: 3.1,
    humChange: -0.8,
  },
  monthly: {
    labels: ["W1", "W2", "W3", "W4"],
    temp: [24.5, 26.8, 28.1, 28.5],
    hum: [52, 58, 63, 65],
    avgTemp: 27.0,
    avgHum: 59.5,
    minTemp: 24.5,
    maxTemp: 28.5,
    minHum: 52,
    maxHum: 65,
    tempChange: 4.2,
    humChange: -2.1,
  },
};

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("weekly");
  const data = mockData[period];

  const tempChartData = {
    labels: data.labels,
    datasets: [
      {
        data: data.temp,
        borderColor: "#f06a25", // Terracotta orange
        backgroundColor: "rgba(240, 106, 37, 0.04)",
        borderWidth: 2.5,
        pointRadius: 4,
        pointBackgroundColor: "#f06a25",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const humChartData = {
    labels: data.labels,
    datasets: [
      {
        data: data.hum,
        borderColor: "#475569", // Muted slate gray/blue
        backgroundColor: "rgba(71, 85, 105, 0.04)",
        borderWidth: 2.5,
        pointRadius: 4,
        pointBackgroundColor: "#475569",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    plugins: { 
      tooltip: { enabled: true }, 
      legend: { display: false } 
    },
    scales: {
      x: { 
        grid: { display: false }, 
        ticks: { color: "#8a857c", font: { size: 11, weight: "bold" as const } } 
      },
      y: { 
        grid: { color: "#f5f0e8" }, 
        ticks: { color: "#8a857c", font: { size: 11 } } 
      },
    },
  };

  return (
    <DashboardLayout>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Telemetry analysis & weather history insights</p>
        </div>

        {/* Period Selector styled like Lumos tabs */}
        <div className="flex items-center gap-1 bg-background shadow-neu-inset p-1.5 rounded-2xl border-none w-fit">
          {(["weekly", "biweekly", "monthly"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 ${
                period === p
                  ? "bg-primary text-white shadow-neu-sm border border-transparent"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {p === "weekly" ? "Weekly" : p === "biweekly" ? "2 Weeks" : "Monthly"}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Avg Temp */}
        <div className="bg-background rounded-2xl p-6 border-none shadow-neu hover:shadow-neu-sm transition-all duration-300">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Avg Temperature</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{data.avgTemp}</span>
            <span className="text-sm font-semibold text-slate-500">°C</span>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-xs font-semibold">
            {data.tempChange >= 0 ? (
              <span className="text-emerald-500 flex items-center gap-0.5">
                <TrendingUp className="h-3 w-3" />
                +{data.tempChange}%
              </span>
            ) : (
              <span className="text-red-500 flex items-center gap-0.5">
                <TrendingDown className="h-3 w-3" />
                {data.tempChange}%
              </span>
            )}
            <span className="text-slate-400">vs last period</span>
          </div>
        </div>

        {/* Avg Hum */}
        <div className="bg-background rounded-2xl p-6 border-none shadow-neu hover:shadow-neu-sm transition-all duration-300">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Avg Humidity</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{data.avgHum}</span>
            <span className="text-sm font-semibold text-slate-500">%</span>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-xs font-semibold">
            {data.humChange >= 0 ? (
              <span className="text-emerald-500 flex items-center gap-0.5">
                <TrendingUp className="h-3 w-3" />
                +{data.humChange}%
              </span>
            ) : (
              <span className="text-red-500 flex items-center gap-0.5">
                <TrendingDown className="h-3 w-3" />
                {data.humChange}%
              </span>
            )}
            <span className="text-slate-400">vs last period</span>
          </div>
        </div>

        {/* Temp Range */}
        <div className="bg-background rounded-2xl p-6 border-none shadow-neu hover:shadow-neu-sm transition-all duration-300">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Temp Range</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">{data.minTemp}</span>
            <span className="text-slate-300 mx-1.5">—</span>
            <span className="text-2xl font-bold text-slate-900 tabular-nums">{data.maxTemp}</span>
            <span className="text-xs font-semibold text-slate-500 ml-1.5">°C</span>
          </div>
          <span className="text-[10px] text-slate-400 font-bold block mt-3 uppercase tracking-wider">Telemetry Bounds</span>
        </div>

        {/* Humidity Range */}
        <div className="bg-background rounded-2xl p-6 border-none shadow-neu hover:shadow-neu-sm transition-all duration-300">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Humidity Range</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">{data.minHum}</span>
            <span className="text-slate-300 mx-1.5">—</span>
            <span className="text-2xl font-bold text-slate-900 tabular-nums">{data.maxHum}</span>
            <span className="text-xs font-semibold text-slate-500 ml-1.5">%</span>
          </div>
          <span className="text-[10px] text-slate-400 font-bold block mt-3 uppercase tracking-wider">Telemetry Bounds</span>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Temperature chart */}
        <div className="bg-background rounded-2xl p-6 border-none shadow-neu hover:shadow-neu-sm transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-900">Temperature History</h3>
              <p className="text-xs text-slate-400 mt-0.5">Continuous heat scale logging</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary" />
              <span className="text-xs font-semibold text-slate-500">Scale (°C)</span>
            </div>
          </div>
          <div className="h-[300px]">
            <Line data={tempChartData} options={chartOptions} />
          </div>
        </div>

        {/* Humidity chart */}
        <div className="bg-background rounded-2xl p-6 border-none shadow-neu hover:shadow-neu-sm transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-900">Humidity History</h3>
              <p className="text-xs text-slate-400 mt-0.5">Continuous moisture scale logging</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#475569]" />
              <span className="text-xs font-semibold text-slate-500">Scale (%)</span>
            </div>
          </div>
          <div className="h-[300px]">
            <Line data={humChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-background rounded-2xl p-6 border-none shadow-neu">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h3 className="font-bold text-slate-900">Telemetry Data Log</h3>
            <p className="text-xs text-slate-400 mt-0.5">Detailed records per day/period</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Avg Temp:</span>
              <span className="text-sm font-extrabold text-primary">{data.avgTemp}°C</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Avg Hum:</span>
              <span className="text-sm font-extrabold text-[#475569]">{data.avgHum}%</span>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto rounded-xl border border-slate-200/50 shadow-neu-inset">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600 font-semibold">
              <tr>
                <th className="px-4 py-3">Period / Date</th>
                <th className="px-4 py-3">Temperature (°C)</th>
                <th className="px-4 py-3">Humidity (%)</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50">
              {data.labels.map((label, index) => (
                <tr key={label} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-800">{label}</td>
                  <td className="px-4 py-3 tabular-nums">{data.temp[index].toFixed(1)}</td>
                  <td className="px-4 py-3 tabular-nums">{data.hum[index]}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      data.temp[index] > 30 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                    }`}>
                      {data.temp[index] > 30 ? 'Warning' : 'Optimal'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
