"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";

type ChartPoint   = { date: string; count: number };
type PageRow      = { path: string; views: number };
type LoginRow     = { name: string; email: string; ip: string; at: string };
type DeviceRow    = { name: string; value: number };
type ReferrerRow  = { referrer: string; count: number };
type HourRow      = { hour: number; count: number };

interface Props {
  chartData:         ChartPoint[];
  topPages:          PageRow[];
  recentLogins:      LoginRow[];
  deviceData:        DeviceRow[];
  referrerData:      ReferrerRow[];
  hourlyData:        HourRow[];
  newVisitors:       number;
  returningVisitors: number;
}

// Parse a YYYY-MM-DD string safely without timezone shift
function parseDateLabel(v: string) {
  const parts = String(v).split("T")[0].split("-");
  if (parts.length === 3) {
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return v;
}

function parseDateFull(v: string) {
  const parts = String(v).split("T")[0].split("-");
  if (parts.length === 3) {
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d.toLocaleDateString("en-US", { dateStyle: "medium" });
  }
  return v;
}

// Simple mobile breakpoint hook (matches Tailwind's `sm` cutoff)
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

const CHART_COLORS = {
  primary: "#18181b",
  secondary: "#71717a",
  muted: "#d4d4d8",
  accent1: "#3f3f46",
  accent2: "#a1a1aa",
};

const DEVICE_COLORS   = ["#18181b", "#71717a", "#d4d4d8"];
const NR_COLORS       = ["#18181b", "#d4d4d8"];

const tooltipStyle = {
  fontSize: 12,
  borderRadius: 8,
  border: "1px solid #e4e4e7",
  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
  color: "#18181b",
  backgroundColor: "#fff",
};

const legendStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#52525b",
};

// Custom tooltip label renderer for pie charts
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
  if ((percent ?? 0) < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5 + 20;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#18181b" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" fontSize={11}>
      {name} {((percent ?? 0) * 100).toFixed(0)}%
    </text>
  );
};

