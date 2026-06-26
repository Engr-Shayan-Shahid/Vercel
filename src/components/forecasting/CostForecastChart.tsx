"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { CBAM_PHASE_IN_SCHEDULE } from "@/lib/cbam-constants";

export interface ForecastDataPoint {
  year: number;
  verified: number;
  defaults: number;
}

interface CostForecastChartProps {
  data: ForecastDataPoint[];
}

const FORECAST_YEARS = Object.keys(CBAM_PHASE_IN_SCHEDULE)
  .map(Number)
  .sort((a, b) => a - b);

function formatEuro(value: number): string {
  if (value >= 1_000_000) {
    return `€${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `€${(value / 1_000).toFixed(0)}K`;
  }
  return `€${value.toFixed(0)}`;
}

interface TooltipPayloadEntry {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string | number;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-border/80 bg-charcoal px-4 py-3 shadow-xl">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            {entry.name}
          </span>
          <span className="text-xs font-semibold tabular-nums text-foreground">
            {formatEuro(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function CostForecastChart({ data }: CostForecastChartProps) {
  const hasData = data.some((d) => d.verified > 0 || d.defaults > 0);

  return (
    <Card className="border-border/80 bg-charcoal/40">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-medium normal-case tracking-normal text-foreground">
          <TrendingUp className="h-4 w-4 text-primary" />
          CBAM Cost Forecast 2026–2034
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Estimated annual CBAM liability as the phase-in rate rises to 100% by 2034.
          {!hasData && " Add import records to see your personalised forecast."}
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 8, right: 16, left: 8, bottom: 4 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.06)"
                vertical={false}
              />
              <XAxis
                dataKey="year"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatEuro}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: "12px", color: "hsl(var(--muted-foreground))" }}
              />
              <Line
                type="monotone"
                dataKey="verified"
                name="With verified emissions"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="defaults"
                name="With default values"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="5 3"
                dot={{ r: 3, fill: "#f59e0b", strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          {FORECAST_YEARS.map((year) => (
            <span key={year}>
              {year}:{" "}
              <span className="font-medium text-foreground">
                {(CBAM_PHASE_IN_SCHEDULE[year] * 100).toFixed(1)}%
              </span>
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
