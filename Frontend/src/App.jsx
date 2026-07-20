import { useAuth } from "./hooks/useAuth";

import AppRoutes from "./routes/AppRoutes";

import { globalStyles } from "./styles/global";
import { appShellStyles } from "./styles/appShell";
import { experienceStyles } from "./styles/experience";
import { chatStyles } from "./styles/chat";
import { authStyles } from "./styles/auth";

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <>
        <style>{globalStyles}</style>

        <div
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
          }}
        >
          Loading...
        </div>
      </>
    );
  }

  return (
    <>
      <style>{globalStyles}</style>
      <style>{appShellStyles}</style>
      <style>{experienceStyles}</style>
      <style>{chatStyles}</style>
      <style>{authStyles}</style>

      <AppRoutes />
    </>
  );
}
