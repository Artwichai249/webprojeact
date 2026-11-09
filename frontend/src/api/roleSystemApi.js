// src/api/roleSystemApi.js
import { API_BASE_URL } from "./config";
const API_BASE = API_BASE_URL;
const TOKEN_KEY = "auth_token";

function authHeaders(tokenOverride) {
  const token = tokenOverride || localStorage.getItem(TOKEN_KEY);
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ============================================================================
// 3.1 เจ้าของร้าน: อนุมัติการจัดส่งของขวัญเทศกาลปีใหม่และวันเกิด + ค้นหาตามเงื่อนไข
// ============================================================================

export async function getOwnerGifts(params = {}, token) {
  try {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.set(k, v);
    });
    const url = `${API_BASE}/owner/gifts${qs.toString() ? `?${qs.toString()}` : ""}`;
    const res = await fetch(url, { headers: authHeaders(token) });
    const data = await res.json();
    if (!res.ok) return { error: data.message || data.error || "ไม่สามารถดึงข้อมูลของขวัญได้" };
    return data;
  } catch (err) {
    return { error: err.message };
  }
}

export async function createOwnerGift(payload, token) {
  try {
    const res = await fetch(`${API_BASE}/owner/gifts`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.message || data.error || "สร้างรายการของขวัญไม่สำเร็จ" };
    return data;
  } catch (err) {
    return { error: err.message };
  }
}

export async function approveOwnerGift(id, payload, token) {
  try {
    const res = await fetch(`${API_BASE}/owner/gifts/${id}/approve`, {
      method: "PUT",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.message || data.error || "อัปเดตสถานะของขวัญไม่สำเร็จ" };
    return data;
  } catch (err) {
    return { error: err.message };
  }
}

export async function deleteOwnerGift(id, token) {
  try {
    const res = await fetch(`${API_BASE}/owner/gifts/${id}`, {
      method: "DELETE",
      headers: authHeaders(token),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.message || data.error || "ลบรายการไม่สำเร็จ" };
    return data;
  } catch (err) {
    return { error: err.message };
  }
}

// ============================================================================
// 3.2 ผู้จัดการ: มอบหมายงานและติดตามความก้าวหน้าการทำงานของพนักงาน + ค้นหาตามเงื่อนไข
// ============================================================================

export async function getManagerTasks(params = {}, token) {
  try {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.set(k, v);
    });
    const url = `${API_BASE}/manager/tasks${qs.toString() ? `?${qs.toString()}` : ""}`;
    const res = await fetch(url, { headers: authHeaders(token) });
    const data = await res.json();
    if (!res.ok) return { error: data.message || data.error || "ไม่สามารถดึงข้อมูลงานได้" };
    return data;
  } catch (err) {
    return { error: err.message };
  }
}

export async function createManagerTask(payload, token) {
  try {
    const res = await fetch(`${API_BASE}/manager/tasks`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.message || data.error || "มอบหมายงานไม่สำเร็จ" };
    return data;
  } catch (err) {
    return { error: err.message };
  }
}

export async function updateManagerTask(id, payload, token) {
  try {
    const res = await fetch(`${API_BASE}/manager/tasks/${id}`, {
      method: "PUT",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.message || data.error || "อัปเดตงานไม่สำเร็จ" };
    return data;
  } catch (err) {
    return { error: err.message };
  }
}

export async function deleteManagerTask(id, token) {
  try {
    const res = await fetch(`${API_BASE}/manager/tasks/${id}`, {
      method: "DELETE",
      headers: authHeaders(token),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.message || data.error || "ลบงานไม่สำเร็จ" };
    return data;
  } catch (err) {
    return { error: err.message };
  }
}

// ============================================================================
// 3.3 พนักงานขาย: ค้นหาข้อมูลสมาชิก ตรวจสอบแต้มสะสม และบันทึกสมัครสมาชิกใหม่
// ============================================================================

export async function getSalesStaffMembers(params = {}, token) {
  try {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.set(k, v);
    });
    const url = `${API_BASE}/sales-staff/members${qs.toString() ? `?${qs.toString()}` : ""}`;
    const res = await fetch(url, { headers: authHeaders(token) });
    const data = await res.json();
    if (!res.ok) return { error: data.message || data.error || "ไม่สามารถดึงข้อมูลสมาชิกได้" };
    return data;
  } catch (err) {
    return { error: err.message };
  }
}

export async function registerMemberBySalesStaff(payload, token) {
  try {
    const res = await fetch(`${API_BASE}/sales-staff/members`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.message || data.error || "สมัครสมาชิกไม่สำเร็จ" };
    return data;
  } catch (err) {
    return { error: err.message };
  }
}

// ============================================================================
// 3.4 พนักงานสต็อก / คลังสินค้า: รับสินค้าเข้าคลัง ตรวจ QC บันทึกสินค้าชำรุด + โกดัง (1 หมวดหมู่ : 1 โกดัง)
// ============================================================================

export async function getWarehouseOverview(params = {}, token) {
  try {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.set(k, v);
    });
    const url = `${API_BASE}/warehouse/overview${qs.toString() ? `?${qs.toString()}` : ""}`;
    const res = await fetch(url, { headers: authHeaders(token) });
    const data = await res.json();
    if (!res.ok) return { error: data.message || data.error || "ไม่สามารถดึงข้อมูลคลังสินค้าได้" };
    return data;
  } catch (err) {
    return { error: err.message };
  }
}

