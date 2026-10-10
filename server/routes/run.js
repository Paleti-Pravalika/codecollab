import express from "express";
import auth from "../middleware/auth.js";

const router = express.Router();

const LANGUAGE_IDS = { python: 71, javascript: 63 };
const JUDGE0_URL = process.env.JUDGE0_URL || "https://ce.judge0.com";

router.post("/", auth, async (req, res) => {
  const { code, language } = req.body;

  if (typeof code !== "string" || !code.trim()) {
    return res.status(400).json({ message: "Write some code first." });
  }
  if (code.length > 20000) {
    return res
      .status(400)
      .json({ message: "Code is too long (max 20,000 characters)." });
  }
  const languageId = LANGUAGE_IDS[language];
  if (!languageId) {
    return res.status(400).json({ message: "Unsupported language." });
  }

  try {
    const response = await fetch(
      `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true&fields=stdout,stderr,compile_output,message,status,time`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_code: code, language_id: languageId }),
        signal: AbortSignal.timeout(20000),
      }
    );

    if (!response.ok) {
      return res
        .status(502)
        .json({ message: "The code runner is busy. Try again in a moment." });
    }

    const result = await response.json();
    res.json({
      stdout: result.stdout || "",
      stderr: result.stderr || "",
      compileOutput: result.compile_output || "",
      message: result.message || "",
      status: result.status?.description || "",
      time: result.time,
    });
  } catch {
    res.status(502).json({ message: "Could not reach the code runner." });
  }
});

export default router;