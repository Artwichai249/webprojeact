// src/api/authApi.js
import { API_BASE_URL } from "./config";
const API_URL = API_BASE_URL;

export const login = async (username, password) => {
  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.message || data.error || "เข้าสู่ระบบไม่สำเร็จ" };
    return data;
  } catch (error) {
    return { error: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้" };
  }
};

export const signup = async (data) => {
  try {
    const res = await fetch(`${API_URL}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) return { error: json.message || json.error || "สมัครสมาชิกไม่สำเร็จ" };
    return json;
  } catch (error) {
    return { error: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้" };
  }
};

export const logout = async (token) => {
  try {
    await fetch(`${API_URL}/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    console.error("Error logging out:", error);
  }
};

export const getMe = async (token) => {
  try {
    const res = await fetch(`${API_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user;
  } catch (error) {
    return null;
  }
};