export async function createWarehouse(payload, token) {
  try {
    const res = await fetch(`${API_BASE}/warehouse/warehouses`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.message || data.error || "สร้างโกดังไม่สำเร็จ" };
    return data;
  } catch (err) {
    return { error: err.message };
  }
}

export async function receiveAndInspectQC(payload, token) {
  try {
    const res = await fetch(`${API_BASE}/warehouse/receive-qc`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.message || data.error || "บันทึกการตรวจรับ QC ไม่สำเร็จ" };
    return data;
  } catch (err) {
    return { error: err.message };
  }
}

// ============================================================================
// 3.5 ลูกค้า / สมาชิก: สะสมแต้ม (50 บาท = 5 แต้ม), แจ้งวันเกิด/ที่อยู่รับของขวัญ, ตรวจสอบแต้มสะสมคงเหลือ
// ============================================================================

export async function getMyLoyaltyInfo(token) {
  try {
    const res = await fetch(`${API_BASE}/loyalty/me`, {
      headers: authHeaders(token),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.message || data.error || "ไม่สามารถดึงข้อมูลแต้มสะสมได้" };
    return data;
  } catch (err) {
    return { error: err.message };
  }
}

export async function updateMyLoyaltyProfile(payload, token) {
  try {
    const res = await fetch(`${API_BASE}/loyalty/profile`, {
      method: "PUT",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.message || data.error || "บันทึกข้อมูลไม่สำเร็จ" };
    return data;
  } catch (err) {
    return { error: err.message };
  }
}

export async function requestMemberGift(payload, token) {
  try {
    const res = await fetch(`${API_BASE}/loyalty/request-gift`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.message || data.error || "ส่งคำขอรับของขวัญไม่สำเร็จ" };
    return data;
  } catch (err) {
    return { error: err.message };
  }
}

// ตรวจสอบแต้มสะสมและของขวัญของสมาชิกรายบุคคล
export async function getMemberLoyaltyDetails(username, token) {
  try {
    const res = await fetch(`${API_BASE}/loyalty/member/${encodeURIComponent(username)}`, {
      headers: authHeaders(token),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.message || data.error || "ไม่สามารถดึงข้อมูลแต้มสะสมและของขวัญได้" };
    return data;
  } catch (err) {
    return { error: err.message };
  }
}

// ปรับยอดแต้มสะสมของสมาชิก (เช่น ให้แต้มโบนัส)
export async function adjustMemberPoints(username, payload, token) {
  try {
    const res = await fetch(`${API_BASE}/loyalty/member/${encodeURIComponent(username)}/points`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.message || data.error || "ปรับแต้มไม่สำเร็จ" };
    return data;
  } catch (err) {
    return { error: err.message };
  }
}

// รีเซ็ตแต้มสะสมของสมาชิกทั้งหมดเป็น 0 (Reset All Points)
export async function resetAllMemberPoints(token) {
  try {
    const res = await fetch(`${API_BASE}/loyalty/reset-all-points`, {
      method: "POST",
      headers: authHeaders(token),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.message || data.error || "รีเซ็ตแต้มไม่สำเร็จ" };
    return data;
  } catch (err) {
    return { error: err.message };
  }
}

// ปรับปรุง / เติมเงินยอดเงินในบัญชีของผู้ใช้งาน (Admin)
export async function adjustMemberWallet(username, payload, token) {
  try {
    const res = await fetch(`${API_BASE}/loyalty/member/${encodeURIComponent(username)}/wallet`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.message || data.error || "ไม่สามารถปรับยอดเงินในบัญชีได้" };
    return data;
  } catch (err) {
    return { error: err.message };
  }
}

// ผู้ใช้งานเติมเงินเข้าบัญชีตัวเอง
export async function topupUserWallet(amountOrPayload, channelOrToken, tokenArg) {
  try {
    let payload = {};
    let token = tokenArg;
    if (typeof amountOrPayload === "object") {
      payload = amountOrPayload;
      token = channelOrToken;
    } else {
      payload = {
        amount: amountOrPayload,
        payment_channel: typeof channelOrToken === "string" && tokenArg ? channelOrToken : "พร้อมเพย์ / PromptPay",
      };
      token = tokenArg || (typeof channelOrToken === "string" && channelOrToken.length > 20 ? channelOrToken : null);
    }
    const res = await fetch(`${API_BASE}/user/wallet/topup`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.message || data.error || "ไม่สามารถเติมเงินเข้าบัญชีได้" };
    return data;
  } catch (err) {
    return { error: err.message };
  }
}

// ดึงประวัติรายการยอดเงินคงเหลือในกระเป๋าเงินของผู้ใช้ปัจจุบัน
export async function getUserWalletHistory(token) {
  try {
    const res = await fetch(`${API_BASE}/user/wallet/history`, {
      headers: authHeaders(token),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.message || data.error || "ไม่สามารถดึงประวัติยอดเงินได้" };
    return data;
  } catch (err) {
    return { error: err.message };
  }
}
