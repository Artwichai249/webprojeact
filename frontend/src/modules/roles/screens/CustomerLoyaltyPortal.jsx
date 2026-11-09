// src/modules/roles/screens/CustomerLoyaltyPortal.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  Gift,
  Calendar,
  MapPin,
  ShoppingBag,
  CheckCircle2,
  Clock,
  Truck,
  History,
  RefreshCw,
  Send,
  Phone,
  User,
  Wallet,
  Plus,
  X,
} from "lucide-react";
import {
  getMyLoyaltyInfo,
  updateMyLoyaltyProfile,
  requestMemberGift,
  topupUserWallet,
} from "../../../api/roleSystemApi";
import { useAuth } from "../../auth/AuthContext";
import "./RoleSystem.css";

export default function CustomerLoyaltyPortal() {
  const { user, token, updateCurrentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    nisit_id: "",
    username: user?.username || "",
    member_name: user?.name || "",
    phone: "",
    points: 0,
    total_spent: 0,
    wallet_balance: 0,
    birth_date: "",
    gift_address: "",
    newyear_gift_opt_in: true,
    birthday_gift_opt_in: true,
  });

  const [pointHistory, setPointHistory] = useState([]);
  const [gifts, setGifts] = useState([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [requestingGift, setRequestingGift] = useState(false);
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState("300");
  const [isTopupLoading, setIsTopupLoading] = useState(false);

  useEffect(() => {
    loadLoyaltyData();
  }, []);

  async function loadLoyaltyData() {
    setLoading(true);
    const res = await getMyLoyaltyInfo(token);
    if (res && !res.error) {
      if (res.profile) setProfile(res.profile);
      setPointHistory(res.point_history || []);
      setGifts(res.gifts || []);
    }
    setLoading(false);
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profile.birth_date) {
      alert("กรุณาระบุวันเดือนปีเกิดของท่าน");
      return;
    }
    if (!profile.gift_address || !profile.gift_address.trim()) {
      alert("กรุณาระบุที่อยู่สำหรับจัดส่งของขวัญเทศกาลปีใหม่และวันเกิด");
      return;
    }

    setSavingProfile(true);
    const res = await updateMyLoyaltyProfile(
      {
        ...profile,
        create_gift_requests: true,
      },
      token
    );
    setSavingProfile(false);

    if (res && !res.error) {
      alert(res.message || "บันทึกวันเกิดและที่อยู่รับของขวัญสำเร็จ!");
      loadLoyaltyData();
    } else {
      alert(res?.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  const handleRequestExtraGift = async (giftType) => {
    if (!profile.birth_date || !profile.gift_address?.trim()) {
      alert("กรุณากรอกและบันทึกวันเกิดพร้อมที่อยู่จัดส่งของขวัญด้านซ้ายมือก่อนส่งคำขอรับของขวัญ");
      return;
    }
    setRequestingGift(true);
    const res = await requestMemberGift(
      {
        gift_type: giftType,
        note: `สมาชิก (@${profile.username}) แจ้งขอรับของขวัญ${giftType}ประจำปี`,
      },
      token
    );
    setRequestingGift(false);

    if (res && !res.error) {
      alert(res.message);
      loadLoyaltyData();
    } else {
      alert(res?.error || "ไม่สามารถส่งคำขอรับของขวัญได้");
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

  const handleTopupSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(topupAmount);
    if (isNaN(amt) || amt <= 0) {
      alert("กรุณาระบุจำนวนเงินที่ถูกต้อง (มากกว่า 0)");
      return;
    }
    setIsTopupLoading(true);
    const res = await topupUserWallet(amt, "เติมเงินเข้าบัญชีลูกค้า (Customer Wallet Top-Up)", token);
    setIsTopupLoading(false);
    if (res && !res.error) {
      alert(res.message || "เติมเงินเข้าบัญชีสำเร็จ!");
      if (res.new_balance !== undefined) {
        setProfile((prev) => ({ ...prev, wallet_balance: res.new_balance }));
        if (updateCurrentUser) {
          updateCurrentUser({ wallet_balance: res.new_balance });
        }
      }
      setShowTopupModal(false);
      loadLoyaltyData();
    } else {
      alert(res?.error || "ไม่สามารถเติมเงินได้");
    }
  };

  return (
    <div className="role-page">
      {/* Hero Banner */}
      <div className="role-hero loyalty-theme">
        <div className="role-hero-left">
          <div className="role-hero-icon">
            <Award size={28} />
          </div>
          <div>
            <div className="role-hero-title">
              <h1>ระบบสิทธิพิเศษลูกค้า / สมาชิก (Member Loyalty & Gifts)</h1>
              <span className="role-badge-tag">ลูกค้า / สมาชิก</span>
            </div>
            <p className="role-hero-subtitle">
              สะสมแต้มจากการซื้อสินค้า (ซื้อทุก 50 บาท ได้รับ 5 แต้ม) แจ้งวันเกิดและที่อยู่รับของขวัญปีใหม่/วันเกิด และตรวจสอบยอดแต้มสะสมคงเหลือ
            </p>
          </div>
        </div>

        <div className="role-hero-actions">
          <button type="button" className="role-btn outline" onClick={loadLoyaltyData}>
            <RefreshCw size={16} />
            อัปเดตยอดแต้ม
          </button>
          <Link to="/shop" className="role-btn primary" style={{ background: "#0f172a" }}>
            <ShoppingBag size={16} />
            เลือกซื้อสินค้าสะสมแต้ม (50฿ = 5 แต้ม)
          </Link>
        </div>
      </div>

      {/* ข้อ 5: บัตรตรวจสอบยอดแต้มสะสมคงเหลือและยอดเงินในบัญชี */}
      <div className="role-stats-grid">
        {/* ยอดเงินในบัญชีของฉัน (Customer Wallet Balance) */}
        <div
          className="role-stat-card"
          style={{
            background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
            borderColor: "#bfdbfe",
          }}
        >
          <div className="role-stat-info">
            <span style={{ color: "#1e40af", fontWeight: 600 }}>ยอดเงินในบัญชีของฉัน (กระเป๋าเงิน)</span>
            <strong style={{ color: "#1d4ed8", fontSize: 30 }}>
              ฿{Number(profile.wallet_balance !== undefined ? profile.wallet_balance : (user?.wallet_balance || 0)).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
            </strong>
            <button
              type="button"
              onClick={() => setShowTopupModal(true)}
              style={{
                marginTop: "6px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 12px",
                borderRadius: "6px",
                border: "none",
                background: "#2563eb",
                color: "white",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                width: "fit-content",
              }}
            >
              <Plus size={13} />
              เติมเงินเข้าบัญชี
            </button>
          </div>
          <div className="role-stat-icon" style={{ background: "#2563eb", color: "#ffffff" }}>
            <Wallet size={26} />
          </div>
        </div>

        <div
          className="role-stat-card"
          style={{
            background: "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)",
            borderColor: "#fecdd3",
          }}
        >
          <div className="role-stat-info">
            <span style={{ color: "#9f1239" }}>ยอดแต้มสะสมคงเหลือของฉัน</span>
            <strong style={{ color: "#be123c", fontSize: 32 }}>
              {Number(profile.points || 0).toLocaleString()} แต้ม
            </strong>
            <small style={{ color: "#e11d48" }}>ซื้อครบทุก 50 บาท ได้รับ 5 แต้มทันที</small>
          </div>
          <div className="role-stat-icon" style={{ background: "#f43f5e", color: "#ffffff" }}>
            <Award size={26} />
          </div>
        </div>

        <div className="role-stat-card">
          <div className="role-stat-info">
            <span>ยอดซื้อสินค้าสะสมทั้งหมด</span>
            <strong style={{ color: "#0f172a" }}>
              ฿{Number(profile.total_spent || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
            </strong>
            <small>สมาชิก: {profile.member_name || user?.name}</small>
          </div>
          <div className="role-stat-icon" style={{ background: "#dbeafe", color: "#2563eb" }}>
            <ShoppingBag size={24} />
          </div>
        </div>

        <div className="role-stat-card">
          <div className="role-stat-info">
            <span>วันเกิดที่แจ้งไว้ในระบบ</span>
            <strong style={{ fontSize: 20, color: "#be185d" }}>
              {profile.birth_date ? formatDate(profile.birth_date) : "ยังไม่ได้แจ้งวันเกิด"}
            </strong>
            <small>สำหรับรับของขวัญวันเกิดประจำปี</small>
          </div>
          <div className="role-stat-icon" style={{ background: "#fce7f3", color: "#db2777" }}>
            <Calendar size={24} />
          </div>
        </div>

        <div className="role-stat-card">
          <div className="role-stat-info">
            <span>สถานะของขวัญปีใหม่ & วันเกิด</span>
            <strong style={{ color: "#15803d" }}>{gifts.length} รายการ</strong>
            <small>
              อนุมัติแล้ว{" "}
              {gifts.filter((g) => g.status === "อนุมัติแล้ว" || g.status === "จัดส่งสำเร็จ").length} รายการ
            </small>
          </div>
          <div className="role-stat-icon" style={{ background: "#dcfce7", color: "#16a34a" }}>
            <Gift size={24} />
          </div>
        </div>
      </div>

      {/* โซนหลัก 2 คอลัมน์: แจ้งวันเกิด & ที่อยู่รับของขวัญ (ข้อ 4) + สถานะของขวัญและเครื่องคำนวณแต้ม */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: 20,
          marginBottom: 24,
        }}
      >
        {/* ข้อ 4: แจ้งวันเกิด และที่อยู่จัดส่งสำหรับรับของขวัญในเทศกาลปีใหม่และวันเกิด */}
        <div className="role-card" style={{ marginBottom: 0 }}>
          <div className="role-card-header">
            <h2>
              <Gift size={20} color="#db2777" />
              แจ้งวันเกิด และที่อยู่จัดส่งของขวัญ (ปีใหม่ & วันเกิด)
            </h2>
          </div>

          <form style={{ padding: "22px" }} onSubmit={handleSaveProfile}>
            <div className="role-form-grid">
              <div className="role-field">
                <label>
                  <User size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />
                  ชื่อ - นามสกุล สมาชิกผู้รับของขวัญ *
                </label>
                <input
                  type="text"
                  className="role-input"
                  value={profile.member_name}
                  onChange={(e) => setProfile({ ...profile, member_name: e.target.value })}
                  required
                />
              </div>

              <div className="role-field">
                <label>
                  <Phone size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />
                  เบอร์โทรศัพท์ติดต่อ (10 หลัก) *
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  className="role-input"
                  placeholder="เช่น 0812345678"
                  value={profile.phone}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                    })
                  }
                  required
                />
              </div>
            </div>

            <div className="role-field" style={{ marginTop: 14 }}>
              <label>
                <Calendar size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />
                วันเดือนปีเกิดของท่าน (สำหรับจัดส่งของขวัญวันเกิด) *
              </label>
              <input
                type="date"
                className="role-input"
                value={profile.birth_date}
                onChange={(e) => setProfile({ ...profile, birth_date: e.target.value })}
                required
              />
            </div>

            <div className="role-field" style={{ marginTop: 14 }}>
              <label>
                <MapPin size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />
                ที่อยู่จัดส่งสำหรับรับของขวัญในเทศกาลปีใหม่และวันเกิด *
              </label>
              <textarea
                rows={3}
                className="role-textarea"
                placeholder="กรอกบ้านเลขที่ หมู่ ซอย ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด รหัสไปรษณีย์..."
                value={profile.gift_address}
                onChange={(e) => setProfile({ ...profile, gift_address: e.target.value })}
                required
              />
            </div>

            <div
              style={{
                background: "#fdf2f8",
                border: "1px solid #fbcfe8",
                borderRadius: 12,
                padding: 14,
                marginTop: 14,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 13, color: "#9d174d", marginBottom: 8 }}>
                เลือกเทศกาลที่ต้องการลงทะเบียนรับของขวัญฟรีสำหรับสมาชิก:
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 6 }}>
                <input
                  type="checkbox"
                  checked={profile.newyear_gift_opt_in}
                  onChange={(e) => setProfile({ ...profile, newyear_gift_opt_in: e.target.checked })}
                />
                <span>🎄 ขอรับของขวัญเทศกาลปีใหม่ (New Year Gift)</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={profile.birthday_gift_opt_in}
                  onChange={(e) => setProfile({ ...profile, birthday_gift_opt_in: e.target.checked })}
                />
                <span>🎂 ขอรับของขวัญวันเกิดสมาชิก (Birthday Gift)</span>
              </label>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
              <button
                type="submit"
                className="role-btn primary"
                style={{ background: "#db2777" }}
                disabled={savingProfile}
              >
                <CheckCircle2 size={16} />
                {savingProfile ? "กำลังบันทึก..." : "บันทึกวันเกิด & ที่อยู่รับของขวัญ"}
              </button>
            </div>
          </form>
        </div>

        {/* คอลัมน์ขวา: ติดตามสถานะการอนุมัติของขวัญจากเจ้าของร้าน */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* รายการของขวัญปีใหม่และวันเกิดของฉัน */}
          <div className="role-card" style={{ marginBottom: 0, flex: 1 }}>
            <div className="role-card-header">
              <h2>
                <Truck size={20} color="#16a34a" />
                สถานะการจัดส่งของขวัญปีใหม่ & วันเกิดของฉัน ({gifts.length})
              </h2>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  className="role-btn outline sm"
                  disabled={requestingGift}
                  onClick={() => handleRequestExtraGift("เทศกาลปีใหม่")}
                >
                  <Send size={13} />
                  ขอของขวัญปีใหม่
                </button>
                <button
                  type="button"
                  className="role-btn outline sm"
                  disabled={requestingGift}
                  onClick={() => handleRequestExtraGift("วันเกิด")}
                >
                  <Send size={13} />
                  ขอของขวัญวันเกิด
                </button>
              </div>
            </div>

            <div style={{ padding: "16px 20px" }}>
              {gifts.length === 0 ? (
                <p style={{ color: "#64748b", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
                  ยังไม่มีรายการขอรับของขวัญ กรุณาบันทึกวันเกิดและที่อยู่จัดส่งด้านซ้ายมือ
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {gifts.map((g) => (
                    <div
                      key={g.gift_id}
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: 12,
                        padding: 14,
                        background: "#f8fafc",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong style={{ fontSize: 14, color: "#0f172a" }}>
                          {g.gift_type === "วันเกิด" ? "🎂 ของขวัญวันเกิด" : "🎄 ของขวัญเทศกาลปีใหม่"} (
                          {g.gift_no})
                        </strong>
                        <span
                          className={`status-pill ${
                            g.status === "อนุมัติแล้ว"
                              ? "approved"
                              : g.status === "จัดส่งสำเร็จ"
                              ? "shipped"
                              : g.status === "ไม่อนุมัติ"
                              ? "rejected"
                              : "pending"
                          }`}
                        >
                          {g.status}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: "#334155", marginTop: 4 }}>{g.gift_item}</div>
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                        จัดส่งไปที่: {g.shipping_address}
                      </div>
                      {g.tracking_no && (
                        <div style={{ fontSize: 12, color: "#2563eb", fontWeight: 700, marginTop: 4 }}>
                          📦 เลขพัสดุ: {g.tracking_no} (อนุมัติโดย: {g.approved_by || "เจ้าของร้าน"})
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ข้อ 5: ตารางประวัติการสะสมแต้มจากการซื้อสินค้า */}
      <div className="role-card">
        <div className="role-card-header">
          <h2>
            <History size={20} color="#db2777" />
            ประวัติการสะสมแต้มจากการซื้อสินค้าของฉัน ({pointHistory.length} รายการ)
          </h2>
        </div>

        <div className="role-table-wrap">
          {loading ? (
            <p style={{ textAlign: "center", padding: "32px", color: "#64748b" }}>
              กำลังโหลดประวัติแต้มสะสม...
            </p>
          ) : pointHistory.length === 0 ? (
            <p style={{ textAlign: "center", padding: "32px", color: "#64748b" }}>
              ยังไม่มีประวัติการสะสมแต้ม เมื่อท่านสั่งซื้อสินค้าครบทุก 50 บาท จะได้รับ 5 แต้มโดยอัตโนมัติ
            </p>
          ) : (
            <table className="role-table">
              <thead>
                <tr>
                  <th>วันที่ทำรายการ</th>
                  <th>เลขที่บิล / อ้างอิง</th>
                  <th>ช่องทางการซื้อ</th>
                  <th>ยอดซื้อสินค้า</th>
                  <th>แต้มที่ได้รับ (50฿ = 5 แต้ม)</th>
                  <th>ยอดแต้มสะสมคงเหลือ</th>
                  <th>หมายเหตุ</th>
                </tr>
              </thead>
              <tbody>
                {pointHistory.map((h) => (
                  <tr key={h.history_id}>
                    <td>{formatDate(h.created_at)}</td>
                    <td>
                      <strong>{h.reference_no}</strong>
                    </td>
                    <td>{h.channel}</td>
                    <td>
                      <strong>฿{Number(h.purchase_amount || 0).toFixed(2)}</strong>
                    </td>
                    <td>
                      <span
                        style={{
                          fontWeight: 800,
                          color: "#15803d",
                          background: "#dcfce7",
                          padding: "4px 10px",
                          borderRadius: 999,
                          fontSize: 12,
                        }}
                      >
                        +{h.points_change} แต้ม
                      </span>
                    </td>
                    <td style={{ fontWeight: 800, color: "#be123c" }}>{h.points_balance} แต้ม</td>
                    <td style={{ fontSize: 12, color: "#64748b" }}>{h.note || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal เติมเงินเข้าบัญชีของฉัน */}
      {showTopupModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16,
          }}
          onClick={() => setShowTopupModal(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "24px",
              maxWidth: "460px",
              width: "100%",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Wallet size={20} color="#2563eb" />
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#1e293b" }}>
                  เติมเงินเข้าบัญชีของฉัน
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTopupModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleTopupSubmit}>
              <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "16px" }}>
                <div style={{ fontSize: "13px", color: "#64748b" }}>ยอดเงินคงเหลือในบัญชีปัจจุบัน:</div>
                <div style={{ fontSize: "22px", fontWeight: 800, color: "#2563eb", fontFamily: "monospace", marginTop: "4px" }}>
                  ฿{Number(profile.wallet_balance !== undefined ? profile.wallet_balance : (user?.wallet_balance || 0)).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  เลือกหรือระบุจำนวนเงินที่ต้องการเติม (บาท) <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "18px",
                    fontWeight: 700,
                    boxSizing: "border-box",
                  }}
                  required
                />

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginTop: "10px" }}>
                  {[100, 300, 500, 1000, 1500, 2000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTopupAmount(String(amt))}
                      style={{
                        padding: "8px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        background: topupAmount === String(amt) ? "#2563eb" : "#f1f5f9",
                        color: topupAmount === String(amt) ? "#ffffff" : "#334155",
                        fontWeight: 700,
                        fontSize: "13px",
                        cursor: "pointer",
                      }}
                    >
                      +{amt} ฿
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button
                  type="button"
                  onClick={() => setShowTopupModal(false)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#475569",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isTopupLoading}
                  style={{
                    flex: 2,
                    padding: "10px",
                    borderRadius: "8px",
                    border: "none",
                    background: "#2563eb",
                    color: "#ffffff",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {isTopupLoading ? "กำลังทำรายการ..." : "ยืนยันเติมเงินทันที"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
