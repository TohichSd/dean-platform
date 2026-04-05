import { Link, useLocation } from "wouter-preact";
import { useAuth } from "../../auth/auth-context";

const items = [
  { href: "/student/today", label: "Экзамены сегодня" },
  { href: "/student/assessments", label: "Мои экзамены" },
  { href: "/student/statistics", label: "Моя статистика" },
];

export function StudentLayout({ children }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__title">Панель студента</div>

        <div className="sidebar__user">
          <div className="sidebar__user-login">{user?.login}</div>
          <div className="sidebar__user-role">Студент</div>
        </div>

        <nav className="sidebar__nav">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                location === item.href
                  ? "sidebar__link sidebar__link--active"
                  : "sidebar__link"
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button className="secondary-button sidebar__logout" onClick={logout}>
          Выйти
        </button>
      </aside>

      <main className="app-content">{children}</main>
    </div>
  );
}