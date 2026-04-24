const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const readline = require("readline");

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function main() {
  console.log("\n=== Dalis Studio — Admin Setup ===\n");

  const email = await ask("Admin email: ");
  const password = await ask("New password: ");
  const name = await ask("Display name (optional): ");

  const hashed = await bcrypt.hash(password.trim(), 12);

  const user = await prisma.users.upsert({
    where: { email: email.trim().toLowerCase() },
    update: {
      password_hash: hashed,
      role: "admin",
      is_active: true,
      email_verified: true,
    },
    create: {
      email: email.trim().toLowerCase(),
      name: name.trim() || null,
      password_hash: hashed,
      role: "admin",
      is_active: true,
      email_verified: true,
    },
  });

  console.log(`\n✓ Admin account ready: ${user.email} (id: ${user.id})\n`);

  rl.close();
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

// Run node scripts/set-admin.js in the terminal
// admin email: topallage@gmail.com
// Password: Admin123_