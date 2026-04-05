import { createContext } from "preact";
import { useContext, useEffect, useState } from "preact/hooks";
import { clearToken, fetchMe, getToken, login as loginRequest } from "./auth";

const AuthContext = createContext(null);

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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const token = getToken();

    if (!token) {
      setIsReady(true);
      return;
    }

    fetchMe()
      .then((me) => setUser(me))
      .catch(() => {
        clearToken();
        setUser(null);
      })
      .finally(() => setIsReady(true));
  }, []);

  async function login(loginValue, password) {
    await loginRequest(loginValue, password);
    const me = await fetchMe();
    setUser(me);
    return me;
  }

  function logout() {
    clearToken();
    setUser(null);
    window.location.href = "/login";
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isReady,
        isAuthenticated: !!user,
        login,
        logout,
        getDefaultRouteByRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}