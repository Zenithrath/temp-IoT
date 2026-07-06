"use client";

interface CircularGaugeProps {
  value: number;
  max: number;
  label: string;
  unit: string;
  size?: number;
  color?: string;
  icon?: React.ReactNode;
}

export function CircularGauge({
  value,
  max,
  label,
  unit,
  size = 120,
  color = "#e8772e",
  icon,
}: CircularGaugeProps) {
  const strokeWidth = size * 0.07;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(Math.max(value / max, 0), 1);
  const strokeDashoffset = circumference * (1 - percentage);
  const gradientId = `gauge-gradient-${label.replace(/\s/g, "")}`;

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.6" />
            <stop offset="100%" stopColor={color} stopOpacity="1" />
          </linearGradient>
          <filter id={`glow-${gradientId}`}>
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(0,0,0,0.06)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          filter={`url(#glow-${gradientId})`}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {icon && <div className="mb-0.5 text-gray-500">{icon}</div>}
        <div className="flex items-baseline gap-0.5">
          <span className="text-xl font-extrabold text-gray-900 tabular-nums tracking-tight">
            {value.toFixed(value < 10 ? 1 : 0)}
          </span>
          <span className="text-[10px] font-semibold text-gray-500">{unit}</span>
        </div>
        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">{label}</span>
      </div>
    </div>
  );
}
