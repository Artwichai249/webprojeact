// src/modules/auth/screens/Login.jsx
import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Layers, User, Lock, Eye, EyeOff, LogIn, AlertCircle, UserPlus, CheckCircle2 } from "lucide-react";
import { useAuth } from "../AuthContext";
import "./Login.css";

export default function Login() {
  const { user, login, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;

  const registered = location.state?.registered;

  const [username, setUsername] = useState(location.state?.username || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const getDestinationByUser = (u) => {
    const uname = (u?.username || "").trim().toLowerCase();
    const name = (u?.name || "").trim().toLowerCase();
    if (uname === "admin1" || name.includes("เจ้าของ")) return "/owner";
    if (uname === "admin2" || name.includes("พนักงานขาย") || name.includes("ขาย")) return "/sales-staff";
    if (uname === "admin3" || name.includes("สต็อก") || name.includes("สต๊อก") || name.includes("คลัง")) return "/warehouse";
    if (uname === "admin4" || name.includes("ผู้จัดการ")) return "/manager";
    const adminList = ["admin1", "admin2", "admin3", "admin4"];
    if (adminList.includes(uname)) {
      return from && from !== "/login" && from !== "/" ? from : "/members";
    }
    return "/shop";
  };

  if (user) {
    return <Navigate to={getDestinationByUser(user)} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      setError("กรุณากรอก Username และ Password");
      return;
    }
    setSubmitting(true);
    const res = await login(username.trim(), password);
    setSubmitting(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    navigate(getDestinationByUser(res.user), { replace: true });
  };

  return (
    <div className="login-page">
      <div className="login-blob blob-1" />
      <div className="login-blob blob-2" />

      <form className="login-card" onSubmit={handleSubmit} noValidate>
        <div className="login-brand">
          <div className="login-brand-icon">
            <Layers size={26} />
          </div>
          <h1>เข้าสู่ระบบ</h1>
          <p>ระบบจัดการข้อมูล React + Vite + MySQL</p>
        </div>

        {registered && !error && (
          <div className="login-success" role="status">
            <CheckCircle2 size={16} />
            <span>สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ</span>
          </div>
        )}

        {error && (
          <div className="login-error" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <label className="login-field" htmlFor="login-username">
          <span>Username</span>
          <div className="login-input">
            <User size={18} />
            <input
              id="login-username"
              type="text"
              autoComplete="username"
              placeholder="กรอกชื่อผู้ใช้"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
          </div>
        </label>

        <label className="login-field" htmlFor="login-password">
          <span>Password</span>
          <div className="login-input">
            <Lock size={18} />
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="กรอกรหัสผ่าน"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              id="login-toggle-password"
              className="login-eye"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>

        <button id="login-submit" type="submit" className="login-submit" disabled={submitting}>
          {submitting ? <span className="login-spinner" /> : <LogIn size={18} />}
          <span>{submitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}</span>
        </button>

        <div className="login-divider"><span>ยังไม่มีบัญชี?</span></div>

        <Link id="login-signup" to="/signup" className="login-secondary">
          <UserPlus size={18} />
          <span>สมัครสมาชิก</span>
        </Link>
      </form>
    </div>
  );
}
