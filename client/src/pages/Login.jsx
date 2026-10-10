import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api.js";

const toggleStyle = {
  position: "absolute",
  top: "50%",
  right: 8,
  transform: "translateY(-50%)",
  margin: 0,
  padding: 6,
  display: "grid",
  placeItems: "center",
  background: "transparent",
  color: "#667085",
  border: "none",
  borderRadius: 6,
};

function EyeIcon({ off }) {
  const props = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };
  return off ? (
    <svg {...props}>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg {...props}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", form);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <aside className="auth-art">
        <div className="brand">CodeCollab</div>

        <div className="code-demo">
          <div className="code-line">
            <span className="ln">1</span>
            <span className="kw">{"def "}</span>
            <span className="fn">greet</span>
            {"(name):"}
          </div>
          <div className="code-line">
            <span className="ln">2</span>
            {"    message = "}
            <span className="str">{'"Hello, "'}</span>
            {" + name"}
            <span className="cursor a" data-name="Asha"></span>
          </div>
          <div className="code-line">
            <span className="ln">3</span>
            {"    "}
            <span className="kw">{"return "}</span>
            {"message"}
          </div>
          <div className="code-line">
            <span className="ln">4</span>
          </div>
          <div className="code-line">
            <span className="ln">5</span>
            <span className="fn">print</span>
            {"(greet("}
            <span className="str">{'"team"'}</span>
            {"))"}
            <span className="cursor b" data-name="Ravi"></span>
          </div>
        </div>

        <p className="auth-tagline">
          Write code together, in the same file, at the same time.
        </p>
      </aside>

      <main className="auth-form-wrap">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h1>Welcome back</h1>
          <p className="sub">Log in to open your projects.</p>

          <label className="field">
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
            />
          </label>

          <div className="field">
            <label htmlFor="login-password">Password</label>
            <div style={{ position: "relative" }}>
              <input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Your password"
                value={form.password}
                onChange={handleChange}
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
                style={toggleStyle}
              >
                <EyeIcon off={showPassword} />
              </button>
            </div>
          </div>

          {error && <div className="error">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Log in"}
          </button>

          <p className="switch">
            New to CodeCollab? <Link to="/signup">Create an account</Link>
          </p>
        </form>
      </main>
    </div>
  );
}