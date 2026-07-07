import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MessagesTable from "@/components/admin/MessagesTable";

export default async function MessagesPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") redirect("/login");

  const messages = await prisma.contact_messages.findMany({
    orderBy: { created_at: "desc" },
  });

  const serialized = messages.map((m) => ({
    ...m,
    created_at: m.created_at.toISOString(),
  }));

  const unread = messages.filter((m) => !m.is_read).length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Messages</h1>
        <p className="text-sm text-gray-500 mt-1">
          {messages.length} total · {unread} unread
        </p>
      </div>
      <MessagesTable messages={serialized} />
    </div>
  );
}