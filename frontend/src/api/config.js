// src/api/config.js
// ระบบดึง URL ของ Backend อัตโนมัติ:
// - บนเครื่องตนเอง (Development): ใช้ http://localhost:3000/api
// - บนเซิร์ฟเวอร์จริง (Production/Cloud): ดึงจากค่า VITE_API_URL ใน Environment Variables
export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "https://webprojeact-backend.onrender.com/api"
).replace(/\/+$/, "");
