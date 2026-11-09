// src/modules/auth/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import * as authApi from "../../api/authApi";

const AuthContext = createContext(null);
const TOKEN_KEY = "auth_token";

// รายชื่อ Username ที่มีสิทธิ์ระดับ Admin สามารถเข้าได้ทุกหน้า
export const ADMIN_USERNAMES = ["admin1", "admin2", "admin3", "admin4"];

export function isUserAdmin(user) {
  if (!user || !user.username) return false;
  return ADMIN_USERNAMES.includes(user.username.trim().toLowerCase());
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem(TOKEN_KEY));

  // ตรวจสอบ token เดิมเมื่อเปิดหน้าเว็บใหม่
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    authApi.getMe(token).then((me) => {
      if (cancelled) return;
      if (me) setUser(me);
      else {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (username, password) => {
    const res = await authApi.login(username, password);
    if (res.error) return res;
    localStorage.setItem(TOKEN_KEY, res.token);
    setToken(res.token);
    setUser(res.user);
    return res;
  };

  const logout = async () => {
    if (token) await authApi.logout(token);
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  const updateCurrentUser = (updatedFields) => {
    setUser((prev) => (prev ? { ...prev, ...updatedFields } : prev));
  };

  const isAdmin = isUserAdmin(user);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        updateCurrentUser,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

// ป้องกันหน้าที่ต้องเข้าสู่ระบบก่อน
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="auth-loading">กำลังตรวจสอบการเข้าสู่ระบบ...</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

// ป้องกันหน้าที่อนุญาตเฉพาะ Admin (admin1, admin2, admin3, admin4)
// หากเป็นบัญชีอื่นที่ไม่ใช่ admin จะถูกเปลี่ยนเส้นทางไปหน้าสั่งซื้อสินค้า (/shop) ทันที
export function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="auth-loading">กำลังตรวจสอบสิทธิ์ผู้ใช้งาน...</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (!isAdmin) {
    return <Navigate to="/shop" replace />;
  }
  return children;
}
