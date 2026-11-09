// src/api/profileApi.js
import { API_BASE_URL } from "./config";
const API_URL = `${API_BASE_URL}/user/profile`;

const authHeaders = (token) => {
  const authToken = token || localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  };
};

export async function getUserProfile(token) {
  try {
    const res = await fetch(API_URL, {
      headers: authHeaders(token),
    });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.message || data.error || "ไม่สามารถดึงข้อมูลส่วนบุคคลได้" };
    }
    return data;
  } catch (err) {
    console.error("Error fetching user profile:", err);
    return { error: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้" };
  }
}

export async function updateUserProfile(payload, token) {
  try {
    const res = await fetch(API_URL, {
      method: "PUT",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.message || data.error || "บันทึกข้อมูลส่วนบุคคลไม่สำเร็จ" };
    }
    return data;
  } catch (err) {
    console.error("Error updating user profile:", err);
    return { error: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้" };
  }
}
