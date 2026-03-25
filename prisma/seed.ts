import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash(
    process.env.ADMIN_PASSWORD || "admin123",
    12
  );

  const admin = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || "coach@tudominio.com" },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || "coach@tudominio.com",
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
