import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import { Server } from "socket.io";

import connectDB, { getMongoUri } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import donorRoutes from "./routes/donor.js";
import emailRoutes from "./routes/email.js";
import hospitalRoutes from "./routes/hospital.js";
import hospitalStatsRoutes from "./routes/hospitalStats.js";
import requestRoutes from "./routes/request.js";
import scheduleRoutes from "./routes/schedule.js";
import { initializeDonationScheduler } from "./utils/scheduler.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

const defaultFrontendOrigins = [
  "https://pulselife.netlify.app",
  "https://pulselife-dev.netlify.app",
  "http://localhost:3000",
  "http://localhost:3001",
];

function parseOriginList(value) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const configuredFrontendOrigins = [
  ...parseOriginList(process.env.FRONTEND_URL),
  ...parseOriginList(process.env.FRONTEND_URLS),
];

const allowedOrigins = [
  ...new Set([...defaultFrontendOrigins, ...configuredFrontendOrigins]),
];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("register", (userId) => {
    socket.join(userId);
    console.log(`User joined room: ${userId}`);
  });

  socket.on("new_request", (payload) => {
    console.log("New urgent request:", payload);
    io.emit("urgent_request", payload);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

app.locals.io = io;

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ success: true, status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/donor", donorRoutes(io));
app.use("/request", requestRoutes);
app.use("/schedule", scheduleRoutes);
app.use("/hospital", hospitalRoutes);
app.use("/hospital", hospitalStatsRoutes);
app.use("/email", emailRoutes);

app.use((err, _req, res, _next) => {
  console.error("API error:", err.message);
  res.status(500).json({ success: false, message: err.message });
});

app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

const mongoUri = getMongoUri();

connectDB(mongoUri)
  .then(() => {
    initializeDonationScheduler(io);

    const port = process.env.PORT || 5000;
    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });
