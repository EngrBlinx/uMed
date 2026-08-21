import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const developmentPasswordHash = await bcrypt.hash("development-only-password", 10);
  const doctorUser = await prisma.user.upsert({
    where: { email: "doctor@umed.local" },
    update: { passwordHash: developmentPasswordHash },
    create: {
      email: "doctor@umed.local",
      passwordHash: developmentPasswordHash,
      firstName: "Maya",
      lastName: "Okafor",
      role: "DOCTOR",
    },
  });

  const doctor = await prisma.doctor.upsert({
    where: { userId: doctorUser.id },
    update: {},
    create: {
      userId: doctorUser.id,
      specialty: "General practice",
      bio: "Thoughtful primary care for every stage of life.",
    },
  });

  const patientUser = await prisma.user.upsert({
    where: { email: "patient@umed.local" },
    update: { passwordHash: developmentPasswordHash },
    create: {
      email: "patient@umed.local",
      passwordHash: developmentPasswordHash,
      firstName: "Amina",
      lastName: "Mensah",
      role: "PATIENT",
    },
  });

  const patient = await prisma.patient.upsert({
    where: { userId: patientUser.id },
    update: {},
    create: { userId: patientUser.id },
  });

  const now = new Date();
  const slots = Array.from({ length: 6 }, (_, index) => {
    const startsAt = new Date(now);
    startsAt.setDate(now.getDate() + Math.floor(index / 2) + 1);
    startsAt.setHours(9 + (index % 2) * 2, 0, 0, 0);
    const endsAt = new Date(startsAt);
    endsAt.setMinutes(30);
    return { doctorId: doctor.id, startsAt, endsAt };
  });

  await prisma.availabilitySlot.createMany({ data: slots, skipDuplicates: true });

  console.log(`Seeded doctor ${doctor.id}`);
  console.log(`Seeded patient ${patient.id}`);
  console.log(`Added ${slots.length} availability slots`);
  console.log(`Use this patient ID to test booking: ${patient.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });