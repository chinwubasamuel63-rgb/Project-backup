import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import * as authService from "../services/authService";

export default function OAuthSuccess() {
  const navigate = useNavigate();
  const { setAuthData } = useAuth();

  useEffect(() => {
    let mounted = true;

    const completeOAuthLogin = async () => {
      try {
        /*
         * The refresh token is httpOnly.
         * Axios sends it automatically through /api.
         */
        await authService.refreshToken();

        const userRes = await authService.getCurrentUser();

        const user = userRes.data.user;

        if (!mounted) return;

        setAuthData(user);

        const role =
          typeof user.role === "string" ? user.role.toLowerCase() : user.role;

        switch (role) {
          case "admin":
            navigate("/admin", { replace: true });
            break;

          case "instructor":
            navigate("/instructor", { replace: true });
            break;

          default:
            navigate("/dashboard", { replace: true });
            break;
        }
      } catch (error) {
        console.error("OAuth authentication failed:", error);

        if (mounted) {
          navigate("/login", { replace: true });
        }
      }
    };

    completeOAuthLogin();

    return () => {
      mounted = false;
    };
  }, [navigate, setAuthData]);

  return (
    <div className="oauth-success-page">
      <div className="oauth-success-card">
        <h2>Completing sign in...</h2>
        <p>Please wait while we finish authentication.</p>
      </div>
    </div>
  );
}
