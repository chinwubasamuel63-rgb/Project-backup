import { useState } from "react";
import { Icon } from "./Icon";
import { useAuth } from "../../hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";

export function LoginPanel() {
  const { login, register } = useAuth();
  const [tab, setTab] = useState("login");
  const [showPw, setShowPw] = useState(false);
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });
  const [registerData, setRegisterData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      const user = await login(loginData.email, loginData.password);

      if (user.role === "admin") {
        navigate("/admin");
      } else if (user.role === "instructor") {
        navigate("/instructor");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  const handleGithubLogin = () => {
    window.location.href = `${API_URL}/auth/github`;
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      const user = await register({
        username: registerData.username,
        email: registerData.email,
        password: registerData.password,
      });

      if (user.role === "admin") {
        navigate("/admin");
      } else if (user.role === "instructor") {
        navigate("/instructor");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="tablet-wrap">
      <div className="tablet-bezel">
        <div className="tablet-screen">
          <div className="login-tabs">
            <button
              className={`login-tab ${tab === "login" ? "active" : ""}`}
              onClick={() => {
                setTab("login");
                setError("");
              }}
              type="button"
            >
              Login
            </button>

            <button
              className={`login-tab ${tab === "register" ? "active" : ""}`}
              onClick={() => {
                setTab("register");
                setError("");
              }}
              type="button"
            >
              Register
            </button>
          </div>

          <div className="login-body">
            {tab === "login" ? (
              <>
                <div className="eyebrow">WELCOME BACK</div>

                <h2 className="login-title">Enter your workspace</h2>

                <p className="login-subtitle">
                  Continue your journey in the Nexus
                </p>

                {error && (
                  <div
                    style={{
                      color: "#ff6b6b",
                      marginBottom: "15px",
                      fontSize: "14px",
                    }}
                  >
                    {error}
                  </div>
                )}

                <form onSubmit={handleLogin}>
                  <label className="field-label" htmlFor="email">
                    Email
                  </label>

                  <div className="input-wrap">
                    <Icon name="mail" size={16} style={{ color: "#6d7a93" }} />

                    <input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={loginData.email}
                      onChange={(e) =>
                        setLoginData({
                          ...loginData,
                          email: e.target.value,
                        })
                      }
                    />
                  </div>

                  <label className="field-label" htmlFor="password">
                    Password
                  </label>

                  <div className="input-wrap">
                    <Icon name="lock" size={16} style={{ color: "#6d7a93" }} />

                    <input
                      id="password"
                      type={showPw ? "text" : "password"}
                      placeholder="Enter your password"
                      value={loginData.password}
                      onChange={(e) =>
                        setLoginData({
                          ...loginData,
                          password: e.target.value,
                        })
                      }
                    />

                    <button
                      type="button"
                      className="eye-btn"
                      onClick={() => setShowPw((s) => !s)}
                    >
                      <Icon
                        name={showPw ? "eyeOff" : "eyeOpen"}
                        size={16}
                        style={{
                          color: "#6d7a93",
                        }}
                      />
                    </button>
                  </div>

                  <div className="row-between">
                    <label className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={keepSignedIn}
                        onChange={(e) => setKeepSignedIn(e.target.checked)}
                      />
                      <span>Keep me signed in</span>
                    </label>

                    <Link to="/forgot-password" className="link-muted">
                      Forgot Password?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    className="cta-btn"
                    disabled={submitting}
                  >
                    <span>{submitting ? "Opening..." : "Open Workspace"}</span>

                    {!submitting && <Icon name="arrowRight" size={17} />}
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="eyebrow">JOIN THE NEXUS</div>

                <h2 className="login-title">Create your account</h2>

                <p className="login-subtitle">
                  Start building with thousands of devs
                </p>

                {error && (
                  <div
                    style={{
                      color: "#ff6b6b",
                      marginBottom: "15px",
                      fontSize: "14px",
                    }}
                  >
                    {error}
                  </div>
                )}

                <form onSubmit={handleRegister}>
                  <label className="field-label" htmlFor="name">
                    Username
                  </label>

                  <div className="input-wrap">
                    <Icon name="users" size={16} style={{ color: "#6d7a93" }} />

                    <input
                      id="name"
                      type="text"
                      placeholder="Enter username"
                      value={registerData.username}
                      onChange={(e) =>
                        setRegisterData({
                          ...registerData,
                          username: e.target.value,
                        })
                      }
                    />
                  </div>

                  <label className="field-label" htmlFor="reg-email">
                    Email
                  </label>

                  <div className="input-wrap">
                    <Icon name="mail" size={16} style={{ color: "#6d7a93" }} />

                    <input
                      id="reg-email"
                      type="email"
                      placeholder="Enter your email"
                      value={registerData.email}
                      onChange={(e) =>
                        setRegisterData({
                          ...registerData,
                          email: e.target.value,
                        })
                      }
                    />
                  </div>

                  <label className="field-label" htmlFor="reg-password">
                    Password
                  </label>

                  <div className="input-wrap">
                    <Icon name="lock" size={16} style={{ color: "#6d7a93" }} />

                    <input
                      id="reg-password"
                      type={showPw ? "text" : "password"}
                      placeholder="Enter your password"
                      value={registerData.password}
                      onChange={(e) =>
                        setRegisterData({
                          ...registerData,
                          password: e.target.value,
                        })
                      }
                    />

                    <button
                      type="button"
                      className="eye-btn"
                      onClick={() => setShowPw((s) => !s)}
                    >
                      <Icon
                        name={showPw ? "eyeOff" : "eyeOpen"}
                        size={16}
                        style={{
                          color: "#6d7a93",
                        }}
                      />
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="cta-btn"
                    style={{
                      marginTop: "18px",
                    }}
                    disabled={submitting}
                  >
                    <span>{submitting ? "Creating..." : "Create Account"}</span>

                    {!submitting && <Icon name="arrowRight" size={17} />}
                  </button>
                </form>
              </>
            )}

            <div className="divider">
              <span>OR</span>
            </div>

            <button
              type="button"
              className="oauth-btn"
              onClick={handleGithubLogin}
            >
              <Icon name="github" size={18} />
              <span>Continue with GitHub</span>
            </button>

            <button
              type="button"
              className="oauth-btn"
              onClick={handleGoogleLogin}
            >
              <Icon name="google" size={18} />
              <span>Continue with Google</span>
            </button>

            <p className="secure-line">
              <Icon
                name="shield"
                size={12}
                style={{
                  color: "#34d399",
                  verticalAlign: "-2px",
                  marginRight: "5px",
                }}
              />
              Secure. Private. Built for{" "}
              <span className="accent-text">developers</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
