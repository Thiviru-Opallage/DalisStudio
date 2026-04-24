"use client";

import { useState } from "react";

type User = {
  id: number;
  name: string | null;
  email: string;
  role: string;
  is_active: boolean;
  email_verified: boolean;
  email_notifications: boolean;
  created_at: string;
};

export default function UsersTable({
  users: initial,
  currentAdminId,
}: {
  users: User[];
  currentAdminId: string;
}) {
  const [users, setUsers]   = useState(initial);
  const [loading, setLoading] = useState<string | null>(null); // "id-action"

  async function patch(id: number, action: string, body: object) {
    setLoading(`${id}-${action}`);
    try {
      const res = await fetch(`/api/admin/users/${id}/${action}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error ?? "Something went wrong.");
        return null;
      }
      return await res.json();
    } catch {
      alert("Network error. Try again.");
      return null;
    } finally {
      setLoading(null);
    }
  }

  async function toggleActive(id: number, current: boolean) {
    const data = await patch(id, "toggle-active", { is_active: !current });
    if (data?.success) {
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, is_active: !current } : u))
      );
    }
  }

  async function toggleRole(id: number, current: string) {
    const newRole = current === "admin" ? "user" : "admin";
    const confirm = window.confirm(
      `${newRole === "admin" ? "Promote" : "Demote"} this user to ${newRole}?`
    );
    if (!confirm) return;
    const data = await patch(id, "set-role", { role: newRole });
    if (data?.success) {
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, role: newRole } : u))
      );
    }
  }

  async function toggleNotifications(id: number, current: boolean) {
    const data = await patch(id, "toggle-notifications", {
      email_notifications: !current,
    });
    if (data?.success) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === id ? { ...u, email_notifications: !current } : u
        )
      );
    }
  }

  const isSelf = (id: number) => String(id) === currentAdminId;

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {["User","Role","Verified","Joined","Status","Emails","Actions"].map((h) => (
                <th key={h} className="text-left p-4 font-medium text-gray-500 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50">

                {/* User */}
                <td className="p-4">
                  <p className="font-medium">{u.name || "—"}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                  {isSelf(u.id) && (
                    <span className="text-xs text-blue-500 font-medium">You</span>
                  )}
                </td>

                {/* Role badge */}
                <td className="p-4">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    u.role === "admin" ? "bg-black text-white" : "bg-gray-100 text-gray-600"
                  }`}>
                    {u.role}
                  </span>
                </td>

                {/* Verified */}
                <td className="p-4">
                  {u.email_verified
                    ? <span className="text-green-600 text-xs font-medium">✓ Verified</span>
                    : <span className="text-yellow-600 text-xs font-medium">✗ Pending</span>
                  }
                </td>

                {/* Joined */}
                <td className="p-4 text-gray-500 text-xs whitespace-nowrap">
                  {new Date(u.created_at).toLocaleDateString("en-US", { dateStyle: "medium" })}
                </td>

                {/* Status */}
                <td className="p-4">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    u.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                  }`}>
                    {u.is_active ? "Active" : "Deactivated"}
                  </span>
                </td>

                {/* Email notifications — only relevant for admins */}
                <td className="p-4">
                  {u.role === "admin" ? (
                    <button
                      onClick={() => toggleNotifications(u.id, u.email_notifications)}
                      disabled={!!loading}
                      title={u.email_notifications ? "Notifications ON — click to disable" : "Notifications OFF — click to enable"}
                      className={`text-xs px-2 py-1 rounded-full font-medium transition-colors ${
                        u.email_notifications
                          ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                          : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                      } disabled:opacity-50`}
                    >
                      {loading === `${u.id}-toggle-notifications`
                        ? "..."
                        : u.email_notifications ? "📧 On" : "📧 Off"}
                    </button>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </td>

                {/* Actions */}
                <td className="p-4">
                  <div className="flex gap-2 flex-wrap">
                    {/* Activate / Deactivate */}
                    {!isSelf(u.id) && (
                      <button
                        onClick={() => toggleActive(u.id, u.is_active)}
                        disabled={!!loading}
                        className={`text-xs px-3 py-1.5 rounded border font-medium transition-colors ${
                          u.is_active
                            ? "border-red-300 text-red-600 hover:bg-red-50"
                            : "border-green-300 text-green-600 hover:bg-green-50"
                        } disabled:opacity-50`}
                      >
                        {loading === `${u.id}-toggle-active`
                          ? "..."
                          : u.is_active ? "Deactivate" : "Reactivate"}
                      </button>
                    )}

                    {/* Promote / Demote */}
                    {!isSelf(u.id) && (
                      <button
                        onClick={() => toggleRole(u.id, u.role)}
                        disabled={!!loading}
                        className={`text-xs px-3 py-1.5 rounded border font-medium transition-colors ${
                          u.role === "admin"
                            ? "border-orange-300 text-orange-600 hover:bg-orange-50"
                            : "border-purple-300 text-purple-600 hover:bg-purple-50"
                        } disabled:opacity-50`}
                      >
                        {loading === `${u.id}-set-role`
                          ? "..."
                          : u.role === "admin" ? "Demote" : "Make Admin"}
                      </button>
                    )}

                    {isSelf(u.id) && (
                      <span className="text-xs text-gray-300 italic">No self-actions</span>
                    )}
                  </div>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}