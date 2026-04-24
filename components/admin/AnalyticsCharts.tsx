"use client";

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

const DEVICE_COLORS = ["#000", "#555", "#aaa"];
const NR_COLORS     = ["#000", "#d1d5db"];

export default function AnalyticsCharts({
  chartData, topPages, recentLogins,
  deviceData, referrerData, hourlyData,
  newVisitors, returningVisitors,
}: Props) {
  const nrData = [
    { name: "New",       value: newVisitors       },
    { name: "Returning", value: returningVisitors },
  ];

  return (
    <div className="space-y-6">

      {/* Row 1: Visits over time */}
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
          Visits — Last 30 Days
        </h2>
        {chartData.length === 0
          ? <Empty text="No visit data yet." />
          : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="vg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#000" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#000" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }}
                  tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip labelFormatter={(v) => new Date(v).toLocaleDateString("en-US", { dateStyle: "medium" })} />
                <Area type="monotone" dataKey="count" stroke="#000" strokeWidth={2} fill="url(#vg)" />
              </AreaChart>
            </ResponsiveContainer>
          )
        }
      </div>

      {/* Row 2: Peak hours */}
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
          Peak Hours (Last 30 Days)
        </h2>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={hourlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="hour" tick={{ fontSize: 10 }}
              tickFormatter={(h) => `${h}:00`} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip labelFormatter={(h) => `${h}:00 – ${h}:59`} />
            <Bar dataKey="count" fill="#000" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Row 3: Top pages + Referrers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
            Top Pages
          </h2>
          {topPages.length === 0
            ? <Empty text="No page data yet." />
            : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topPages} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="path" tick={{ fontSize: 11 }} width={110} />
                  <Tooltip />
                  <Bar dataKey="views" fill="#000" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
            Top Referrers
          </h2>
          {referrerData.length === 0
            ? <Empty text="No referrer data yet." />
            : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={referrerData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="referrer" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#555" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </div>
      </div>

      {/* Row 4: Device breakdown + New vs Returning */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
            Device Breakdown
          </h2>
          {deviceData.length === 0
            ? <Empty text="No device data yet." />
            : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={deviceData} dataKey="value" nameKey="name"
                    cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) =>
                      `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }>
                    {deviceData.map((_, i) => (
                      <Cell key={i} fill={DEVICE_COLORS[i % DEVICE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )
          }
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
            New vs Returning Visitors
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={nrData} dataKey="value" nameKey="name"
                cx="50%" cy="50%" outerRadius={75}
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                {nrData.map((_, i) => (
                  <Cell key={i} fill={NR_COLORS[i % NR_COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 5: Recent logins */}
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
          Recent Logins
        </h2>
        {recentLogins.length === 0
          ? <Empty text="No logins recorded yet." />
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {["User","IP","Time"].map((h) => (
                      <th key={h} className="text-left pb-2 font-medium text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentLogins.map((l, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 pr-3">
                        <p className="font-medium truncate max-w-[140px]">{l.name}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[140px]">{l.email}</p>
                      </td>
                      <td className="py-2 pr-3 text-gray-500 text-xs">{l.ip}</td>
                      <td className="py-2 text-gray-500 text-xs">
                        {new Date(l.at).toLocaleString("en-US", {
                          timeZone: "Asia/Colombo", dateStyle: "short", timeStyle: "short",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </div>

    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-gray-400 text-center py-10">{text}</p>;
}