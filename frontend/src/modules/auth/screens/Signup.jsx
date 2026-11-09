// src/modules/auth/screens/Signup.jsx
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { UserPlus, User, Lock, Phone, Contact, AlertCircle, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useAuth } from "../AuthContext";
import { signup } from "../../../api/authApi";
import "./Login.css";

export default function Signup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", username: "", password: "", confirm: "", phone: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const digits = value.replace(/\D/g, "").slice(0, 10);
      setForm({ ...form, phone: digits });
      return;
    }
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.username.trim() || !form.password) {
      setError("กรุณากรอกชื่อ, Username และ Password ให้ครบถ้วน");
      return;
    }
    if (form.password.length < 4) {
      setError("Password ต้องมีอย่างน้อย 4 ตัวอักษร");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Password และยืนยัน Password ไม่ตรงกัน");
      return;
    }
    if (form.phone && form.phone.replace(/\D/g, "").length !== 10) {
      setError("เบอร์โทรศัพท์ต้องมีตัวเลข 10 หลักเท่านั้น (เช่น 0812345678)");
      return;
    }

    setSubmitting(true);
    const res = await signup({
      name: form.name.trim(),
      username: form.username.trim(),
      password: form.password,
      phone: form.phone ? form.phone.replace(/\D/g, "") : "",
    });
    setSubmitting(false);

    if (res.error) {
      setError(res.error);
      return;
    }
    navigate("/login", {
      replace: true,
      state: { registered: true, username: res.username },
    });
  };

  const fields = [
    { name: "name", label: "ชื่อ - นามสกุล *", icon: Contact, type: "text", placeholder: "กรอกชื่อ - นามสกุล", autoComplete: "name" },
    { name: "username", label: "Username *", icon: User, type: "text", placeholder: "กรอกชื่อผู้ใช้", autoComplete: "username" },
    { name: "phone", label: "เบอร์โทรศัพท์ (10 หลัก)", icon: Phone, type: "tel", placeholder: "เช่น 0812345678", maxLength: 10, inputMode: "numeric", autoComplete: "tel" },
  ];

  return (
    <div className="login-page">
      <div className="login-blob blob-1" />
      <div className="login-blob blob-2" />

      <form className="login-card" onSubmit={handleSubmit} noValidate>
        <div className="login-brand">
          <div className="login-brand-icon">
            <UserPlus size={26} />
          </div>
          <h1>สมัครสมาชิก</h1>
          <p>สร้างบัญชีใหม่เพื่อเข้าใช้งานระบบ</p>
        </div>

        {error && (
          <div className="login-error" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {fields.map(({ name, label, icon: Icon, ...rest }) => (
          <label key={name} className="login-field" htmlFor={`signup-${name}`}>
            <span>{label}</span>
            <div className="login-input">
              <Icon size={18} />
              <input id={`signup-${name}`} name={name} value={form[name]} onChange={handleChange} {...rest} />
            </div>
          </label>
        ))}

        {["password", "confirm"].map((name) => (
          <label key={name} className="login-field" htmlFor={`signup-${name}`}>
            <span>{name === "password" ? "Password *" : "ยืนยัน Password *"}</span>
            <div className="login-input">
              <Lock size={18} />
              <input
                id={`signup-${name}`}
                name={name}
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder={name === "password" ? "อย่างน้อย 4 ตัวอักษร" : "กรอกรหัสผ่านอีกครั้ง"}
                value={form[name]}
                onChange={handleChange}
              />
              {name === "password" && (
                <button
                  type="button"
                  id="signup-toggle-password"
                  className="login-eye"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              )}
            </div>
          </label>
        ))}

        <button id="signup-submit" type="submit" className="login-submit" disabled={submitting}>
          {submitting ? <span className="login-spinner" /> : <UserPlus size={18} />}
          <span>{submitting ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}</span>
        </button>

        <div className="login-divider"><span>มีบัญชีอยู่แล้ว?</span></div>

        <Link id="signup-back-login" to="/login" className="login-secondary">
          <ArrowLeft size={18} />
          <span>กลับไปเข้าสู่ระบบ</span>
        </Link>
      </form>
    </div>
  );
}
