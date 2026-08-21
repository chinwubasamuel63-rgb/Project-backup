import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import * as authService from "../services/authService";

export default function OAuthSuccess() {
  const navigate = useNavigate();

  const { setAuthData } = useAuth();

  useEffect(() => {
    const completeOAuthLogin = async () => {
      try {
        const refreshRes = await authService.refreshToken();

        const accessToken = refreshRes.data.accessToken;

        const userRes = await authService.getCurrentUser();

        const user = userRes.data.user;

        setAuthData(user, accessToken);

        switch (user.role) {
          case "admin":
            navigate("/admin", {
              replace: true,
            });
            break;

          case "instructor":
            navigate("/instructor", {
              replace: true,
            });
            break;

          default:
            navigate("/dashboard", {
              replace: true,
            });
        }
      } catch (error) {
        console.error(error);

        navigate("/login", {
          replace: true,
        });
      }
    };

    completeOAuthLogin();
  }, [navigate, setAuthData]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
      }}
    >
      Completing sign in...
    </div>
  );
}
