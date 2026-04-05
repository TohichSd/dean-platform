import { render } from "preact";
import { App } from "./app";
import { AuthProvider } from "./auth/auth-context";
import "./styles.css";

render(
  <AuthProvider>
    <App />
  </AuthProvider>,
  document.getElementById("app")
);