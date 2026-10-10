import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import authRoutes from "./routes/auth.js";
import projectRoutes from "./routes/projects.js";
import runRoutes from "./routes/run.js";
import Project from "./models/Project.js";
import User from "./models/User.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("API is running"));
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/run", runRoutes);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Only logged-in users can connect
io.use(async (socket, next) => {
  try {
    const decoded = jwt.verify(
      socket.handshake.auth.token,
      process.env.JWT_SECRET
    );
    const user = await User.findById(decoded.id).select("name");
    if (!user) return next(new Error("Unauthorized"));
    socket.data.userId = String(user._id);
    socket.data.name = user.name;
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
});

// Changes waiting to be saved, and the timers that save them
const pending = new Map();
const timers = new Map();

function scheduleSave(projectId, changes) {
  pending.set(projectId, { ...(pending.get(projectId) || {}), ...changes });
  clearTimeout(timers.get(projectId));
  timers.set(
    projectId,
    setTimeout(async () => {
      const data = pending.get(projectId);
      pending.delete(projectId);
      timers.delete(projectId);
      try {
        await Project.findByIdAndUpdate(projectId, data);
        io.to(`project:${projectId}`).emit("saved");
      } catch (err) {
        console.error("Auto-save failed:", err.message);
      }
    }, 2000)
  );
}

// Tell everyone in the room who is online
async function sendPresence(projectId) {
  try {
    const room = `project:${projectId}`;
    const sockets = await io.in(room).fetchSockets();
    const people = new Map();
    sockets.forEach((s) => people.set(s.data.userId, s.data.name));
    io.to(room).emit(
      "presence",
      [...people].map(([id, name]) => ({ id, name }))
    );
  } catch (err) {
    console.error("Presence error:", err.message);
  }
}

io.on("connection", (socket) => {
  socket.on("join-project", async (projectId) => {
    try {
      if (!mongoose.isValidObjectId(projectId)) return;
      if (!(await Project.exists({ _id: projectId }))) return;

      socket.data.projectId = projectId;
      socket.join(`project:${projectId}`);

      // Send changes that are not saved yet to the person who just joined
      const waiting = pending.get(projectId);
      if (waiting?.code !== undefined) {
        socket.emit("code-change", { code: waiting.code });
      }
      if (waiting?.language) {
        socket.emit("language-change", { language: waiting.language });
      }

      await sendPresence(projectId);
    } catch (err) {
      console.error("Join error:", err.message);
    }
  });

  socket.on("code-change", (payload) => {
    const projectId = socket.data.projectId;
    const code = payload?.code;
    if (!projectId || typeof code !== "string" || code.length > 100000) return;
    socket.to(`project:${projectId}`).emit("code-change", { code });
    scheduleSave(projectId, { code });
  });

  socket.on("language-change", (payload) => {
    const projectId = socket.data.projectId;
    const language = payload?.language;
    if (!projectId || !["python", "javascript"].includes(language)) return;
    socket.to(`project:${projectId}`).emit("language-change", { language });
    scheduleSave(projectId, { language });
  });

  socket.on("disconnect", () => {
    const projectId = socket.data.projectId;
    if (projectId) sendPresence(projectId);
  });
});

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error("DB connection error:", err.message));