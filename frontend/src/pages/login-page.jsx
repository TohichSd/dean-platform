import { useState } from "preact/hooks";
import { useLocation } from "wouter-preact";
import { useAuth } from "../auth/auth-context";

export function LoginPage() {
  const [, navigate] = useLocation();
  const { login, getDefaultRouteByRole } = useAuth();

  const [form, setForm] = useState({
    login: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const me = await login(form.login, form.password);
      navigate(getDefaultRouteByRole(me.role_name));
    } catch (err) {
      setError(err.message || "Ошибка входа");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Вход в систему</h1>
        <p>Введите логин и пароль</p>

        <input
          className="text-input"
          placeholder="Логин"
          value={form.login}
          onInput={(e) => setForm({ ...form, login: e.target.value })}
        />

        <input
          className="text-input"
          type="password"
          placeholder="Пароль"
          value={form.password}
          onInput={(e) => setForm({ ...form, password: e.target.value })}
        />

        {error && <div className="error-box">{error}</div>}

        <button className="primary-button auth-button" disabled={loading}>
          {loading ? "Вход..." : "Войти"}
        </button>
      </form>
    </div>
  );
}