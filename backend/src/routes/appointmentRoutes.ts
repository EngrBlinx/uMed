import { Router } from "express";
import { prisma } from "../config/database.js";

const router = Router();

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string") {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

router.get("/slots", async (request, response) => {
  const doctorId = typeof request.query.doctorId === "string" ? request.query.doctorId : undefined;
  const from = request.query.from ? parseDate(request.query.from) : null;
  const to = request.query.to ? parseDate(request.query.to) : null;

  if (request.query.from && !from || request.query.to && !to) {
    response.status(400).json({ error: "from and to must be valid ISO dates" });
    return;
  }

  const slots = await prisma.availabilitySlot.findMany({
    where: {
      doctorId,
      startsAt: {
        gte: from ?? undefined,
        lt: to ?? undefined,
      },
      appointment: null,
    },
    orderBy: { startsAt: "asc" },
    include: {
      doctor: {
        select: {
          specialty: true,
          user: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  response.json(slots);
});

router.post("/slots", async (request, response) => {
  const { doctorId, startsAt, endsAt } = request.body as Record<string, unknown>;
  const start = parseDate(startsAt);
  const end = parseDate(endsAt);

  if (typeof doctorId !== "string" || !start || !end || end <= start) {
    response.status(400).json({ error: "doctorId, startsAt, and endsAt are required; endsAt must be later" });
    return;
  }

  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) {
    response.status(404).json({ error: "Doctor not found" });
    return;
  }

  const slot = await prisma.availabilitySlot.create({
    data: { doctorId, startsAt: start, endsAt: end },
  });

  response.status(201).json(slot);
});

router.post("/appointments", async (request, response) => {
  const { patientId, availabilitySlotId, reason } = request.body as Record<string, unknown>;

  if (typeof patientId !== "string" || typeof availabilitySlotId !== "string") {
    response.status(400).json({ error: "patientId and availabilitySlotId are required" });
    return;
  }

  const [patient, slot] = await Promise.all([
    prisma.patient.findUnique({ where: { id: patientId } }),
    prisma.availabilitySlot.findUnique({ where: { id: availabilitySlotId } }),
  ]);

  if (!patient) {
    response.status(404).json({ error: "Patient not found" });
    return;
  }

  if (!slot) {
    response.status(404).json({ error: "Availability slot not found" });
    return;
  }

  try {
    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId: slot.doctorId,
        availabilitySlotId,
        reason: typeof reason === "string" ? reason : undefined,
      },
      include: { doctor: true, availabilitySlot: true },
    });

    response.status(201).json(appointment);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "P2002") {
      response.status(409).json({ error: "This availability slot has already been booked" });
      return;
    }

    response.status(500).json({ error: "Unable to create appointment" });
  }
});

router.get("/patients/:patientId/appointments", async (request, response) => {
  const appointments = await prisma.appointment.findMany({
    where: { patientId: request.params.patientId },
    include: {
      doctor: {
        select: {
          specialty: true,
          user: { select: { firstName: true, lastName: true } },
        },
      },
      availabilitySlot: true,
    },
    orderBy: { availabilitySlot: { startsAt: "asc" } },
  });

  response.json(appointments);
});

export default router;