export default function AnalyticsCharts({
  chartData, topPages, recentLogins,
  deviceData, referrerData, hourlyData,
  newVisitors, returningVisitors,
}: Props) {
  const isMobile = useIsMobile();

  const nrData = [
    { name: "New",       value: newVisitors       },
    { name: "Returning", value: returningVisitors },
  ];

  // Filter out empty/localhost referrers and show a proper note if only local
  const externalReferrers = referrerData.filter(
    (r) => r.referrer && r.referrer !== "" && r.referrer !== "localhost" && !r.referrer.startsWith("127.")
  );
  const hasOnlyLocalReferrers = referrerData.length > 0 && externalReferrers.length === 0;

  const catAxisWidth = isMobile ? 70 : 100;
  const referrerAxisWidth = isMobile ? 76 : 110;
  const barChartHeight = isMobile ? 200 : 240;
  const areaChartHeight = isMobile ? 220 : 260;
  const pieChartHeight = isMobile ? 220 : 240;
  const pieOuterRadius = isMobile ? 65 : 80;
  const pieInnerRadius = isMobile ? 42 : 50;

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* ── Visits over time ── */}
      <Card title="Visits Over Time" subtitle="Daily unique visits for the last 30 days">
        {chartData.length === 0
          ? <Empty text="No visit data recorded yet." />
          : (
            <ResponsiveContainer width="100%" height={areaChartHeight}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="visitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#18181b" stopOpacity={0.08} />
                    <stop offset="95%" stopColor="#18181b" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: isMobile ? 9 : 11, fill: "#71717a" }}
                  tickFormatter={parseDateLabel}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  minTickGap={isMobile ? 20 : 5}
                />
                <YAxis
                  tick={{ fontSize: isMobile ? 9 : 11, fill: "#71717a" }}
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  width={isMobile ? 28 : 40}
                />
                <Tooltip
                  labelFormatter={(v: any) => parseDateFull(String(v))}
                  contentStyle={tooltipStyle}
                  formatter={(val: any) => [val, "Visits"]}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#18181b"
                  strokeWidth={2}
                  fill="url(#visitGradient)"
                  dot={false}
                  activeDot={{ r: 4, fill: "#18181b" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )
        }
      </Card>

      {/* ── Top pages + Peak hours ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card title="Top Pages" subtitle="Most visited pages this period">
          {topPages.length === 0
            ? <Empty text="No page view data yet." />
            : (
              <ResponsiveContainer width="100%" height={barChartHeight}>
                <BarChart data={topPages} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: isMobile ? 9 : 10, fill: "#71717a" }} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="path"
                    tick={{ fontSize: isMobile ? 9 : 10, fill: "#52525b" }}
                    width={catAxisWidth}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(val: any) => [val, "Views"]}
                  />
                  <Bar dataKey="views" fill="#18181b" radius={[0, 4, 4, 0]} barSize={isMobile ? 12 : 14} />
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </Card>

        <Card title="Peak Hours" subtitle="Visitor activity by hour of day">
          <ResponsiveContainer width="100%" height={barChartHeight}>
            <BarChart data={hourlyData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: isMobile ? 9 : 10, fill: "#71717a" }}
                tickFormatter={(h) => `${h}h`}
                interval={isMobile ? 3 : 2}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: isMobile ? 9 : 10, fill: "#71717a" }}
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={isMobile ? 22 : 30}
              />
              <Tooltip
                labelFormatter={(h) => `${h}:00 – ${h}:59`}
                contentStyle={tooltipStyle}
                formatter={(val: any) => [val, "Visits"]}
              />
              <Bar dataKey="count" fill="#18181b" radius={[3, 3, 0, 0]} barSize={isMobile ? 10 : 14} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* ── Referrers + Device breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card title="Top Referrers" subtitle="Where your visitors are coming from">
          {hasOnlyLocalReferrers ? (
            <div className="flex flex-col items-center justify-center py-8 sm:py-10 gap-2 px-2">
              <svg className="w-8 h-8 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <p className="text-sm text-zinc-400 text-center">All traffic is coming directly or from localhost.</p>
              <p className="text-xs text-zinc-400 text-center">External referrers will appear here in production.</p>
            </div>
          ) : externalReferrers.length === 0 ? (
            <Empty text="No external referrer data yet." />
          ) : (
            <ResponsiveContainer width="100%" height={barChartHeight}>
              <BarChart data={externalReferrers} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: isMobile ? 9 : 10, fill: "#71717a" }} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="referrer"
                  tick={{ fontSize: isMobile ? 9 : 10, fill: "#52525b" }}
                  width={referrerAxisWidth}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip contentStyle={tooltipStyle} formatter={(val: any) => [val, "Visits"]} />
                <Bar dataKey="count" fill="#71717a" radius={[0, 4, 4, 0]} barSize={isMobile ? 12 : 14} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card title="Device Breakdown" subtitle="Visitor device types this month">
          {deviceData.length === 0
            ? <Empty text="No device data yet." />
            : (
              <ResponsiveContainer width="100%" height={pieChartHeight}>
                <PieChart>
                  <Pie
                    data={deviceData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={pieInnerRadius}
                    outerRadius={pieOuterRadius}
                    paddingAngle={3}
                    labelLine={false}
                    label={renderCustomLabel}
                  >
                    {deviceData.map((_, i) => (
                      <Cell key={i} fill={DEVICE_COLORS[i % DEVICE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={legendStyle} iconSize={10} iconType="circle" />
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            )
          }
        </Card>
      </div>

      {/* ── New vs Returning + Recent logins ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card title="New vs Returning Visitors" subtitle="Visitor loyalty breakdown this month">
          {newVisitors === 0 && returningVisitors === 0 ? (
            <Empty text="No visitor data yet." />
          ) : (
            <ResponsiveContainer width="100%" height={pieChartHeight}>
              <PieChart>
                <Pie
                  data={nrData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  innerRadius={pieInnerRadius}
                  outerRadius={pieOuterRadius}
                  paddingAngle={3}
                  labelLine={false}
                  label={renderCustomLabel}
                >
                  {nrData.map((_, i) => (
                    <Cell key={i} fill={NR_COLORS[i % NR_COLORS.length]} />
                  ))}
                </Pie>
                <Legend wrapperStyle={legendStyle} iconSize={10} iconType="circle" />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(val: any, name: any) => [val.toLocaleString(), String(name)]}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card title="Recent Logins" subtitle="Latest successful admin sign-ins">
          {recentLogins.length === 0
            ? <Empty text="No logins recorded yet." />
            : (
              <div className="overflow-x-auto -mx-1 px-1">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100">
                      <th className="text-left pb-2.5 px-1 font-medium text-zinc-400 text-xs uppercase tracking-wide">
                        User
                      </th>
                      <th className="hidden sm:table-cell text-left pb-2.5 px-1 font-medium text-zinc-400 text-xs uppercase tracking-wide">
                        IP Address
                      </th>
                      <th className="text-left pb-2.5 px-1 font-medium text-zinc-400 text-xs uppercase tracking-wide">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLogins.map((l, i) => (
                      <tr key={i} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors">
                        <td className="py-2.5 px-1 pr-3">
                          <p className="font-medium text-zinc-800 truncate max-w-[110px] sm:max-w-[130px] text-xs">{l.name}</p>
                          <p className="text-zinc-400 truncate max-w-[110px] sm:max-w-[130px] text-xs">{l.email}</p>
                          <p className="sm:hidden text-zinc-400 text-[11px] font-mono mt-0.5">{l.ip}</p>
                        </td>
                        <td className="hidden sm:table-cell py-2.5 px-1 text-zinc-500 text-xs font-mono whitespace-nowrap">{l.ip}</td>
                        <td className="py-2.5 px-1 text-zinc-500 text-xs whitespace-nowrap">
                          {new Date(l.at).toLocaleString("en-US", {
                            timeZone: "Asia/Colombo",
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </Card>
      </div>
    </div>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow">
      <div className="mb-3 sm:mb-4">
        <h2 className="text-sm font-semibold text-zinc-800">{title}</h2>
        {subtitle && <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center py-8 sm:py-10">
      <p className="text-sm text-zinc-400">{text}</p>
    </div>
  );
}