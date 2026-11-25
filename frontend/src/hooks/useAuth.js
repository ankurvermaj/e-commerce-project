import { useCallback, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import api from "../api";

function decodeStoredUser() {
  const token = localStorage.getItem("access_token");
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);
    return {
      user_id: decoded.user_id,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
    };
  } catch {
    localStorage.removeItem("access_token");
    return null;
  }
}

export function useAuth(onLogoutCleanup) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, SetLoginError] = useState("");
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const [user, setUser] = useState(decodeStoredUser);
  const navigate = useNavigate();

  const handleLogout = useCallback(() => {
    localStorage.removeItem("access_token");
    setUser(null);
    setShowSessionWarning(false);
    if (onLogoutCleanup) {
      onLogoutCleanup();
    }
    navigate("/login");
  }, [navigate, onLogoutCleanup]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      const decoded = jwtDecode(token);
      const expTime = decoded.exp * 1000;
      const timeLeft = expTime - Date.now();

      if (timeLeft <= 0) {
        const immediateLogout = setTimeout(handleLogout, 0);
        return () => clearTimeout(immediateLogout);
      }

      const warningTime = timeLeft - 2 * 60 * 1000;
      const warningTimer = setTimeout(
        () => setShowSessionWarning(true),
        warningTime > 0 ? warningTime : 0
      );

      const logoutTimer = setTimeout(() => {
        handleLogout();
      }, timeLeft);

      return () => {
        clearTimeout(warningTimer);
        clearTimeout(logoutTimer);
      };
    } catch {
      const catchLogout = setTimeout(handleLogout, 0);
      return () => clearTimeout(catchLogout);
    }
  }, [user, handleLogout]);

  const login = () => {
    api
      .post("/api/auth/login", { email, password })
      .then((res) => {
        const token = res.data.access_token;
        localStorage.setItem("access_token", token);
        const decoded = jwtDecode(token);
        setUser({ user_id: decoded.user_id, role: decoded.role, name: decoded.name });
        setEmail("");
        setPassword("");
        navigate("/");
      })
      .catch((err) => {
        SetLoginError(err.response?.data?.detail || "Invalid email or password");
      });
  };

  return {
    user,
    email,
    setEmail,
    password,
    setPassword,
    loginError,
    SetLoginError,
    showSessionWarning,
    setShowSessionWarning,
    login,
    handleLogout,
  };
}
