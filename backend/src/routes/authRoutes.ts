import bcrypt from "bcryptjs";
import { Router } from "express";
import { prisma } from "../config/database.js";

const router = Router();

router.post("/sign-up", async (request, response) => {
  const { firstName, lastName, email, password } = request.body as Record<string, unknown>;

  if ([firstName, lastName, email, password].some((value) => typeof value !== "string" || !value.trim())) {
    response.status(400).json({ error: "First name, last name, email, and password are required" });
    return;
  }

  if (!String(email).includes("@") || String(password).length < 8) {
    response.status(400).json({ error: "Use a valid email and a password with at least 8 characters" });
    return;
  }

  try {
    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = await prisma.user.create({
      data: {
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        email: String(email).trim().toLowerCase(),
        passwordHash,
        role: "PATIENT",
        patient: { create: {} },
      },
      include: { patient: true },
    });

    response.status(201).json({ message: "Account created", email: user.email });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "P2002") {
      response.status(409).json({ error: "An account with that email already exists" });
      return;
    }

    response.status(500).json({ error: "Unable to create account" });
  }
});

router.post("/sign-in", async (request, response) => {
  const { email, password } = request.body as Record<string, unknown>;

  if (typeof email !== "string" || typeof password !== "string") {
    response.status(400).json({ error: "Email and password are required" });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    include: { patient: true, doctor: true },
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    response.status(401).json({ error: "Invalid email or password" });
    return;
  }

  response.json({
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    },
    patientId: user.patient?.id ?? null,
    doctorId: user.doctor?.id ?? null,
  });
});

export default router;