import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";
import "./Dashboard.css";

const starters = {
  python: 'print("Hello, world!")',
  javascript: 'console.log("Hello, world!");',
};

const langNames = { python: "Python", javascript: "JavaScript" };

const filters = [
  { key: "all", label: "All" },
  { key: "python", label: "Python" },
  { key: "javascript", label: "JavaScript" },
];

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(date).toLocaleDateString();
}

export default function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const initial = (user.name || "?").charAt(0).toUpperCase();

  const [projects, setProjects] = useState(null);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  useEffect(() => {
    api
      .get("/projects")
      .then((res) => setProjects(res.data))
      .catch((err) => {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
          return;
        }
        setError("Could not load your projects. Is the server running?");
        setProjects([]);
      });
  }, [navigate]);

  const createProject = async (language) => {
    setCreating(true);
    setError("");
    try {
      const res = await api.post("/projects", {
        name: "Untitled",
        language,
        code: starters[language],
      });
      navigate(`/editor/${res.data._id}`);
    } catch {
      setError("Could not create the project. Please try again.");
      setCreating(false);
    }
  };

  const deleteProject = async (e, project) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/projects/${project._id}`);
      setProjects((list) => list.filter((p) => p._id !== project._id));
    } catch {
      setError("Could not delete the project. Please try again.");
    }
  };

  const visible = useMemo(() => {
    if (!projects) return [];
    const q = search.trim().toLowerCase();
    return projects.filter(
      (p) =>
        (filter === "all" || p.language === filter) &&
        p.name.toLowerCase().includes(q)
    );
  }, [projects, search, filter]);

  const count = projects ? projects.length : 0;

  let summary = "Loading your projects...";
  if (projects !== null && count === 0) {
    summary = "Pick a language on the right to start your first project.";
  } else if (projects !== null) {
    summary = `${count} project${count === 1 ? "" : "s"}. Last edited ${timeAgo(projects[0].updatedAt)}.`;
  }

  return (
    <div>
      <header className="topbar">
        <h3>CodeCollab</h3>
        <div className="who">
          <div className="avatar">{initial}</div>
          <span>{user.name}</span>
          <button className="btn-ghost" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      <main className="db-page">
        <section className="db-hero">
          <div>
            <h1>Your workspace</h1>
            <p>{summary}</p>
          </div>
          <div>
            <div className="db-start-label">Start a new project</div>
            <div className="db-start">
              <button
                className="db-tile"
                onClick={() => createProject("python")}
                disabled={creating}
              >
                <strong>Python</strong>
                <small>main.py</small>
              </button>
              <button
                className="db-tile"
                onClick={() => createProject("javascript")}
                disabled={creating}
              >
                <strong>JavaScript</strong>
                <small>main.js</small>
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div className="error" style={{ marginTop: 16 }}>
            {error}
          </div>
        )}

        {projects !== null && count > 0 && (
          <>
            <div className="db-toolbar">
              <h2>Your projects</h2>
              <div className="db-controls">
                <input
                  className="db-search"
                  placeholder="Search projects"
                  aria-label="Search projects"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div className="db-filters">
                  {filters.map((f) => (
                    <button
                      key={f.key}
                      className={`db-chip${filter === f.key ? " active" : ""}`}
                      onClick={() => setFilter(f.key)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {visible.length === 0 ? (
              <div className="db-empty">
                <h3>No projects match</h3>
                <p>Try a different search or filter.</p>
              </div>
            ) : (
              <div className="db-grid">
                {visible.map((p) => (
                  <div
                    key={p._id}
                    className={`db-card db-${p.language}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/editor/${p._id}`)}
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      e.target === e.currentTarget &&
                      navigate(`/editor/${p._id}`)
                    }
                  >
                    <div className="db-code">
                      {p.preview && p.preview.some((l) => l.trim()) ? (
                        p.preview.map((line, i) => (
                          <div className="db-code-line" key={i}>
                            <span className="db-code-num">{i + 1}</span>
                            <span className="db-code-text">{line}</span>
                          </div>
                        ))
                      ) : (
                        <div className="db-code-empty">No code yet</div>
                      )}
                    </div>
                    <div className="db-meta">
                      <div className="db-name">{p.name}</div>
                      <div className="db-sub">Edited {timeAgo(p.updatedAt)}</div>
                    </div>
                    <div className="db-foot">
                      <span className="db-lang">
                        <span className="db-dot"></span>
                        {langNames[p.language] || p.language}
                      </span>
                      <button
                        className="btn-ghost db-delete"
                        onClick={(e) => deleteProject(e, p)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {projects !== null && count === 0 && (
          <div className="db-empty">
            <h3>No projects yet</h3>
            <p>Choose Python or JavaScript above and start writing code in the browser.</p>
          </div>
        )}
      </main>
    </div>
  );
}