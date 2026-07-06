"use client";

import { useState, useMemo, useEffect } from "react";
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
import { useAnalytics, TimeRange } from "@/hooks/useAnalytics";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: "1w", label: "1 Week" },
  { value: "2w", label: "2 Weeks" },
  { value: "1m", label: "1 Month" },
  { value: "1y", label: "1 Year" },
];

export default function AnalyticsPage() {
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>("1w");
  const [tablePage, setTablePage] = useState(0);
  const { data, devices, loaded, error } = useAnalytics(selectedDevice, timeRange);

  const ROWS_PER_PAGE = 10;

  const sortedReadings = useMemo(() => {
    return [...data.rawReadings].reverse();
  }, [data.rawReadings]);

  // Reset page when data changes
  useEffect(() => {
    setTablePage(0);
  }, [selectedDevice, timeRange]);

  const totalPages = Math.ceil(sortedReadings.length / ROWS_PER_PAGE);
  const pageReadings = sortedReadings.slice(tablePage * ROWS_PER_PAGE, (tablePage + 1) * ROWS_PER_PAGE);

  const tempChartData = {
    labels: data.labels,
    datasets: [
      {
        data: data.temp,
        borderColor: "#e8772e",
        backgroundColor: "rgba(232, 119, 46, 0.04)",
        borderWidth: 2.5,
        pointRadius: data.labels.length > 100 ? 0 : 4,
        pointBackgroundColor: "#e8772e",
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
        borderColor: "#475569",
        backgroundColor: "rgba(71, 85, 105, 0.04)",
        borderWidth: 2.5,
        pointRadius: data.labels.length > 100 ? 0 : 4,
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
      legend: { display: false },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: "#8a857c",
          font: { size: 11, weight: "bold" as const },
          maxTicksLimit: 12,
        },
      },
      y: {
        grid: { color: "#f5f0e8" },
        ticks: { color: "#8a857c", font: { size: 11 } },
      },
    },
  };

  if (!loaded) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-slate-500 font-semibold">Loading analytics data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <p className="text-sm text-red-500 font-semibold">Failed to load analytics: {error}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const hasData = data.labels.length > 0;

  return (
    <DashboardLayout>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Telemetry analysis & weather history insights</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Device Selector */}
          <select
            value={selectedDevice ?? ""}
            onChange={(e) => setSelectedDevice(e.target.value || null)}
            className="px-4 py-2 text-xs font-bold rounded-md border border-gray-200/60 bg-background text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Select Device</option>
            {devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Time Range Selector */}
          <div className="flex items-center gap-1 bg-background p-1.5 rounded-md border border-gray-200/60">
            {TIME_RANGES.map((tr) => (
              <button
                key={tr.value}
                onClick={() => setTimeRange(tr.value)}
                className={`px-4 py-2 text-xs font-bold rounded-md transition-all duration-200 ${
                  timeRange === tr.value
                    ? "bg-primary text-white shadow-card border border-transparent"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {tr.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!selectedDevice ? (
        <div className="bg-background rounded-md p-12 border border-gray-200/60 shadow-card text-center">
          <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="font-bold text-slate-900 mb-2">Select a Device</h3>
          <p className="text-sm text-slate-400">Choose a device from the dropdown above to view its analytics.</p>
        </div>
      ) : !hasData ? (
        <div className="bg-background rounded-md p-12 border border-gray-200/60 shadow-card text-center">
          <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="font-bold text-slate-900 mb-2">No Data Yet</h3>
          <p className="text-sm text-slate-400">No telemetry data found for this device in the selected time range.</p>
        </div>
      ) : (
      <>
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Avg Temp */}
        <div className="bg-background rounded-md p-6 border border-gray-200/60 shadow-card hover:shadow-card-hover transition-all duration-300">
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
        <div className="bg-background rounded-md p-6 border border-gray-200/60 shadow-card hover:shadow-card-hover transition-all duration-300">
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
        <div className="bg-background rounded-md p-6 border border-gray-200/60 shadow-card hover:shadow-card-hover transition-all duration-300">
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
        <div className="bg-background rounded-md p-6 border border-gray-200/60 shadow-card hover:shadow-card-hover transition-all duration-300">
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
        <div className="bg-background rounded-md p-6 border border-gray-200/60 shadow-card hover:shadow-card-hover transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-900">Temperature History</h3>
              <p className="text-xs text-slate-400 mt-0.5">Per reading — {data.rawReadings.length} data points</p>
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
        <div className="bg-background rounded-md p-6 border border-gray-200/60 shadow-card hover:shadow-card-hover transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-900">Humidity History</h3>
              <p className="text-xs text-slate-400 mt-0.5">Per reading — {data.rawReadings.length} data points</p>
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

      {/* Data Table — Raw Readings */}
      <div className="bg-background rounded-md p-6 border border-gray-200/60 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h3 className="font-bold text-slate-900">Telemetry Data Log</h3>
            <p className="text-xs text-slate-400 mt-0.5">{sortedReadings.length} records — newest first</p>
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

        <div className="rounded-md border border-gray-200/60 overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[600px]">
            <thead className="bg-slate-100 text-slate-600 font-semibold">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Temperature (°C)</th>
                <th className="px-4 py-3">Humidity (%)</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50">
              {pageReadings.map((r, i) => {
                const rowNum = tablePage * ROWS_PER_PAGE + i + 1;
                return (
                  <tr key={rowNum} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">{rowNum}</td>
                    <td className="px-4 py-3 font-bold text-slate-800 tabular-nums">
                      {new Date(r.created_at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{r.temperature}</td>
                    <td className="px-4 py-3 tabular-nums">{r.humidity}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        r.temperature > 30 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        {r.temperature > 30 ? 'Warning' : 'Optimal'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {pageReadings.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">No data</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-slate-400 font-semibold">
              Page {tablePage + 1} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTablePage(0)}
                disabled={tablePage === 0}
                className="px-3 py-1.5 text-xs font-bold bg-background border border-gray-200/60 rounded-md shadow-card hover:shadow-card-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                First
              </button>
              <button
                onClick={() => setTablePage((p) => Math.max(0, p - 1))}
                disabled={tablePage === 0}
                className="px-3 py-1.5 text-xs font-bold bg-background border border-gray-200/60 rounded-md shadow-card hover:shadow-card-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Prev
              </button>
              <button
                onClick={() => setTablePage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={tablePage >= totalPages - 1}
                className="px-3 py-1.5 text-xs font-bold bg-background border border-gray-200/60 rounded-md shadow-card hover:shadow-card-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
              <button
                onClick={() => setTablePage(totalPages - 1)}
                disabled={tablePage >= totalPages - 1}
                className="px-3 py-1.5 text-xs font-bold bg-background border border-gray-200/60 rounded-md shadow-card hover:shadow-card-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>
      </>
      )}
    </DashboardLayout>
  );
}
