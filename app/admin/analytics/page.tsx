import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AnalyticsCharts from "@/components/admin/AnalyticsCharts";

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") redirect("/login");

  const last30 = daysAgo(30);
  const last7  = daysAgo(7);
  const today  = daysAgo(0);

  const [
    totalVisits, visitsToday, visitsLast7, visitsLast30,
    totalUsers, newUsers,
    topPages, visitsByDay, recentLogins, unreadMessages,
    deviceBreakdown, referrers, bounceData, avgDuration,
    hourlyData, newVsReturning,
  ] = await Promise.all([
    prisma.visits.count(),
    prisma.visits.count({ where: { visited_at: { gte: today } } }),
    prisma.visits.count({ where: { visited_at: { gte: last7 } } }),
    prisma.visits.count({ where: { visited_at: { gte: last30 } } }),
    prisma.users.count(),
    prisma.users.count({ where: { created_at: { gte: last30 } } }),

    prisma.page_views.groupBy({
      by: ["page_path"],
      _count: { page_path: true },
      orderBy: { _count: { page_path: "desc" } },
      take: 8,
    }),

    prisma.$queryRaw<{ date: string; count: bigint }[]>`
      SELECT DATE(visited_at) AS date, COUNT(*) AS count
      FROM visits WHERE visited_at >= ${last30}
      GROUP BY DATE(visited_at) ORDER BY date ASC
    `,

    prisma.login_logs.findMany({
      where: { status: "success" },
      orderBy: { created_at: "desc" },
      take: 8,
      select: {
        email: true, ip_address: true, created_at: true,
        users: { select: { name: true } },
      },
    }),

    prisma.contact_messages.count({ where: { is_read: false } }),

    // Device breakdown
    prisma.visits.groupBy({
      by: ["device_type"],
      _count: {
        _all: true,
      },
      where: { visited_at: { gte: last30 } },
    }),

    // Top referrers
    prisma.$queryRaw<{ referrer: string; count: bigint }[]>`
      SELECT referrer, COUNT(*) AS count
      FROM visits
      WHERE visited_at >= ${last30} AND referrer IS NOT NULL AND referrer != ''
      GROUP BY referrer ORDER BY count DESC LIMIT 8
    `,

    // Bounce rate (last 30 days)
    prisma.$queryRaw<{ bounced: bigint; total: bigint }[]>`
      SELECT
        SUM(CASE WHEN is_bounce = 1 THEN 1 ELSE 0 END) AS bounced,
        COUNT(*) AS total
      FROM visits WHERE visited_at >= ${last30}
    `,

    // Avg session duration (non-bounce only)
    prisma.$queryRaw<{ avg_duration: number | null }[]>`
      SELECT AVG(session_duration) AS avg_duration
      FROM visits
      WHERE visited_at >= ${last30} AND is_bounce = 0 AND session_duration IS NOT NULL
    `,

    // Hourly distribution (peak hours)
    prisma.$queryRaw<{ hour: number; count: bigint }[]>`
      SELECT HOUR(visited_at) AS hour, COUNT(*) AS count
      FROM visits WHERE visited_at >= ${last30}
      GROUP BY HOUR(visited_at) ORDER BY hour ASC
    `,

    // New vs returning (by IP)
    prisma.$queryRaw<{ is_new: number; count: bigint }[]>`
      SELECT
        CASE WHEN visit_count = 1 THEN 1 ELSE 0 END AS is_new,
        COUNT(*) AS count
      FROM (
        SELECT ip_address, COUNT(*) AS visit_count
        FROM visits WHERE visited_at >= ${last30} AND ip_address IS NOT NULL
        GROUP BY ip_address
      ) sub
      GROUP BY is_new
    `,
  ]);

  // Serialize
  const chartData = visitsByDay.map((r) => ({
    date: String(r.date).split("T")[0],
    count: Number(r.count),
  }));

  const topPagesData = topPages.map((p) => ({
    path: p.page_path,
    views: p._count.page_path,
  }));

  const recentLoginsData = recentLogins.map((l) => ({
    name:  l.users?.name || "Guest",
    email: l.email,
    ip:    l.ip_address ?? "—",
    at:    l.created_at.toISOString(),
  }));

  const deviceData = deviceBreakdown.map((d: any) => ({
    name: d.device_type ?? "unknown",
    value: d._count?._all ?? 0,
  }));

  const referrerData = referrers.map((r) => ({
    referrer: (() => {
      try { return new URL(r.referrer).hostname; } catch { return r.referrer; }
    })(),
    count: Number(r.count),
  }));

  const bounceRow   = bounceData[0];
  const bounceRate  = bounceRow
    ? Math.round((Number(bounceRow.bounced) / Number(bounceRow.total)) * 100)
    : 0;

  const avgDurationSec = Math.round(avgDuration[0]?.avg_duration ?? 0);

  const hourlyArr: { hour: number; count: number }[] = Array.from(
    { length: 24 }, (_, i) => ({ hour: i, count: 0 })
  );
  hourlyData.forEach((h) => {
    hourlyArr[h.hour].count = Number(h.count);
  });

  let newVisitors = 0, returningVisitors = 0;
  newVsReturning.forEach((r) => {
    if (r.is_new) newVisitors = Number(r.count);
    else returningVisitors = Number(r.count);
  });

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">
          Last updated:{" "}
          {new Date().toLocaleString("en-US", {
            timeZone: "Asia/Colombo", dateStyle: "medium", timeStyle: "short",
          })}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Visits"       value={totalVisits} />
        <StatCard label="Visits Today"       value={visitsToday} />
        <StatCard label="Last 7 Days"        value={visitsLast7} />
        <StatCard label="Last 30 Days"       value={visitsLast30} />
        <StatCard label="Total Users"        value={totalUsers} />
        <StatCard label="New Users (30d)"    value={newUsers} />
        <StatCard label="Bounce Rate"        value={bounceRate} suffix="%" />
        <StatCard label="Avg Session"        value={avgDurationSec} suffix="s" />
        <StatCard label="Unread Messages"    value={unreadMessages} highlight={unreadMessages > 0} />
        <StatCard label="New Visitors (30d)" value={newVisitors} />
        <StatCard label="Returning (30d)"    value={returningVisitors} />
      </div>

      {/* Charts */}
      <AnalyticsCharts
        chartData={chartData}
        topPages={topPagesData}
        recentLogins={recentLoginsData}
        deviceData={deviceData}
        referrerData={referrerData}
        hourlyData={hourlyArr}
        newVisitors={newVisitors}
        returningVisitors={returningVisitors}
      />
    </div>
  );
}

function StatCard({
  label, value, suffix = "", highlight = false,
}: {
  label: string; value: number; suffix?: string; highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-4 shadow-sm ${highlight ? "border-red-300 bg-red-50" : "bg-white"}`}>
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-bold mt-1">
        {value.toLocaleString()}{suffix}
      </p>
    </div>
  );
}