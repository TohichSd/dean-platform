import { Link, useLocation } from "wouter-preact";
import { useAuth } from "../../auth/auth-context";

const items = [
  { href: "/teacher/today", label: "Расписание на сегодня" },
  { href: "/teacher/assessments", label: "Мои аттестации" },
];

export function TeacherLayout({ children }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__title">Панель преподавателя</div>

        <div className="sidebar__user">
          <div className="sidebar__user-login">{user?.login}</div>
          <div className="sidebar__user-role">Преподаватель</div>
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