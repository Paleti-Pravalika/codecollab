import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api.js";

export default function Signup() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
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
      const res = await api.post("/auth/register", form);
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
          <h1>Create your account</h1>
          <p className="sub">Start a project and invite others to code with you.</p>

          <label className="field">
            Name
            <input
              name="name"
              autoComplete="name"
              placeholder="Your name"
              value={form.name}
              onChange={handleChange}
            />
          </label>

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

          <label className="field">
            Password
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 6 characters"
              value={form.password}
              onChange={handleChange}
            />
          </label>

          {error && <div className="error">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Sign up"}
          </button>

          <p className="switch">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </form>
      </main>
    </div>
  );
}