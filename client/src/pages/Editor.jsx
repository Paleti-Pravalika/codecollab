import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MonacoEditor from "@monaco-editor/react";
import { io } from "socket.io-client";
import api from "../api.js";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

const starters = {
  python: 'print("Hello, world!")',
  javascript: 'console.log("Hello, world!");',
};

const statusText = {
  saved: "All changes saved",
  unsaved: "Saving soon...",
  saving: "Saving...",
  error: "Could not save. Try again.",
};

const errorColor = "#ff8a9b";
const personColors = ["#ff6b57", "#12a594", "#6366f1", "#d97706"];

export default function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const me = JSON.parse(localStorage.getItem("user") || "{}");

  const [name, setName] = useState("");
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("saved");
  const [loadError, setLoadError] = useState("");
  const [output, setOutput] = useState(null);
  const [running, setRunning] = useState(false);
  const [people, setPeople] = useState([]);
  const [connected, setConnected] = useState(false);
  const [copied, setCopied] = useState(false);

  const socketRef = useRef(null);
  const codeRef = useRef("");

  // Load the project
  useEffect(() => {
    api
      .get(`/projects/${id}`)
      .then((res) => {
        codeRef.current = res.data.code;
        setName(res.data.name);
        setLanguage(res.data.language);
        setCode(res.data.code);
        setLoading(false);
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
          return;
        }
        setLoadError(
          err.response?.status === 404 || err.response?.status === 400
            ? "This project does not exist."
            : "Could not load the project. Is the server running?"
        );
        setLoading(false);
      });
  }, [id, navigate]);

  // Live connection
  useEffect(() => {
    if (loading || loadError) return;

    const socket = io(SOCKET_URL, {
      auth: { token: localStorage.getItem("token") },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join-project", id);
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", (err) => {
      if (err.message === "Unauthorized") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      }
    });
    socket.on("code-change", ({ code: next }) => {
      codeRef.current = next;
      setCode(next);
      setStatus("unsaved");
    });
    socket.on("language-change", ({ language: next }) => {
      setLanguage(next);
    });
    socket.on("presence", (list) => setPeople(list));
    socket.on("saved", () => setStatus("saved"));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [id, loading, loadError, navigate]);

  const send = (event, payload) => {
    if (socketRef.current?.connected) socketRef.current.emit(event, payload);
  };

  const save = async () => {
    setStatus("saving");
    try {
      await api.put(`/projects/${id}`, { name, language, code });
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  };

  const run = async () => {
    if (running) return;
    setRunning(true);
    setOutput(null);
    try {
      const res = await api.post("/run", { code, language });
      setOutput(res.data);
    } catch (err) {
      setOutput({
        error:
          err.response?.data?.message ||
          "Could not run the code. Is the server running?",
      });
    } finally {
      setRunning(false);
    }
  };

  const share = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link and send it to your teammate:", url);
    }
  };

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        run();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const changeLanguage = (e) => {
    const next = e.target.value;
    if (codeRef.current === starters[language]) {
      codeRef.current = starters[next];
      setCode(starters[next]);
      send("code-change", { code: starters[next] });
    }
    setLanguage(next);
    setStatus("unsaved");
    send("language-change", { language: next });
  };

  const changeCode = (value) => {
    const next = value || "";
    if (next === codeRef.current) return;
    codeRef.current = next;
    setCode(next);
    setStatus("unsaved");
    send("code-change", { code: next });
  };

  const changeName = (e) => {
    setName(e.target.value);
    setStatus("unsaved");
  };

  if (loading) {
    return (
      <div className="editor-shell">
        <p className="output-title" style={{ padding: 24 }}>Loading project...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="editor-shell">
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, alignItems: "flex-start" }}>
          <p style={{ color: "#fff" }}>{loadError}</p>
          <button onClick={() => navigate("/")}>Back to projects</button>
        </div>
      </div>
    );
  }

  const hasText =
    output && (output.stdout || output.stderr || output.compileOutput || output.message);

  let title = "Output";
  if (running) title = "Running...";
  else if (output?.status) {
    title = output.time ? `${output.status} in ${output.time}s` : output.status;
  }

  return (
    <div className="editor-shell">
      <header className="editor-bar" style={{ flexWrap: "wrap" }}>
        <button className="btn-ghost" onClick={() => navigate("/")}>
          Back to projects
        </button>
        <input
          value={name}
          onChange={changeName}
          onBlur={save}
          aria-label="Project name"
          style={{
            width: 220,
            background: "transparent",
            color: "#fff",
            borderColor: "rgba(255,255,255,0.18)",
          }}
        />
        <span className="file">
          {connected ? statusText[status] : "Reconnecting..."}
        </span>

        <div style={{ display: "flex", alignItems: "center" }}>
          {people.slice(0, 4).map((p, i) => (
            <div
              key={p.id}
              className="avatar"
              title={p.id === me.id ? `${p.name} (you)` : p.name}
              style={{
                background: personColors[i % personColors.length],
                marginLeft: i === 0 ? 0 : -8,
                border: "2px solid #15171f",
              }}
            >
              {p.name.charAt(0).toUpperCase()}
            </div>
          ))}
          {people.length > 4 && (
            <span style={{ marginLeft: 8, fontSize: 13 }}>+{people.length - 4}</span>
          )}
        </div>

        <select value={language} onChange={changeLanguage}>
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
        </select>
        <button className="btn-ghost" onClick={share}>
          {copied ? "Link copied" : "Share"}
        </button>
        <button
          onClick={run}
          disabled={running}
          style={{ background: "#12a594", borderColor: "#12a594" }}
        >
          {running ? "Running..." : "Run"}
        </button>
        <button
          onClick={save}
          disabled={status === "saving"}
          style={{ background: "#fff", color: "#15171f", borderColor: "#fff" }}
        >
          Save
        </button>
      </header>

      <div className="editor-body">
        <MonacoEditor
          height="100%"
          theme="vs-dark"
          language={language}
          value={code}
          onChange={changeCode}
          options={{
            fontSize: 15,
            fontFamily: "'JetBrains Mono', Consolas, monospace",
            minimap: { enabled: false },
            padding: { top: 16 },
            scrollBeyondLastLine: false,
          }}
        />
      </div>

      <section className="output">
        <div className="output-title">{title}</div>

        {!output && !running && (
          <pre>Click Run (or press Ctrl + Enter) to see your program's output here.</pre>
        )}

        {output?.error && <pre style={{ color: errorColor }}>{output.error}</pre>}

        {output && !output.error && (
          <>
            {output.stdout && <pre>{output.stdout}</pre>}
            {output.compileOutput && (
              <pre style={{ color: errorColor }}>{output.compileOutput}</pre>
            )}
            {output.stderr && <pre style={{ color: errorColor }}>{output.stderr}</pre>}
            {output.message && <pre style={{ color: errorColor }}>{output.message}</pre>}
            {!hasText && <pre>The program finished with no output.</pre>}
          </>
        )}
      </section>
    </div>
  );
}