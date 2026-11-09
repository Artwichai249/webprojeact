// src/api/customerOrderApi.js
import { API_BASE_URL } from "./config";
const BASE_URL = `${API_BASE_URL}/customer-orders`;

const authHeaders = (token) => {
  const authToken = token || localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  };
};

// สั่งซื้อสินค้าสำหรับลูกค้า (POST /api/customer-orders)
export async function createCustomerOrder(orderData, token) {
  try {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(orderData),
    });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.message || data.error || "เกิดข้อผิดพลาดในการสั่งซื้อสินค้า" };
    }
    return data;
  } catch (error) {
    console.error("Error creating customer order:", error);
    return { error: error.message || "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้" };
  }
}

// ดึงประวัติคำสั่งซื้อของลูกค้า (GET /api/customer-orders)
export async function getCustomerOrders(token, all = false) {
  try {
    const url = all ? `${BASE_URL}?all=true` : BASE_URL;
    const res = await fetch(url, {
      headers: authHeaders(token),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { error: err.message || "ไม่สามารถดึงข้อมูลคำสั่งซื้อได้" };
    }
    return await res.json();
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    return [];
  }
}

// ดึงรายละเอียดคำสั่งซื้อรายออเดอร์ (GET /api/customer-orders/:id)
export async function getCustomerOrderById(id, token) {
  try {
    const res = await fetch(`${BASE_URL}/${id}`, {
      headers: authHeaders(token),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { error: err.message || "ไม่พบข้อมูลคำสั่งซื้อนี้" };
    }
    return await res.json();
  } catch (error) {
    console.error("Error fetching customer order by ID:", error);
    return null;
  }
}

// อัปเดตสถานะคำสั่งซื้อ (PUT /api/customer-orders/:id/status)
export async function updateCustomerOrderStatus(id, status, token) {
  try {
    const res = await fetch(`${BASE_URL}/${id}/status`, {
      method: "PUT",
      headers: authHeaders(token),
      body: JSON.stringify({ status }),
    });
    return await res.json();
  } catch (error) {
    console.error("Error updating order status:", error);
    return { error: error.message };
  }
}

// ดึงรายการเบอร์โทรศัพท์และข้อมูลสมาชิกที่มีอยู่ในระบบสำหรับเลือกกรอกสั่งซื้อ
export async function getExistingPhones(token) {
  try {
    const res = await fetch(`${BASE_URL}/existing-phones`, {
      headers: authHeaders(token),
    });
    if (!res.ok) {
      return [];
    }
    return await res.json();
  } catch (error) {
    console.error("Error fetching existing phones:", error);
    return [];
  }
}
