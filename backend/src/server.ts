import cors from "cors";
import "dotenv/config";
import express from "express";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(express.json());
app.use("/api", appointmentRoutes);
app.use("/api/auth", authRoutes);

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok", service: "umed-api" });
});

app.listen(port, () => {
  console.log(`uMed API listening on http://localhost:${port}`);
});