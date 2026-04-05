import { Redirect } from "wouter-preact";
import { useAuth } from "../../auth/auth-context";

export function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isReady, isAuthenticated, user } = useAuth();

  if (!isReady) {
    return <div className="page-loader">Загрузка...</div>;
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(user?.role_name)
  ) {
    return <Redirect to={getDefaultRouteByRole(user?.role_name)} />;
  }

  return children;
}

function getDefaultRouteByRole(roleName) {
  switch (roleName) {
    case "admin":
      return "/admin/users";
    case "dean":
      return "/dean/students";
    case "teacher":
      return "/teacher/assessments";
    case "student":
      return "/student/assessments";
    default:
      return "/login";
  }
}