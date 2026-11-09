// src/api/productApi.js
import { API_BASE_URL } from "./config";
const BASE_URL = `${API_BASE_URL}/products`;
const PO_URL = `${API_BASE_URL}/purchase-orders`;

const authHeaders = () => {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// ดึงข้อมูลสินค้าทั้งหมด (GET /api/products)
export async function getAllProducts() {
  try {
    const res = await fetch(BASE_URL, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch products");
    return await res.json();
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

// ดึงข้อมูลสินค้ารายชิ้น (GET /api/products/:id)
export async function getProductById(id) {
  try {
    const res = await fetch(`${BASE_URL}/${id}`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch product");
    return await res.json();
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

// เพิ่มสินค้าใหม่ (POST /api/products)
export async function createProduct(productData) {
  try {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(productData),
    });
    return await res.json();
  } catch (error) {
    console.error("Error creating product:", error);
    return { error: error.message };
  }
}

// แก้ไขข้อมูลสินค้า (PUT /api/products/:id)
export async function updateProduct(id, productData) {
  try {
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(productData),
    });
    return await res.json();
  } catch (error) {
    console.error("Error updating product:", error);
    return { error: error.message };
  }
}

// ลบสินค้า (DELETE /api/products/:id)
export async function deleteProduct(id) {
  try {
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    return await res.json();
  } catch (error) {
    console.error("Error deleting product:", error);
    return { error: error.message };
  }
}

// สั่งซื้อสินค้าเข้าสต็อก (POST /api/purchase-orders)
export async function createPurchaseOrder(orderData) {
  try {
    const res = await fetch(PO_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.message || data.error || "เกิดข้อผิดพลาดในการสั่งซื้อสินค้า" };
    }
    return data;
  } catch (error) {
    console.error("Error creating purchase order:", error);
    return { error: error.message || "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้" };
  }
}

// ดึงประวัติการเสนอสั่งซื้อสินค้า (GET /api/purchase-orders)
export async function getPurchaseOrders() {
  try {
    const res = await fetch(PO_URL);
    if (!res.ok) throw new Error("Failed to fetch purchase orders");
    return await res.json();
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    return [];
  }
}

// อนุมัติใบเสนอการสั่งซื้อและรับเข้าสต็อก (PUT /api/purchase-orders/:id/approve)
export async function approvePurchaseOrder(id) {
  try {
    const res = await fetch(`${PO_URL}/${id}/approve`, {
      method: "PUT",
    });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.message || data.error || "เกิดข้อผิดพลาดในการอนุมัติ" };
    }
    return data;
  } catch (error) {
    console.error("Error approving purchase order:", error);
    return { error: error.message || "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้" };
  }
}

// ลบใบเสนอการสั่งซื้อ (DELETE /api/purchase-orders/:id)
export async function deletePurchaseOrder(id) {
  try {
    const res = await fetch(`${PO_URL}/${id}`, {
      method: "DELETE",
    });
    return await res.json();
  } catch (error) {
    console.error("Error deleting purchase order:", error);
    return { error: error.message || "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้" };
  }
}

// ดึงใบเสนอการสั่งซื้อรายใบตาม ID (GET /api/purchase-orders/:id)
export async function getPurchaseOrderById(id) {
  try {
    const res = await fetch(`${PO_URL}/${id}`);
    if (!res.ok) throw new Error("Failed to fetch purchase order");
    return await res.json();
  } catch (error) {
    console.error("Error fetching purchase order:", error);
    return null;
  }
}

// ชำระเงินค่าสินค้าและอนุมัติรับเข้าสต็อก (POST /api/purchase-orders/:id/pay)
export async function payPurchaseOrder(id, paymentData) {
  try {
    const res = await fetch(`${PO_URL}/${id}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paymentData),
    });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.message || data.error || "เกิดข้อผิดพลาดในการชำระเงิน" };
    }
    return data;
  } catch (error) {
    console.error("Error paying purchase order:", error);
    return { error: error.message || "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้" };
  }
}



