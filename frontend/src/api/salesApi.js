// src/api/salesApi.js
import { API_BASE_URL } from "./config";
const API_URL = `${API_BASE_URL}/sales`;

export async function createSale(saleData, token) {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(saleData),
    });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.message || data.error || "เกิดข้อผิดพลาดในการบันทึกการขาย" };
    }
    return data;
  } catch (error) {
    console.error("Error creating sale:", error);
    return { error: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้" };
  }
}

export async function getSales(token) {
  try {
    const res = await fetch(API_URL, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) throw new Error("Failed to fetch sales");
    return await res.json();
  } catch (error) {
    console.error("Error fetching sales:", error);
    return [];
  }
}
