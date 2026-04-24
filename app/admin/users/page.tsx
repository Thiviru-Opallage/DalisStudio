import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import UsersTable from "@/components/admin/UsersTable";

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") redirect("/login");

  const users = await prisma.users.findMany({
    orderBy: { created_at: "desc" },
    select: {
      id: true, name: true, email: true, role: true,
      is_active: true, email_verified: true,
      email_notifications: true, created_at: true,
    },
  });

  const serialized = users.map((u) => ({
    ...u,
    created_at: u.created_at.toISOString(),
  }));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <p className="text-sm text-gray-500 mt-1">
          {users.length} total user{users.length !== 1 ? "s" : ""}
        </p>
      </div>
      <UsersTable users={serialized} currentAdminId={session.user.id} />
    </div>
  );
}