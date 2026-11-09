// src/modules/roles/screens/OwnerGiftApproval.jsx
import { useState, useEffect } from "react";
import {
  Gift,
  Crown,
  Search,
  Filter,
  CheckCircle2,
  Truck,
  XCircle,
  Clock,
  Calendar,
  MapPin,
  Plus,
  RefreshCw,
  Award,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import {
  getOwnerGifts,
  createOwnerGift,
  approveOwnerGift,
  deleteOwnerGift,
  getSalesStaffMembers,
} from "../../../api/roleSystemApi";
import { useAuth } from "../../auth/AuthContext";
import "./RoleSystem.css";

const THAI_MONTHS = [
  { value: "1", label: "มกราคม" },
  { value: "2", label: "กุมภาพันธ์" },
  { value: "3", label: "มีนาคม" },
  { value: "4", label: "เมษายน" },
  { value: "5", label: "พฤษภาคม" },
  { value: "6", label: "มิถุนายน" },
  { value: "7", label: "กรกฎาคม" },
  { value: "8", label: "สิงหาคม" },
  { value: "9", label: "กันยายน" },
  { value: "10", label: "ตุลาคม" },
  { value: "11", label: "พฤศจิกายน" },
  { value: "12", label: "ธันวาคม" },
];

export default function OwnerGiftApproval() {
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [gifts, setGifts] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    shipped: 0,
    rejected: 0,
    newYearCount: 0,
    birthdayCount: 0,
  });

  // เงื่อนไขการค้นหา (3.1 ค้นหาข้อมูลตามเงื่อนไขที่ต้องการ)
  const [filters, setFilters] = useState({
    search: "",
    gift_type: "all",
    status: "all",
    birth_month: "all",
    min_points: "",
  });

  // Modal สำหรับอนุมัติและระบุเลขพัสดุจัดส่ง
  const [selectedGift, setSelectedGift] = useState(null);
  const [approveForm, setApproveForm] = useState({
    status: "อนุมัติแล้ว",
    tracking_no: "",
    gift_item: "",
    note: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Modal สร้างรายการจัดส่งของขวัญใหม่ให้สมาชิก
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [members, setMembers] = useState([]);
  const [createForm, setCreateForm] = useState({
    username: "",
    nisit_id: "",
    member_name: "",
    phone: "",
    birth_date: "",
    gift_type: "เทศกาลปีใหม่",
    gift_item: "กระเช้าของขวัญพรีเมียมเทศกาลปีใหม่ 2027",
    shipping_address: "",
    note: "",
    auto_approve: true,
  });

  useEffect(() => {
    loadGifts();
  }, [filters.gift_type, filters.status, filters.birth_month]);

  async function loadGifts(customFilters = filters) {
    setLoading(true);
    const res = await getOwnerGifts(customFilters, token);
    if (res && !res.error) {
      setGifts(res.gifts || []);
      if (res.summary) setSummary(res.summary);
    }
    setLoading(false);
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadGifts(filters);
  };

  const handleResetFilters = () => {
    const reset = {
      search: "",
      gift_type: "all",
      status: "all",
      birth_month: "all",
      min_points: "",
    };
    setFilters(reset);
    loadGifts(reset);
  };

  const openApproveModal = (gift, defaultStatus = "อนุมัติแล้ว") => {
    setSelectedGift(gift);
    setApproveForm({
      status: defaultStatus,
      tracking_no:
        gift.tracking_no ||
        (defaultStatus === "อนุมัติแล้ว" || defaultStatus === "จัดส่งสำเร็จ"
          ? `TH-GIFT-${String(gift.gift_id).padStart(4, "0")}`
          : ""),
      gift_item: gift.gift_item || "",
      note: gift.note || "",
    });
  };

  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGift) return;
    setSubmitting(true);
    const res = await approveOwnerGift(selectedGift.gift_id, approveForm, token);
    setSubmitting(false);
    if (res && !res.error) {
      alert(res.message || "บันทึกผลการอนุมัติจัดส่งของขวัญสำเร็จ!");
      setSelectedGift(null);
      loadGifts();
    } else {
      alert(res?.error || "เกิดข้อผิดพลาด");
    }
  };

  const handleQuickApprove = async (gift, targetStatus) => {
    const confirmMsg =
      targetStatus === "อนุมัติแล้ว"
        ? `ยืนยันอนุมัติการจัดส่งของขวัญ${gift.gift_type} ให้คุณ "${gift.member_name}" ใช่หรือไม่?`
        : targetStatus === "จัดส่งสำเร็จ"
        ? `ยืนยันว่าจัดส่งของขวัญให้คุณ "${gift.member_name}" สำเร็จแล้วใช่หรือไม่?`
        : `ต้องการปฏิเสธรายการของขวัญของ "${gift.member_name}" ใช่หรือไม่?`;

    if (!window.confirm(confirmMsg)) return;
    const res = await approveOwnerGift(
      gift.gift_id,
      {
        status: targetStatus,
        gift_item: gift.gift_item,
        note: gift.note,
      },
      token
    );
    if (res && !res.error) {
      loadGifts();
    } else {
      alert(res?.error || "ไม่สามารถอัปเดตสถานะได้");
    }
  };

  const handleDelete = async (gift) => {
    if (!window.confirm(`ต้องการลบรายการของขวัญ ${gift.gift_no} ของ "${gift.member_name}" ใช่หรือไม่?`)) return;
    const res = await deleteOwnerGift(gift.gift_id, token);
    if (res && !res.error) {
      loadGifts();
    } else {
      alert(res?.error || "ลบไม่สำเร็จ");
    }
  };

  const openCreateModal = async () => {
    setIsCreateOpen(true);
    const mList = await getSalesStaffMembers({}, token);
    if (Array.isArray(mList)) {
      setMembers(mList);
    }
  };

  const handleSelectMemberForGift = (username) => {
    const m = members.find((item) => item.username === username);
    if (!m) return;
    setCreateForm((prev) => ({
      ...prev,
      username: m.username,
      nisit_id: m.nisit_id || "",
      member_name: m.name || m.username,
      phone: m.phone !== "-" ? m.phone : "",
      birth_date: m.birth_date ? String(m.birth_date).slice(0, 10) : "",
      shipping_address: m.gift_address || "",
    }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.member_name.trim() || !createForm.shipping_address.trim()) {
      alert("กรุณาระบุชื่อสมาชิกและที่อยู่จัดส่งของขวัญ");
      return;
    }
    setSubmitting(true);
    const res = await createOwnerGift(createForm, token);
    setSubmitting(false);
    if (res && !res.error) {
      alert("เพิ่มรายการจัดส่งของขวัญสำเร็จ!");
      setIsCreateOpen(false);
      loadGifts();
    } else {
      alert(res?.error || "เกิดข้อผิดพลาด");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusClass = (status) => {
    if (status === "อนุมัติแล้ว") return "approved";
    if (status === "จัดส่งสำเร็จ") return "shipped";
    if (status === "ไม่อนุมัติ") return "rejected";
    return "pending";
  };

  return (
    <div className="role-page">
      {/* Hero Banner */}
      <div className="role-hero owner-theme">
        <div className="role-hero-left">
          <div className="role-hero-icon">
            <Crown size={28} />
          </div>
          <div>
            <div className="role-hero-title">
              <h1>ระบบเจ้าของร้าน (Store Owner)</h1>
              <span className="role-badge-tag">เจ้าของร้าน</span>
            </div>
            <p className="role-hero-subtitle">
              อนุมัติการจัดส่งของขวัญเทศกาลปีใหม่และวันเกิดให้แก่ลูกค้าสมาชิก พร้อมค้นหาข้อมูลตามเงื่อนไขที่ต้องการ
            </p>
          </div>
        </div>

        <div className="role-hero-actions">
          <button type="button" className="role-btn outline" onClick={() => loadGifts()}>
            <RefreshCw size={16} />
            รีเฟรชข้อมูล
          </button>
          <button type="button" className="role-btn primary" style={{ background: "#0f172a" }} onClick={openCreateModal}>
            <Plus size={16} />
            สร้างรายการส่งของขวัญ
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="role-stats-grid">
        <div className="role-stat-card">
          <div className="role-stat-info">
            <span>รายการของขวัญทั้งหมด</span>
            <strong>{summary.total}</strong>
            <small>ปีใหม่ {summary.newYearCount} | วันเกิด {summary.birthdayCount}</small>
          </div>
          <div className="role-stat-icon" style={{ background: "#fef3c7", color: "#d97706" }}>
            <Gift size={24} />
          </div>
        </div>

        <div className="role-stat-card">
          <div className="role-stat-info">
            <span>รออนุมัติจัดส่ง</span>
            <strong style={{ color: "#d97706" }}>{summary.pending}</strong>
            <small>รอเจ้าของร้านพิจารณาอนุมัติ</small>
          </div>
          <div className="role-stat-icon" style={{ background: "#ffedd5", color: "#ea580c" }}>
            <Clock size={24} />
          </div>
        </div>

        <div className="role-stat-card">
          <div className="role-stat-info">
            <span>อนุมัติแล้ว</span>
            <strong style={{ color: "#15803d" }}>{summary.approved}</strong>
            <small>พร้อมจัดส่งถึงบ้านสมาชิก</small>
          </div>
          <div className="role-stat-icon" style={{ background: "#dcfce7", color: "#16a34a" }}>
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="role-stat-card">
          <div className="role-stat-info">
            <span>จัดส่งสำเร็จ</span>
            <strong style={{ color: "#1d4ed8" }}>{summary.shipped}</strong>
            <small>ส่งมอบของขวัญเรียบร้อย</small>
          </div>
          <div className="role-stat-icon" style={{ background: "#dbeafe", color: "#2563eb" }}>
            <Truck size={24} />
          </div>
        </div>
      </div>

      {/* ค้นหาข้อมูลตามเงื่อนไขที่ต้องการ */}
      <form className="role-filter-card" onSubmit={handleSearchSubmit}>
        <div className="role-filter-header">
          <h3>
            <Filter size={17} color="#d97706" />
            ค้นหาข้อมูลของขวัญสมาชิกตามเงื่อนไขที่ต้องการ
          </h3>
          <button type="button" className="role-btn outline sm" onClick={handleResetFilters}>
            ล้างตัวกรองทั้งหมด
          </button>
        </div>

        <div className="role-filter-grid">
          <div className="role-field">
            <label>คำค้นหา (ชื่อสมาชิก / รหัส / เบอร์โทร / ที่อยู่ / ของขวัญ)</label>
            <input
              type="text"
              className="role-input"
              placeholder="พิมพ์ชื่อสมาชิก, รหัสใบของขวัญ, ที่อยู่จัดส่ง..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          <div className="role-field">
            <label>ประเภทเทศกาลของขวัญ</label>
            <select
              className="role-select"
              value={filters.gift_type}
              onChange={(e) => setFilters({ ...filters, gift_type: e.target.value })}
            >
              <option value="all">ทั้งหมด (ปีใหม่ + วันเกิด)</option>
              <option value="เทศกาลปีใหม่">🎄 เทศกาลปีใหม่</option>
              <option value="วันเกิด">🎂 วันเกิดสมาชิก</option>
            </select>
          </div>

          <div className="role-field">
            <label>สถานะการอนุมัติ</label>
            <select
              className="role-select"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="all">ทุกสถานะ</option>
              <option value="รออนุมัติ">⏳ รออนุมัติ</option>
              <option value="อนุมัติแล้ว">✅ อนุมัติแล้ว</option>
              <option value="จัดส่งสำเร็จ">🚚 จัดส่งสำเร็จ</option>
              <option value="ไม่อนุมัติ">❌ ไม่อนุมัติ</option>
            </select>
          </div>

          <div className="role-field">
            <label>เดือนเกิดของสมาชิก</label>
            <select
              className="role-select"
              value={filters.birth_month}
              onChange={(e) => setFilters({ ...filters, birth_month: e.target.value })}
            >
              <option value="all">ทุกเดือนเกิด</option>
              {THAI_MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  เดือน{m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="role-field">
            <label>แต้มสะสมขั้นต่ำ (แต้ม)</label>
            <input
              type="number"
              min="0"
              className="role-input"
              placeholder="เช่น 50"
              value={filters.min_points}
              onChange={(e) => setFilters({ ...filters, min_points: e.target.value })}
            />
          </div>

          <div className="role-field">
            <button type="submit" className="role-btn warning" style={{ width: "100%", height: "40px" }}>
              <Search size={16} />
              ค้นหาตามเงื่อนไข
            </button>
          </div>
        </div>
      </form>

      {/* ตารางรายการอนุมัติจัดส่งของขวัญ */}
      <div className="role-card">
        <div className="role-card-header">
          <h2>
            <Gift size={20} color="#d97706" />
            รายการขอรับและจัดส่งของขวัญเทศกาลปีใหม่ & วันเกิด ({gifts.length} รายการ)
          </h2>
        </div>

        <div className="role-table-wrap">
          {loading ? (
            <p style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
              กำลังโหลดข้อมูลการจัดส่งของขวัญ...
            </p>
          ) : gifts.length === 0 ? (
            <p style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
              ไม่พบรายการของขวัญตามเงื่อนไขที่ค้นหา
            </p>
          ) : (
            <table className="role-table">
              <thead>
                <tr>
                  <th>รหัสรายการ</th>
                  <th>ข้อมูลลูกค้าสมาชิก</th>
                  <th>วันเกิดสมาชิก</th>
                  <th>เทศกาล / ของขวัญ</th>
                  <th>แต้มสะสม</th>
                  <th>ที่อยู่สำหรับจัดส่งของขวัญ</th>
                  <th>สถานะ / เลขพัสดุ</th>
                  <th style={{ textAlign: "center" }}>การอนุมัติ (เจ้าของร้าน)</th>
                </tr>
              </thead>
              <tbody>
                {gifts.map((g) => (
                  <tr key={g.gift_id}>
                    <td>
                      <strong style={{ color: "#b45309", fontSize: "13px" }}>{g.gift_no}</strong>
                      <div style={{ fontSize: "11px", color: "#94a3b8" }}>{formatDate(g.created_at)}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>{g.member_name}</div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>
                        @{g.username} {g.phone ? `• โทร ${g.phone}` : ""}
                      </div>
                    </td>
                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "13px" }}>
                        <Calendar size={14} color="#db2777" />
                        {formatDate(g.birth_date)}
                      </span>
                    </td>
                    <td>
                      <span
                        className="status-pill"
                        style={{
                          background: g.gift_type === "วันเกิด" ? "#fce7f3" : "#fef3c7",
                          color: g.gift_type === "วันเกิด" ? "#be185d" : "#b45309",
                          border: g.gift_type === "วันเกิด" ? "1px solid #fbcfe8" : "1px solid #fde68a",
                          marginBottom: 4,
                        }}
                      >
                        {g.gift_type === "วันเกิด" ? "🎂 วันเกิด" : "🎄 เทศกาลปีใหม่"}
                      </span>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>{g.gift_item}</div>
                    </td>
                    <td>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontWeight: 800,
                          color: "#059669",
                          background: "#ecfdf5",
                          padding: "4px 10px",
                          borderRadius: 999,
                          fontSize: 12,
                        }}
                      >
                        <Award size={14} />
                        {g.member_points || 0} แต้ม
                      </span>
                    </td>
                    <td style={{ maxWidth: 260 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 5, fontSize: "13px", color: "#334155" }}>
                        <MapPin size={15} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
                        <span>{g.shipping_address}</span>
                      </div>
                      {g.note && (
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: 4 }}>หมายเหตุ: {g.note}</div>
                      )}
                    </td>
                    <td>
                      <span className={`status-pill ${getStatusClass(g.status)}`}>{g.status}</span>
                      {g.tracking_no && (
                        <div style={{ fontSize: "12px", color: "#2563eb", fontWeight: 700, marginTop: 4 }}>
                          📦 {g.tracking_no}
                        </div>
                      )}
                      {g.approved_by && (
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: 2 }}>
                          โดย: {g.approved_by}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
                        {g.status === "รออนุมัติ" && (
                          <button
                            type="button"
                            className="role-btn success sm"
                            onClick={() => handleQuickApprove(g, "อนุมัติแล้ว")}
                            title="อนุมัติการจัดส่งของขวัญทันที"
                          >
                            <CheckCircle2 size={14} />
                            อนุมัติจัดส่ง
                          </button>
                        )}
                        {g.status === "อนุมัติแล้ว" && (
                          <button
                            type="button"
                            className="role-btn primary sm"
                            onClick={() => handleQuickApprove(g, "จัดส่งสำเร็จ")}
                            title="บันทึกว่าจัดส่งสำเร็จแล้ว"
                          >
                            <Truck size={14} />
                            ส่งสำเร็จ
                          </button>
                        )}
                        <button
                          type="button"
                          className="role-btn outline sm"
                          onClick={() => openApproveModal(g, g.status === "รออนุมัติ" ? "อนุมัติแล้ว" : g.status)}
                        >
                          ตั้งค่า/เลขพัสดุ
                        </button>
                        <button
                          type="button"
                          className="role-btn danger sm"
                          onClick={() => handleDelete(g)}
                          title="ลบรายการ"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal: อนุมัติและจัดการเลขพัสดุของขวัญ */}
      {selectedGift && (
        <div className="role-modal-backdrop" onClick={() => setSelectedGift(null)}>
          <div className="role-modal" onClick={(e) => e.stopPropagation()}>
            <div className="role-modal-header">
              <h3>
                <Gift size={20} color="#d97706" />
                พิจารณาอนุมัติจัดส่งของขวัญ ({selectedGift.gift_no})
              </h3>
              <button type="button" className="role-btn outline sm" onClick={() => setSelectedGift(null)}>
                <X size={16} />
              </button>
            </div>
            <form className="role-modal-body" onSubmit={handleApproveSubmit}>
              <div
                style={{
                  background: "#fffbeb",
                  border: "1px solid #fde68a",
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 16,
                  fontSize: 13,
                }}
              >
                <div>
                  <strong>ลูกค้าสมาชิก:</strong> {selectedGift.member_name} (@{selectedGift.username})
                </div>
                <div>
                  <strong>วันเกิด:</strong> {formatDate(selectedGift.birth_date)} |{" "}
                  <strong>แต้มสะสม:</strong> {selectedGift.member_points} แต้ม
                </div>
                <div>
                  <strong>ที่อยู่จัดส่ง:</strong> {selectedGift.shipping_address}
                </div>
              </div>

              <div className="role-form-grid">
                <div className="role-field">
                  <label>ผลการพิจารณาอนุมัติ *</label>
                  <select
                    className="role-select"
                    value={approveForm.status}
                    onChange={(e) => setApproveForm({ ...approveForm, status: e.target.value })}
                  >
                    <option value="อนุมัติแล้ว">✅ อนุมัติการจัดส่งของขวัญ</option>
                    <option value="จัดส่งสำเร็จ">🚚 จัดส่งของขวัญสำเร็จแล้ว</option>
                    <option value="รออนุมัติ">⏳ รออนุมัติ</option>
                    <option value="ไม่อนุมัติ">❌ ไม่อนุมัติ</option>
                  </select>
                </div>

                <div className="role-field">
                  <label>หมายเลขพัสดุ (Tracking Number)</label>
                  <input
                    type="text"
                    className="role-input"
                    placeholder="เช่น TH-EMS-12345678"
                    value={approveForm.tracking_no}
                    onChange={(e) => setApproveForm({ ...approveForm, tracking_no: e.target.value })}
                  />
                </div>
              </div>

              <div className="role-field" style={{ marginTop: 14 }}>
                <label>รายการของขวัญที่จัดส่ง *</label>
                <input
                  type="text"
                  className="role-input"
                  value={approveForm.gift_item}
                  onChange={(e) => setApproveForm({ ...approveForm, gift_item: e.target.value })}
                  required
                />
              </div>

              <div className="role-field" style={{ marginTop: 14 }}>
                <label>หมายเหตุจากเจ้าของร้าน</label>
                <textarea
                  rows={3}
                  className="role-textarea"
                  placeholder="ระบุข้อความอวยพรปีใหม่/วันเกิด หรือหมายเหตุการจัดส่ง..."
                  value={approveForm.note}
                  onChange={(e) => setApproveForm({ ...approveForm, note: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
                <button type="button" className="role-btn outline" onClick={() => setSelectedGift(null)}>
                  ยกเลิก
                </button>
                <button type="submit" className="role-btn success" disabled={submitting}>
                  <CheckCircle2 size={16} />
                  {submitting ? "กำลังบันทึก..." : "บันทึกการอนุมัติ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: สร้างรายการจัดส่งของขวัญใหม่ */}
      {isCreateOpen && (
        <div className="role-modal-backdrop" onClick={() => setIsCreateOpen(false)}>
          <div className="role-modal" onClick={(e) => e.stopPropagation()}>
            <div className="role-modal-header">
              <h3>
                <Sparkles size={20} color="#d97706" />
                สร้างรายการจัดส่งของขวัญปีใหม่ / วันเกิดให้สมาชิก
              </h3>
              <button type="button" className="role-btn outline sm" onClick={() => setIsCreateOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <form className="role-modal-body" onSubmit={handleCreateSubmit}>
              <div className="role-field" style={{ marginBottom: 14 }}>
                <label>เลือกดึงข้อมูลจากรายชื่อลูกค้าสมาชิกในระบบ (ถ้ามี)</label>
                <select
                  className="role-select"
                  value={createForm.username}
                  onChange={(e) => handleSelectMemberForGift(e.target.value)}
                >
                  <option value="">-- เลือกสมาชิกเพื่อดึงวันเกิดและที่อยู่อัตโนมัติ --</option>
                  {members.map((m) => (
                    <option key={m.username} value={m.username}>
                      {m.name} (@{m.username}) — แต้มสะสม {m.points} แต้ม
                    </option>
                  ))}
                </select>
              </div>

              <div className="role-form-grid">
                <div className="role-field">
                  <label>ชื่อ-นามสกุล สมาชิกผู้รับ *</label>
                  <input
                    type="text"
                    className="role-input"
                    value={createForm.member_name}
                    onChange={(e) => setCreateForm({ ...createForm, member_name: e.target.value })}
                    required
                  />
                </div>
                <div className="role-field">
                  <label>เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    className="role-input"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  />
                </div>
                <div className="role-field">
                  <label>วันเดือนปีเกิด</label>
                  <input
                    type="date"
                    className="role-input"
                    value={createForm.birth_date}
                    onChange={(e) => setCreateForm({ ...createForm, birth_date: e.target.value })}
                  />
                </div>
                <div className="role-field">
                  <label>ประเภทเทศกาลของขวัญ *</label>
                  <select
                    className="role-select"
                    value={createForm.gift_type}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        gift_type: e.target.value,
                        gift_item:
                          e.target.value === "วันเกิด"
                            ? "เซ็ตของขวัญสุขสันต์วันเกิดสมาชิก (Birthday Special Box)"
                            : "กระเช้าของขวัญพรีเมียมเทศกาลปีใหม่ 2027",
                      })
                    }
                  >
                    <option value="เทศกาลปีใหม่">🎄 เทศกาลปีใหม่</option>
                    <option value="วันเกิด">🎂 วันเกิดสมาชิก</option>
                  </select>
                </div>
              </div>

              <div className="role-field" style={{ marginTop: 14 }}>
                <label>ชื่อชุดของขวัญ *</label>
                <input
                  type="text"
                  className="role-input"
                  value={createForm.gift_item}
                  onChange={(e) => setCreateForm({ ...createForm, gift_item: e.target.value })}
                  required
                />
              </div>

              <div className="role-field" style={{ marginTop: 14 }}>
                <label>ที่อยู่สำหรับจัดส่งของขวัญ *</label>
                <textarea
                  rows={3}
                  className="role-textarea"
                  placeholder="บ้านเลขที่ ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์"
                  value={createForm.shipping_address}
                  onChange={(e) => setCreateForm({ ...createForm, shipping_address: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
                <button type="button" className="role-btn outline" onClick={() => setIsCreateOpen(false)}>
                  ยกเลิก
                </button>
                <button type="submit" className="role-btn warning" disabled={submitting}>
                  <Gift size={16} />
                  {submitting ? "กำลังบันทึก..." : "บันทึกและอนุมัติของขวัญ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
