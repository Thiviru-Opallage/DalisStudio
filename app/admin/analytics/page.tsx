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

// Format avg session duration into a human-readable string
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
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
      _count: { _all: true },
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
    name: d.device_type ?? "Unknown",
    value: d._count?._all ?? 0,
  }));

  const referrerData = referrers.map((r) => ({
    referrer: (() => {
      try { return new URL(r.referrer).hostname; } catch { return r.referrer; }
    })(),
    count: Number(r.count),
  }));

  const bounceRow  = bounceData[0];
  const bounceRate = bounceRow
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

  const updatedAt = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Colombo", dateStyle: "medium", timeStyle: "short",
  });

  return (
    <div className="p-6 lg:p-8 space-y-8 text-zinc-900 max-w-7xl">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">Analytics</h1>
          <p className="text-xs text-zinc-400 mt-1">Last updated: {updatedAt}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-50 border border-zinc-200 rounded-full px-3 py-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
          Live data
        </span>
      </div>

      {/* ── Traffic Overview ── */}
      <section>
        <SectionLabel>Traffic Overview</SectionLabel>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Total Visits"
            value={totalVisits.toLocaleString()}
            icon={<EyeIcon />}
            description="All time"
          />
          <StatCard
            label="Today"
            value={visitsToday.toLocaleString()}
            icon={<CalendarIcon />}
            description="Visits today"
          />
          <StatCard
            label="Last 7 Days"
            value={visitsLast7.toLocaleString()}
            icon={<TrendIcon />}
            description="Past week"
          />
          <StatCard
            label="Last 30 Days"
            value={visitsLast30.toLocaleString()}
            icon={<ChartIcon />}
            description="Past month"
          />
        </div>
      </section>

      {/* ── Audience & Engagement ── */}
      <section>
        <SectionLabel>Audience & Engagement</SectionLabel>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Total Users"
            value={totalUsers.toLocaleString()}
            icon={<UsersIcon />}
            description="Registered accounts"
          />
          <StatCard
            label="New Users"
            value={newUsers.toLocaleString()}
            icon={<PersonPlusIcon />}
            description="Joined last 30 days"
          />
          <StatCard
            label="Bounce Rate"
            value={`${bounceRate}%`}
            icon={<BounceIcon />}
            description="Single-page sessions"
            accent={bounceRate > 70 ? "warn" : bounceRate > 50 ? "neutral" : "good"}
          />
          <StatCard
            label="Avg. Session"
            value={formatDuration(avgDurationSec)}
            icon={<ClockIcon />}
            description="Engaged visits only"
          />
        </div>
      </section>

      {/* ── Visitors ── */}
      <section>
        <SectionLabel>Visitor Insights</SectionLabel>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <StatCard
            label="New Visitors"
            value={newVisitors.toLocaleString()}
            icon={<StarIcon />}
            description="First-time (last 30d)"
          />
          <StatCard
            label="Returning Visitors"
            value={returningVisitors.toLocaleString()}
            icon={<ReturnIcon />}
            description="Repeat visitors (last 30d)"
          />
          <StatCard
            label="Unread Messages"
            value={unreadMessages.toLocaleString()}
            icon={<MailIcon />}
            description="In your inbox"
            accent={unreadMessages > 0 ? "warn" : "neutral"}
          />
        </div>
      </section>

      {/* ── Charts ── */}
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

// ── Section label ──────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-3">
      {children}
    </p>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────

type Accent = "neutral" | "good" | "warn";

function StatCard({
  label, value, description, icon, accent = "neutral",
}: {
  label: string;
  value: string;
  description?: string;
  icon?: React.ReactNode;
  accent?: Accent;
}) {
  const accentClass: Record<Accent, string> = {
    neutral: "text-zinc-400",
    good:    "text-emerald-500",
    warn:    "text-amber-500",
  };
  const iconBg: Record<Accent, string> = {
    neutral: "bg-zinc-100 text-zinc-500",
    good:    "bg-emerald-50 text-emerald-600",
    warn:    "bg-amber-50 text-amber-500",
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4 hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconBg[accent]}`}>
          {icon}
        </div>
      </div>
      <p className={`text-2xl font-bold tracking-tight ${accentClass[accent] === "text-zinc-400" ? "text-zinc-900" : accentClass[accent]}`}>
        {value}
      </p>
      <p className="text-xs font-medium text-zinc-600 mt-0.5">{label}</p>
      {description && <p className="text-xs text-zinc-400 mt-0.5">{description}</p>}
    </div>
  );
}

// ── Icons (inline SVG, 16px) ───────────────────────────────────────────────

const iconProps = { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" } as const;
const sw = { strokeLinecap: "round" as const, strokeLinejoin: "round" as const, strokeWidth: 2 };

function EyeIcon()        { return <svg {...iconProps}><path {...sw} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path {...sw} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>; }
function CalendarIcon()   { return <svg {...iconProps}><path {...sw} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>; }
function TrendIcon()      { return <svg {...iconProps}><path {...sw} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>; }
function ChartIcon()      { return <svg {...iconProps}><path {...sw} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>; }
function UsersIcon()      { return <svg {...iconProps}><path {...sw} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>; }
function PersonPlusIcon() { return <svg {...iconProps}><path {...sw} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>; }
function BounceIcon()     { return <svg {...iconProps}><path {...sw} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>; }
function ClockIcon()      { return <svg {...iconProps}><circle cx="12" cy="12" r="10" {...sw} /><path {...sw} d="M12 6v6l4 2" /></svg>; }
function StarIcon()       { return <svg {...iconProps}><path {...sw} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>; }
function ReturnIcon()     { return <svg {...iconProps}><path {...sw} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>; }
function MailIcon()       { return <svg {...iconProps}><path {...sw} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>; }