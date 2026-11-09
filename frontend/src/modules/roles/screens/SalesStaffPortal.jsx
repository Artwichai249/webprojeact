// src/modules/roles/screens/SalesStaffPortal.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  UserPlus,
  Search,
  Award,
  ShoppingCart,
  Calendar,
  MapPin,
  Phone,
  History,
  CheckCircle2,
  RefreshCw,
  Filter,
  X,
} from "lucide-react";
import {
  getSalesStaffMembers,
  registerMemberBySalesStaff,
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

export default function SalesStaffPortal() {
  const { token } = useAuth();

  // แท็บ: "search" (ค้นหาสมาชิกและตรวจสอบแต้มสะสม) | "register" (บันทึกสมัครสมาชิกใหม่)
  const [activeTab, setActiveTab] = useState("search");

  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);

  // เงื่อนไขค้นหาข้อมูลสมาชิก
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    min_points: "",
    birth_month: "all",
  });

  // Modal ดูรายละเอียดแต้มสะสมและประวัติแต้มรายบุคคล
  const [selectedMember, setSelectedMember] = useState(null);

  // ฟอร์มบันทึกสมัครสมาชิกใหม่ (3.3 บันทึกสมัครสมาชิกใหม่)
  const [regForm, setRegForm] = useState({
    nisit_id: "",
    name: "",
    username: "",
    password: "",
    phone: "",
    birth_date: "",
    gift_address: "",
    initial_points: "0",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadMembers();
  }, [filters.status, filters.birth_month]);

  async function loadMembers(customFilters = filters) {
    setLoading(true);
    const data = await getSalesStaffMembers(customFilters, token);
    if (Array.isArray(data)) {
      setMembers(data);
    }
    setLoading(false);
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadMembers(filters);
  };

  const handleResetFilters = () => {
    const reset = {
      search: "",
      status: "all",
      min_points: "",
      birth_month: "all",
    };
    setFilters(reset);
    loadMembers(reset);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const cleanPhone = (regForm.phone || "").replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      alert("กรุณากรอกเบอร์โทรศัพท์เป็นตัวเลข 10 หลัก (เช่น 0812345678)");
      return;
    }

    setSubmitting(true);
    const res = await registerMemberBySalesStaff(
      { ...regForm, phone: cleanPhone },
      token
    );
    setSubmitting(false);

    if (res && !res.error) {
      alert(
        `บันทึกสมัครสมาชิกใหม่สำเร็จ!\nชื่อ: ${res.member?.name}\nUsername: @${res.member?.username}\nแต้มเริ่มต้น: ${res.member?.points || 0} แต้ม`
      );
      setRegForm({
        nisit_id: "",
        name: "",
        username: "",
        password: "",
        phone: "",
        birth_date: "",
        gift_address: "",
        initial_points: "0",
      });
      setActiveTab("search");
      loadMembers();
    } else {
      alert(res?.error || "เกิดข้อผิดพลาดในการสมัครสมาชิกใหม่");
    }
  };

  const totalPointsAll = members.reduce((sum, m) => sum + (Number(m.points) || 0), 0);
  const totalSpentAll = members.reduce((sum, m) => sum + (Number(m.total_spent) || 0), 0);

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

  return (
    <div className="role-page">
      {/* Hero Banner */}
      <div className="role-hero sales-theme">
        <div className="role-hero-left">
          <div className="role-hero-icon">
            <Users size={28} />
          </div>
          <div>
            <div className="role-hero-title">
              <h1>ระบบพนักงานขาย (Sales Staff)</h1>
              <span className="role-badge-tag">พนักงานขาย</span>
            </div>
            <p className="role-hero-subtitle">
              ค้นหาข้อมูลสมาชิก ตรวจสอบแต้มสะสมคงเหลือ (ซื้อ 50 บาท ได้รับ 5 แต้ม) และบันทึกสมัครสมาชิกใหม่
            </p>
          </div>
        </div>

        <div className="role-hero-actions">
          <Link to="/sales" className="role-btn outline">
            <ShoppingCart size={16} />
            เปิดหน้าคิดเงินขายสินค้า (POS)
          </Link>
          <button
            type="button"
            className="role-btn primary"
            style={{ background: "#0f172a" }}
            onClick={() => setActiveTab(activeTab === "search" ? "register" : "search")}
          >
            {activeTab === "search" ? (
              <>
                <UserPlus size={16} />
                บันทึกสมัครสมาชิกใหม่
              </>
            ) : (
              <>
                <Search size={16} />
                กลับหน้าค้นหาสมาชิก & แต้มสะสม
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="role-tabs">
        <button
          type="button"
          className={`role-tab-btn ${activeTab === "search" ? "active" : ""}`}
          onClick={() => setActiveTab("search")}
        >
          <Search size={16} />
          1. ค้นหาข้อมูลสมาชิก & ตรวจสอบแต้มสะสม ({members.length} คน)
        </button>
        <button
          type="button"
          className={`role-tab-btn ${activeTab === "register" ? "active" : ""}`}
          onClick={() => setActiveTab("register")}
        >
          <UserPlus size={16} />
          2. บันทึกสมัครสมาชิกใหม่ (ลงทะเบียนลูกค้าหน้าร้าน)
        </button>
      </div>

      {activeTab === "search" ? (
        <>
          {/* Summary Stats */}
          <div className="role-stats-grid">
            <div className="role-stat-card">
              <div className="role-stat-info">
                <span>จำนวนสมาชิกที่พบ</span>
                <strong>{members.length}</strong>
                <small>บัญชีสมาชิกในระบบ</small>
              </div>
              <div className="role-stat-icon" style={{ background: "#d1fae5", color: "#059669" }}>
                <Users size={24} />
              </div>
            </div>

            <div className="role-stat-card">
              <div className="role-stat-info">
                <span>แต้มสะสมรวมทั้งหมด</span>
                <strong style={{ color: "#059669" }}>{totalPointsAll.toLocaleString()} แต้ม</strong>
                <small>อัตรา: ซื้อทุก 50 บาท รับ 5 แต้ม</small>
              </div>
              <div className="role-stat-icon" style={{ background: "#fef3c7", color: "#d97706" }}>
                <Award size={24} />
              </div>
            </div>

            <div className="role-stat-card">
              <div className="role-stat-info">
                <span>ยอดซื้อสะสมของสมาชิก</span>
                <strong style={{ color: "#2563eb" }}>
                  ฿{totalSpentAll.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                </strong>
                <small>รวมทุกช่องทางการซื้อ</small>
              </div>
              <div className="role-stat-icon" style={{ background: "#dbeafe", color: "#2563eb" }}>
                <ShoppingCart size={24} />
              </div>
            </div>
          </div>

          {/* ค้นหาข้อมูลสมาชิกตามเงื่อนไข */}
          <form className="role-filter-card" onSubmit={handleSearchSubmit}>
            <div className="role-filter-header">
              <h3>
                <Filter size={17} color="#059669" />
                ค้นหาข้อมูลสมาชิกและตรวจสอบแต้มสะสม
              </h3>
              <button type="button" className="role-btn outline sm" onClick={handleResetFilters}>
                ล้างตัวกรอง
              </button>
            </div>

            <div className="role-filter-grid">
              <div className="role-field">
                <label>ค้นหาสมาชิก (รหัสสมาชิก / ชื่อ-นามสกุล / Username / เบอร์โทรศัพท์)</label>
                <input
                  type="text"
                  className="role-input"
                  placeholder="พิมพ์ชื่อ, รหัสสมาชิก, เบอร์โทร 10 หลัก..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>

              <div className="role-field">
                <label>แต้มสะสมขั้นต่ำ</label>
                <input
                  type="number"
                  min="0"
                  className="role-input"
                  placeholder="เช่น 20"
                  value={filters.min_points}
                  onChange={(e) => setFilters({ ...filters, min_points: e.target.value })}
                />
              </div>

              <div className="role-field">
                <label>เดือนเกิดสมาชิก</label>
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
                <label>สถานะบัญชี</label>
                <select
                  className="role-select"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <option value="all">ทั้งหมด</option>
                  <option value="ใช้งาน">ใช้งาน</option>
                  <option value="ไม่ใช้งาน">ไม่ใช้งาน</option>
                </select>
              </div>

              <div className="role-field">
                <button type="submit" className="role-btn success" style={{ width: "100%", height: "40px" }}>
                  <Search size={16} />
                  ค้นหาสมาชิก
                </button>
              </div>
            </div>
          </form>

          {/* ตารางข้อมูลสมาชิกและแต้มสะสม */}
          <div className="role-card">
            <div className="role-card-header">
              <h2>
                <Award size={20} color="#059669" />
                รายชื่อสมาชิกและยอดแต้มสะสมคงเหลือ ({members.length} รายการ)
              </h2>
              <button type="button" className="role-btn outline sm" onClick={() => loadMembers()}>
                <RefreshCw size={14} />
                รีเฟรช
              </button>
            </div>

            <div className="role-table-wrap">
              {loading ? (
                <p style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                  กำลังโหลดข้อมูลสมาชิกและแต้มสะสม...
                </p>
              ) : members.length === 0 ? (
                <p style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                  ไม่พบข้อมูลสมาชิกตามเงื่อนไขที่ค้นหา
                </p>
              ) : (
                <table className="role-table">
                  <thead>
                    <tr>
                      <th>รหัสสมาชิก</th>
                      <th>ชื่อ-นามสกุล / Username</th>
                      <th>เบอร์โทรศัพท์</th>
                      <th>วันเกิดสมาชิก</th>
                      <th>ยอดซื้อสะสม</th>
                      <th>แต้มสะสมคงเหลือ</th>
                      <th style={{ textAlign: "right" }}>ยอดเงินในบัญชีลูกค้า (฿)</th>
                      <th>ที่อยู่จัดส่งของขวัญ</th>
                      <th style={{ textAlign: "center" }}>ตรวจสอบแต้ม</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => (
                      <tr key={m.username || m.nisit_id}>
                        <td>
                          <strong style={{ color: "#0f766e" }}>{m.nisit_id}</strong>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: "#0f172a" }}>{m.name}</div>
                          <div style={{ fontSize: "12px", color: "#64748b" }}>@{m.username}</div>
                        </td>
                        <td>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "13px" }}>
                            <Phone size={13} color="#64748b" />
                            {m.phone || "-"}
                          </span>
                        </td>
                        <td>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "13px" }}>
                            <Calendar size={13} color="#db2777" />
                            {formatDate(m.birth_date)}
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: "#334155" }}>
                            ฿{Number(m.total_spent || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                          </strong>
                        </td>
                        <td>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              background: "#ecfdf5",
                              color: "#047857",
                              border: "1px solid #a7f3d0",
                              padding: "5px 12px",
                              borderRadius: 999,
                              fontWeight: 800,
                              fontSize: 13,
                            }}
                          >
                            <Award size={15} />
                            {Number(m.points || 0).toLocaleString()} แต้ม
                          </span>
                        </td>
                        <td style={{ textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "#1d4ed8" }}>
                          ฿{Number(m.wallet_balance || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ maxWidth: 220 }}>
                          {m.gift_address ? (
                            <span style={{ fontSize: "12px", color: "#334155" }}>{m.gift_address}</span>
                          ) : (
                            <span style={{ fontSize: "12px", color: "#94a3b8" }}>ยังไม่ระบุที่อยู่</span>
                          )}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            type="button"
                            className="role-btn outline sm"
                            onClick={() => setSelectedMember(m)}
                          >
                            <History size={14} />
                            ดูประวัติแต้ม
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      ) : (
        /* ฟอร์มบันทึกสมัครสมาชิกใหม่โดยพนักงานขาย */
        <div className="role-card" style={{ maxWidth: 760, margin: "0 auto" }}>
          <div className="role-card-header">
            <h2>
              <UserPlus size={20} color="#059669" />
              แบบฟอร์มบันทึกสมัครสมาชิกใหม่ (สำหรับพนักงานขาย)
            </h2>
          </div>

          <form style={{ padding: "24px" }} onSubmit={handleRegisterSubmit}>
            <div className="role-form-grid">
              <div className="role-field">
                <label>รหัสสมาชิก (หากไม่ระบุ ระบบจะสร้างให้อัตโนมัติ)</label>
                <input
                  type="text"
                  className="role-input"
                  placeholder="เช่น 6612345678"
                  value={regForm.nisit_id}
                  onChange={(e) => setRegForm({ ...regForm, nisit_id: e.target.value })}
                />
              </div>

              <div className="role-field">
                <label>ชื่อ - นามสกุล ลูกค้าสมาชิก *</label>
                <input
                  type="text"
                  className="role-input"
                  placeholder="กรอกชื่อ-นามสกุลจริง"
                  value={regForm.name}
                  onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="role-field">
                <label>ชื่อผู้ใช้ (Username) สำหรับเข้าสู่ระบบ *</label>
                <input
                  type="text"
                  className="role-input"
                  placeholder="เช่น somchai99"
                  value={regForm.username}
                  onChange={(e) => setRegForm({ ...regForm, username: e.target.value })}
                  required
                />
              </div>

              <div className="role-field">
                <label>รหัสผ่านเริ่มต้น (Password) *</label>
                <input
                  type="password"
                  className="role-input"
                  placeholder="อย่างน้อย 4 ตัวอักษร"
                  value={regForm.password}
                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                  required
                />
              </div>

              <div className="role-field">
                <label>เบอร์โทรศัพท์ (ตัวเลข 10 หลัก) *</label>
                <input
                  type="tel"
                  maxLength={10}
                  className="role-input"
                  placeholder="เช่น 0812345678"
                  value={regForm.phone}
                  onChange={(e) =>
                    setRegForm({
                      ...regForm,
                      phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                    })
                  }
                  required
                />
              </div>

              <div className="role-field">
                <label>วันเดือนปีเกิด (สำหรับรับของขวัญวันเกิด)</label>
                <input
                  type="date"
                  className="role-input"
                  value={regForm.birth_date}
                  onChange={(e) => setRegForm({ ...regForm, birth_date: e.target.value })}
                />
              </div>
            </div>

            <div className="role-field" style={{ marginTop: 16 }}>
              <label>ที่อยู่จัดส่งสำหรับรับของขวัญเทศกาลปีใหม่และวันเกิด</label>
              <textarea
                rows={3}
                className="role-textarea"
                placeholder="ระบุบ้านเลขที่ หมู่ ซอย ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์..."
                value={regForm.gift_address}
                onChange={(e) => setRegForm({ ...regForm, gift_address: e.target.value })}
              />
            </div>

            <div className="role-field" style={{ marginTop: 16, maxWidth: 260 }}>
              <label>คะแนนสะสมต้อนรับเริ่มต้น (แต้ม)</label>
              <input
                type="number"
                min="0"
                className="role-input"
                value={regForm.initial_points}
                onChange={(e) => setRegForm({ ...regForm, initial_points: e.target.value })}
              />
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button type="submit" className="role-btn success" disabled={submitting}>
                <CheckCircle2 size={16} />
                {submitting ? "กำลังบันทึก..." : "ยืนยันบันทึกสมัครสมาชิกใหม่"}
              </button>
              <button
                type="button"
                className="role-btn outline"
                onClick={() => setActiveTab("search")}
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal ตรวจสอบรายละเอียดและประวัติแต้มสะสมของสมาชิก */}
      {selectedMember && (
        <div className="role-modal-backdrop" onClick={() => setSelectedMember(null)}>
          <div className="role-modal" onClick={(e) => e.stopPropagation()}>
            <div className="role-modal-header">
              <h3>
                <Award size={20} color="#059669" />
                ข้อมูลแต้มสะสมของ {selectedMember.name} (@{selectedMember.username})
              </h3>
              <button type="button" className="role-btn outline sm" onClick={() => setSelectedMember(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="role-modal-body">
              <div
                style={{
                  background: "linear-gradient(135deg, #065f46, #059669)",
                  color: "#fff",
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 18,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 12, opacity: 0.85 }}>รหัสสมาชิก: {selectedMember.nisit_id}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>{selectedMember.name}</div>
                  <div style={{ fontSize: 13, opacity: 0.9, marginTop: 4 }}>
                    วันเกิด: {formatDate(selectedMember.birth_date)} | โทร: {selectedMember.phone}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, opacity: 0.9 }}>ยอดแต้มสะสมคงเหลือ</div>
                  <div style={{ fontSize: 32, fontWeight: 900 }}>{selectedMember.points} แต้ม</div>
                  <div style={{ fontSize: 13, background: "rgba(255,255,255,0.2)", padding: "3px 8px", borderRadius: 6, marginTop: 4 }}>
                    ยอดเงินในบัญชีลูกค้า: <strong>฿{Number(selectedMember.wallet_balance || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</strong>
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>
                    ยอดซื้อสะสม ฿{Number(selectedMember.total_spent || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 14, fontSize: 13 }}>
                <strong>
                  <MapPin size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
                  ที่อยู่จัดส่งของขวัญปีใหม่/วันเกิด:
                </strong>{" "}
                {selectedMember.gift_address || "ยังไม่ได้แจ้งที่อยู่"}
              </div>

              <h4 style={{ margin: "14px 0 8px", fontSize: 15 }}>
                ประวัติการได้รับแต้มสะสม (ซื้อ 50 บาท ได้รับ 5 แต้ม)
              </h4>

              {!selectedMember.point_history || selectedMember.point_history.length === 0 ? (
                <p style={{ color: "#64748b", fontSize: 13, padding: "16px 0" }}>
                  ยังไม่มีประวัติการทำรายการสะสมแต้ม
                </p>
              ) : (
                <div className="role-table-wrap">
                  <table className="role-table">
                    <thead>
                      <tr>
                        <th>วันที่</th>
                        <th>อ้างอิง / ช่องทาง</th>
                        <th>ยอดซื้อ (บาท)</th>
                        <th>แต้มที่ได้รับ</th>
                        <th>คงเหลือ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedMember.point_history.map((h) => (
                        <tr key={h.history_id}>
                          <td>{formatDate(h.created_at)}</td>
                          <td>
                            <strong>{h.reference_no}</strong>
                            <div style={{ fontSize: 11, color: "#64748b" }}>{h.channel}</div>
                          </td>
                          <td>฿{Number(h.purchase_amount || 0).toFixed(2)}</td>
                          <td style={{ color: "#059669", fontWeight: 800 }}>+{h.points_change} แต้ม</td>
                          <td>{h.points_balance} แต้ม</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
