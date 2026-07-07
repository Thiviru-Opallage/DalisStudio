import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminDashboardPage() {
  // 1. Core Security Check: Server-side authentication and role check
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    redirect("/login");
  }

  const now = new Date();
  const past24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // 2. Fetch Dashboard Statistics and Logs
  const [
    totalUsers,
    unreadMessages,
    totalVisits,
    activeSessions,
    failedLogins24h,
    recentLogs,
  ] = await Promise.all([
    prisma.users.count(),
    prisma.contact_messages.count({ where: { is_read: false } }),
    prisma.visits.count(),
    prisma.sessions.count({ where: { expires_at: { gte: now } } }),
    prisma.login_logs.count({
      where: {
        status: "failed",
        created_at: { gte: past24Hours },
      },
    }),
    prisma.login_logs.findMany({
      orderBy: { created_at: "desc" },
      take: 5,
      select: {
        id: true,
        email: true,
        status: true,
        ip_address: true,
        user_agent: true,
        created_at: true,
        users: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Welcome back, <span className="font-semibold text-gray-800">{session.user.name || "Admin"}</span>. 
            Monitor security and manage your site settings.
          </p>
        </div>
        <div className="text-sm text-gray-500 bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm self-start">
          <span className="font-semibold text-gray-700">System Time:</span>{" "}
          {new Date().toLocaleString("en-US", {
            timeZone: "Asia/Colombo",
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </div>
      </div>

      {/* ── Security Alert Banner ── */}
      {failedLogins24h > 5 ? (
        <div className="flex items-start gap-4 p-4 rounded-xl border border-red-200 bg-red-50 text-red-900 shadow-sm animate-pulse">
          <svg className="w-6 h-6 text-red-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h3 className="font-semibold text-red-800">Potential Security Threat Detected</h3>
            <p className="text-sm text-red-700 mt-1">
              There have been <span className="font-bold">{failedLogins24h} failed login attempts</span> within the last 24 hours. 
              Please monitor the audit log below for suspicious IP addresses or brute-force activity.
            </p>
          </div>
        </div>
      ) : failedLogins24h > 0 ? (
        <div className="flex items-start gap-4 p-4 rounded-xl border border-yellow-200 bg-yellow-50 text-yellow-900 shadow-sm">
          <svg className="w-6 h-6 text-yellow-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h3 className="font-semibold text-yellow-800">Security Warning</h3>
            <p className="text-sm text-yellow-700 mt-1">
              There was <span className="font-bold">{failedLogins24h} failed login attempt(s)</span> in the past 24 hours.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-4 p-4 rounded-xl border border-green-200 bg-green-50 text-green-900 shadow-sm">
          <svg className="w-6 h-6 text-green-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <div>
            <h3 className="font-semibold text-green-800">All Security Systems Normal</h3>
            <p className="text-sm text-green-700 mt-1">
              No suspicious failed login activities recorded in the last 24 hours. The portal remains secure.
            </p>
          </div>
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Visits</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{totalVisits.toLocaleString()}</p>
          </div>
          <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Registered Users</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{totalUsers.toLocaleString()}</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Sessions</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{activeSessions.toLocaleString()}</p>
          </div>
          <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.07 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
          </div>
        </div>

        <div className={`bg-white p-6 rounded-2xl border shadow-sm flex items-center justify-between ${unreadMessages > 0 ? "border-amber-200 bg-amber-50/20" : "border-gray-200"}`}>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Unread Messages</p>
            <p className={`text-3xl font-bold mt-1 ${unreadMessages > 0 ? "text-amber-600" : "text-gray-900"}`}>{unreadMessages.toLocaleString()}</p>
          </div>
          <div className={`p-3 rounded-xl ${unreadMessages > 0 ? "bg-amber-100 text-amber-700" : "bg-gray-50 text-gray-500"}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Shortcuts Section (Navigation Center) ── */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Management Center & Shortcuts</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/admin/analytics" className="group p-6 rounded-2xl border border-gray-200 bg-white hover:border-black transition-all shadow-sm hover:shadow-md duration-300">
            <div className="flex items-center gap-3">
              <div className="bg-black text-white p-2.5 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 text-lg group-hover:text-black">Site Analytics</h3>
            </div>
            <p className="text-sm text-gray-500 mt-3 leading-relaxed">
              Explore page views, visitor duration, device types, bouncing patterns, and detailed traffic insights.
            </p>
            <div className="flex items-center gap-1 text-sm font-semibold text-gray-900 mt-4 group-hover:translate-x-1 transition-transform">
              Open Analytics Dashboard &rarr;
            </div>
          </Link>

          <Link href="/admin/users" className="group p-6 rounded-2xl border border-gray-200 bg-white hover:border-black transition-all shadow-sm hover:shadow-md duration-300">
            <div className="flex items-center gap-3">
              <div className="bg-black text-white p-2.5 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 text-lg group-hover:text-black">User Accounts</h3>
            </div>
            <p className="text-sm text-gray-500 mt-3 leading-relaxed">
              Oversee registration lists, promote accounts to administrator, enable/disable profiles, and verify status.
            </p>
            <div className="flex items-center gap-1 text-sm font-semibold text-gray-900 mt-4 group-hover:translate-x-1 transition-transform">
              Manage User Accounts &rarr;
            </div>
          </Link>

          <Link href="/admin/messages" className="group p-6 rounded-2xl border border-gray-200 bg-white hover:border-black transition-all shadow-sm hover:shadow-md duration-300">
            <div className="flex items-center gap-3">
              <div className="bg-black text-white p-2.5 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 text-lg group-hover:text-black">Inquiries & Messages</h3>
            </div>
            <p className="text-sm text-gray-500 mt-3 leading-relaxed">
              Read customer inquiries submitted through contact forms, view contact information, and mark messages read/unread.
            </p>
            <div className="flex items-center gap-1 text-sm font-semibold text-gray-900 mt-4 group-hover:translate-x-1 transition-transform">
              View Inbox &rarr;
            </div>
          </Link>
        </div>
      </div>

      {/* ── Security Audit Log ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">System Security Audit Log</h2>
            <p className="text-xs text-gray-400 mt-0.5">Tracking recent database authentication attempts</p>
          </div>
          <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full font-mono">Live Monitoring</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="px-6 py-3">Timestamp</th>
                <th className="px-6 py-3">User Identity</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">IP Address</th>
                <th className="px-6 py-3">User Agent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {recentLogs.length > 0 ? (
                recentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs whitespace-nowrap">
                      {log.created_at.toLocaleString("en-US", {
                        timeZone: "Asia/Colombo",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {log.users?.name || "Guest Access"}
                      </div>
                      <div className="text-xs text-gray-400 font-mono">{log.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        log.status === "success" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {log.status === "success" ? "Success" : "Failed"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500 whitespace-nowrap">
                      {log.ip_address || "Unknown"}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400 max-w-xs truncate" title={log.user_agent || ""}>
                      {log.user_agent || "N/A"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    No login logs recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
