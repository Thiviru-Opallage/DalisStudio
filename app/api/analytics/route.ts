import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────
function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return startOfDay(d);
}

// ─────────────────────────────────────────
// GET — admin-only analytics endpoint
// ─────────────────────────────────────────
export async function GET(req: NextRequest) {
  // ── Auth guard — admin only ──
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const today = startOfDay(now);
    const last7 = daysAgo(7);
    const last30 = daysAgo(30);

    // ── Run all queries in parallel for speed ──
    const [
      totalVisits,
      visitsToday,
      visitsLast7Days,
      visitsLast30Days,
      totalUsers,
      newUsersLast30Days,
      topPages,
      visitsByDay,
      recentLogins,
      unreadMessages,
    ] = await Promise.all([
      // Total visits ever
      prisma.visits.count(),

      // Visits today
      prisma.visits.count({
        where: { visited_at: { gte: today } },
      }),

      // Visits last 7 days
      prisma.visits.count({
        where: { visited_at: { gte: last7 } },
      }),

      // Visits last 30 days
      prisma.visits.count({
        where: { visited_at: { gte: last30 } },
      }),

      // Total registered users
      prisma.users.count(),

      // New users in last 30 days
      prisma.users.count({
        where: { created_at: { gte: last30 } },
      }),

      // Top 10 most visited pages
      prisma.page_views.groupBy({
        by: ["page_path"],
        _count: { page_path: true },
        orderBy: { _count: { page_path: "desc" } },
        take: 10,
      }),

      // Visits per day for last 30 days (for chart)
      prisma.$queryRaw<{ date: string; count: number }[]>`
        SELECT
          DATE(visited_at) AS date,
          COUNT(*) AS count
        FROM visits
        WHERE visited_at >= ${last30}
        GROUP BY DATE(visited_at)
        ORDER BY date ASC
      `,

      // Last 10 successful logins
      prisma.login_logs.findMany({
        where: { status: "success" },
        orderBy: { created_at: "desc" },
        take: 10,
        select: {
          email: true,
          ip_address: true,
          created_at: true,
          users: { select: { name: true } },
        },
      }),

      // Unread contact messages count
      prisma.contact_messages.count({
        where: { is_read: false },
      }),
    ]);

    return NextResponse.json({
      site: {
        total_visits: totalVisits,
        visits_today: visitsToday,
        visits_last_7_days: visitsLast7Days,
        visits_last_30_days: visitsLast30Days,
        top_pages: topPages.map((p) => ({
          path: p.page_path,
          views: p._count.page_path,
        })),
        visits_by_day: visitsByDay.map((r) => ({
          date: r.date,
          count: Number(r.count), // BigInt → number
        })),
      },
      users: {
        total: totalUsers,
        new_last_30_days: newUsersLast30Days,
      },
      recent_logins: recentLogins.map((l) => ({
        name: l.users?.name || "Guest",
        email: l.email,
        ip: l.ip_address,
        at: l.created_at,
      })),
      messages: {
        unread: unreadMessages,
      },
      // Placeholders for social — you'll wire these up with real API keys later
      social: {
        instagram: { followers: null, reach: null, note: "API key required" },
        tiktok: { followers: null, views: null, note: "API key required" },
      },
    });
  } catch (err) {
    console.error("[Analytics] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}