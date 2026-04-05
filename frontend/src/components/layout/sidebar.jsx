import { Link, useLocation } from "wouter-preact";
import { useAuth } from "../../auth/auth-context";

const items = [
  { href: "/admin/users", label: "Пользователи" },
  { href: "/admin/departments", label: "Кафедры" },
  { href: "/admin/groups", label: "Группы" },
  { href: "/admin/subjects", label: "Предметы" },
  { href: "/admin/exams", label: "Экзамены" },
  { href: "/admin/group-statistics", label: "Статистика групп" },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar__title">Панель администратора</div>

      <div className="sidebar__user">
        <div className="sidebar__user-login">{user?.login}</div>
        <div className="sidebar__user-role">Администратор</div>
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
  );
}