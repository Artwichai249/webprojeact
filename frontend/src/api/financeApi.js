// src/api/financeApi.js
import { API_BASE_URL } from "./config";
const BASE_URL = `${API_BASE_URL}/finance`;

const authHeaders = (token) => {
  const authToken = token || localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  };
};

// ดึงสรุปรายรับ-รายจ่ายทั้งหมด
export async function getFinanceSummary(params = {}, token) {
  try {
    const query = new URLSearchParams();
    if (params.period) query.append("period", params.period);
    if (params.startDate) query.append("startDate", params.startDate);
    if (params.endDate) query.append("endDate", params.endDate);

    const url = `${BASE_URL}/summary${query.toString() ? `?${query.toString()}` : ""}`;
    const res = await fetch(url, {
      headers: authHeaders(token),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { error: err.message || "ไม่สามารถดึงข้อมูลสรุปรายรับ-รายจ่ายได้" };
    }
    return await res.json();
  } catch (error) {
    console.error("Error fetching finance summary:", error);
    return { error: error.message };
  }
}

// บันทึกรายการรายรับ-รายจ่ายเพิ่มเติม
export async function createFinanceTransaction(data, token) {
  try {
    const res = await fetch(`${BASE_URL}/transactions`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      return { error: result.message || "ไม่สามารถบันทึกรายการได้" };
    }
    return result;
  } catch (error) {
    console.error("Error creating finance transaction:", error);
    return { error: error.message };
  }
}

// ลบรายการรายรับ-รายจ่ายเพิ่มเติม
export async function deleteFinanceTransaction(id, token) {
  try {
    const res = await fetch(`${BASE_URL}/transactions/${id}`, {
      method: "DELETE",
      headers: authHeaders(token),
    });
    const result = await res.json();
    if (!res.ok) {
      return { error: result.message || "ไม่สามารถลบรายการได้" };
    }
    return result;
  } catch (error) {
    console.error("Error deleting finance transaction:", error);
    return { error: error.message };
  }
}

// ดึงข้อมูลบัญชีธนาคารและยอดเงินในบัญชี
export async function getBankAccount(token) {
  try {
    const res = await fetch(`${BASE_URL}/bank-account`, {
      headers: authHeaders(token),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { error: err.message || "ไม่สามารถดึงข้อมูลบัญชีธนาคารได้" };
    }
    return await res.json();
  } catch (error) {
    console.error("Error fetching bank account:", error);
    return { error: error.message };
  }
}

// อัปเดตข้อมูลบัญชีธนาคารและยอดเงินในบัญชี
export async function updateBankAccount(data, token) {
  try {
    const res = await fetch(`${BASE_URL}/bank-account`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      return { error: result.message || "ไม่สามารถอัปเดตข้อมูลบัญชีธนาคารได้" };
    }
    return result;
  } catch (error) {
    console.error("Error updating bank account:", error);
    return { error: error.message };
  }
}
