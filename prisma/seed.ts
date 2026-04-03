import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_EMAIL) {
    console.log("ADMIN_PASSWORD/ADMIN_EMAIL not set, skipping seed (admin already exists).");
    return;
  }

  const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);

  const admin = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL,
      password: hashedPassword,
      name: "Coach",
      role: "admin",
    },
  });

  console.log("Admin creado:", admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
