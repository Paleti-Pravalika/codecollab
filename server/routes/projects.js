import express from "express";
import mongoose from "mongoose";
import Project from "../models/Project.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Every route in this file needs a logged-in user
router.use(auth);

// Stops requests with a broken project id
const checkId = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid project id" });
  }
  next();
};

// Get all my projects, with the first lines of code for the dashboard cards
router.get("/", async (req, res) => {
  try {
    const projects = await Project.find({ owner: req.userId })
      .select("name language updatedAt code")
      .sort({ updatedAt: -1 })
      .lean();

    res.json(
      projects.map(({ code, ...rest }) => ({
        ...rest,
        preview: (code || "")
          .split("\n")
          .slice(0, 8)
          .map((line) => line.slice(0, 80)),
      }))
    );
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// Create a project
router.post("/", async (req, res) => {
  try {
    const name = (req.body.name || "").trim() || "Untitled";
    const language = req.body.language === "javascript" ? "javascript" : "python";
    const code = typeof req.body.code === "string" ? req.body.code : "";

    const project = await Project.create({
      name,
      language,
      code,
      owner: req.userId,
    });
    res.status(201).json(project);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// Get one project (anyone logged in who has the link can open it)
router.get("/:id", checkId, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.json(project);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// Save changes (anyone logged in who has the link can edit)
router.put("/:id", checkId, async (req, res) => {
  try {
    const updates = {};
    if (typeof req.body.name === "string" && req.body.name.trim()) {
      updates.name = req.body.name.trim();
    }
    if (["python", "javascript"].includes(req.body.language)) {
      updates.language = req.body.language;
    }
    if (typeof req.body.code === "string") {
      updates.code = req.body.code;
    }

    const project = await Project.findByIdAndUpdate(req.params.id, updates, {
      returnDocument: "after",
    });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.json(project);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// Delete a project (only the owner can do this)
router.delete("/:id", checkId, async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      owner: req.userId,
    });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.json({ message: "Project deleted" });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;