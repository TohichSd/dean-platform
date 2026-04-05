import { Link, useLocation } from "wouter-preact";
import { useAuth } from "../../auth/auth-context";

const items = [
  { href: "/dean/students", label: "Студенты" },
  { href: "/dean/teachers", label: "Преподаватели" },
  { href: "/dean/groups", label: "Группы" },
  { href: "/dean/departments", label: "Кафедры" },
  { href: "/dean/exams", label: "Экзамены" },
  { href: "/dean/group-statistics", label: "Статистика групп" },
];

export function DeanLayout({ children }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__title">Панель деканата</div>

        <div className="sidebar__user">
          <div className="sidebar__user-login">{user?.login}</div>
          <div className="sidebar__user-role">Деканат</div>
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