import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";

const starter = 'print("Hello, world!")';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const initial = (user.name || "?").charAt(0).toUpperCase();

  const [projects, setProjects] = useState(null);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

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

  const createProject = async () => {
    setCreating(true);
    setError("");
    try {
      const res = await api.post("/projects", {
        name: "Untitled",
        language: "python",
        code: starter,
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

      <main className="page">
        <div className="page-head">
          <div>
            <h2>Your projects</h2>
            <p>Open a project to keep coding, or start a new one.</p>
          </div>
          <button onClick={createProject} disabled={creating}>
            {creating ? "Creating..." : "New project"}
          </button>
        </div>

        {error && <div className="error" style={{ marginBottom: 16 }}>{error}</div>}

        {projects === null && <p className="sub">Loading your projects...</p>}

        {projects !== null && projects.length === 0 && (
          <div className="empty">
            <h3>No projects yet</h3>
            <p>Create your first project and start writing code in the browser.</p>
            <button onClick={createProject} disabled={creating}>
              Create a project
            </button>
          </div>
        )}

        {projects !== null && projects.length > 0 && (
          <div className="project-grid">
            {projects.map((p) => (
              <div
                key={p._id}
                className="project-card"
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/editor/${p._id}`)}
                onKeyDown={(e) => e.key === "Enter" && navigate(`/editor/${p._id}`)}
              >
                <h3>{p.name}</h3>
                <span className="lang-chip">
                  {p.language === "python" ? "Python" : "JavaScript"}
                </span>
                <p className="sub">
                  Edited {new Date(p.updatedAt).toLocaleDateString()}
                </p>
                <button
                  className="btn-ghost"
                  style={{ alignSelf: "flex-start" }}
                  onClick={(e) => deleteProject(e, p)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}