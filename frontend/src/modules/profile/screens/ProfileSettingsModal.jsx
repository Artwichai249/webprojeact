// src/modules/profile/screens/ProfileSettingsModal.jsx
import { useState, useEffect } from "react";
import {
  UserCog,
  X,
  User,
  Phone,
  Lock,
  Calendar,
  MapPin,
  Gift,
  Award,
  CheckCircle2,
  AlertCircle,
  Save,
  Shield,
  CreditCard,
  Cake,
  Sparkles,
  Wallet,
  Plus,
} from "lucide-react";
import { getUserProfile, updateUserProfile } from "../../../api/profileApi";
import { topupUserWallet } from "../../../api/roleSystemApi";
import { useAuth } from "../../auth/AuthContext";
import "./ProfileSettingsModal.css";

export default function ProfileSettingsModal({ isOpen = true, onClose, isPage = false }) {
  const { user, token, updateCurrentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    nisit_id: "",
    username: "",
    name: "",
    phone: "",
    password: "",
    role: "",
    status: "ใช้งาน",
    birth_date: "",
    gift_address: "",
    points: 0,
    total_spent: 0,
    wallet_balance: 0,
    newyear_gift_opt_in: true,
    birthday_gift_opt_in: true,
  });

  // Top-up Modal/Inline State
  const [showTopup, setShowTopup] = useState(false);
  const [topupAmount, setTopupAmount] = useState("500");
  const [topupLoading, setTopupLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadProfile();
    }
  }, [isOpen]);

  async function loadProfile() {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    const data = await getUserProfile(token);
    if (data && !data.error) {
      setFormData({
        nisit_id: data.nisit_id || user?.id || "",
        username: data.username || user?.username || "",
        name: data.name || user?.name || "",
        phone: data.phone || user?.phone || "",
        password: "",
        role: data.role || "",
        status: data.status || "ใช้งาน",
        birth_date: data.birth_date ? data.birth_date.slice(0, 10) : "",
        gift_address: data.gift_address || "",
        points: data.points || 0,
        total_spent: data.total_spent || 0,
        wallet_balance: Number(data.wallet_balance || 0),
        newyear_gift_opt_in: data.newyear_gift_opt_in !== false,
        birthday_gift_opt_in: data.birthday_gift_opt_in !== false,
      });
      if (updateCurrentUser) {
        updateCurrentUser({ wallet_balance: Number(data.wallet_balance || 0) });
      }
    } else {
      setErrorMsg(data?.error || "ไม่สามารถโหลดข้อมูลส่วนบุคคลได้");
    }
    setLoading(false);
  }

  const handleTopup = async (e) => {
    e.preventDefault();
    const amt = parseFloat(topupAmount);
    if (isNaN(amt) || amt <= 0) {
      alert("กรุณาระบุจำนวนเงินที่ต้องการเติม");
      return;
    }
    setTopupLoading(true);
    const res = await topupUserWallet({ amount: amt }, token);
    setTopupLoading(false);
    if (res && !res.error) {
      alert(`เติมเงินเข้าบัญชีสำเร็จ ฿${amt.toLocaleString()} บาท!`);
      setShowTopup(false);
      loadProfile();
    } else {
      alert(res?.error || "เกิดข้อผิดพลาดในการเติมเงิน");
    }
  };

  const getRoleLabel = (username, fullName = "") => {
    const u = (username || "").trim().toLowerCase();
    const n = (fullName || "").trim().toLowerCase();

    // 1. ตรวจสอบตามชื่อจริงในฐานข้อมูล
    if (n.includes("เจ้าของ")) return "เจ้าของร้าน (Owner)";
    if (n.includes("ผู้จัดการ")) return "ผู้จัดการ (Manager)";
    if (n.includes("พนักงานขาย") || n.includes("ขาย")) return "พนักงานขาย (Sales Staff)";
    if (n.includes("สต็อก") || n.includes("สต๊อก") || n.includes("คลัง")) return "คลังสินค้า/สต็อก (Warehouse)";

    // 2. ตรวจสอบตามรหัสบัญชีในฐานข้อมูล
    if (u === "admin1") return "เจ้าของร้าน (Owner)";
    if (u === "admin2") return "พนักงานขาย (Sales Staff)";
    if (u === "admin3") return "คลังสินค้า/สต็อก (Warehouse)";
    if (u === "admin4") return "ผู้จัดการ (Manager)";
    return "ลูกค้า / สมาชิก (Member)";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!formData.name.trim()) {
      setErrorMsg("กรุณากรอกชื่อ - นามสกุล");
      return;
    }

    if (formData.phone) {
      const clean = formData.phone.replace(/\D/g, "");
      if (clean.length !== 10) {
        setErrorMsg("เบอร์โทรศัพท์ติดต่อต้องเป็นตัวเลข 10 หลัก");
        return;
      }
    }

    if (formData.password && formData.password.trim().length > 0 && formData.password.trim().length < 4) {
      setErrorMsg("รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.replace(/\D/g, "").slice(0, 10),
        password: formData.password ? formData.password.trim() : undefined,
        birth_date: formData.birth_date || null,
        gift_address: formData.gift_address ? formData.gift_address.trim() : "",
        newyear_gift_opt_in: formData.newyear_gift_opt_in,
        birthday_gift_opt_in: formData.birthday_gift_opt_in,
      };

      const res = await updateUserProfile(payload, token);
      if (res && !res.error) {
        setSuccessMsg("บันทึกการตั้งค่าข้อมูลส่วนบุคคลสำเร็จเรียบร้อยแล้ว");
        updateCurrentUser({
          name: payload.name,
          phone: payload.phone,
        });
        setFormData((prev) => ({ ...prev, password: "" }));
        // ซ่อนข้อความแจ้งเตือนสำเร็จหลัง 4 วินาที
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        setErrorMsg(res?.error || "ไม่สามารถบันทึกข้อมูลส่วนบุคคลได้");
      }
    } catch (err) {
      setErrorMsg("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen && !isPage) return null;

  const content = (
    <div className={`profileSettingsCard ${isPage ? "isPageMode" : ""}`}>
      {/* ส่วนหัวหน้าต่าง */}
      <div className="profileModalHeader">
        <div className="profileTitleWrap">
          <div className="profileTitleIcon">
            <UserCog size={24} />
          </div>
          <div>
            <h2>ตั้งค่าข้อมูลส่วนบุคคล</h2>
            <p>จัดการข้อมูลส่วนตัว บัญชีผู้ใช้งาน และที่อยู่สำหรับจัดส่งของขวัญ/สินค้า</p>
          </div>
        </div>
        {!isPage && onClose && (
          <button
            type="button"
            className="profileCloseBtn"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {loading ? (
        <div className="profileLoadingWrap">
          <div className="profileSpinner" />
          <span>กำลังโหลดข้อมูลส่วนบุคคล...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="profileForm">
          {/* การ์ดสรุปบัญชีและระดับสิทธิ์ */}
          <div className="profileUserHero">
            <div className="profileHeroAvatar">
              {(formData.name || formData.username || "U").charAt(0).toUpperCase()}
            </div>
            <div className="profileHeroInfo">
              <div className="profileHeroNameRow">
                <h3>{formData.name || formData.username}</h3>
                <span className="profileRoleBadge">
                  <Shield size={12} />
                  {getRoleLabel(formData.username, formData.name)}
                </span>
              </div>
              <div className="profileHeroMeta">
                <span>
                  <strong>Username:</strong> @{formData.username}
                </span>
                <span>•</span>
                <span>
                  <strong>รหัสสมาชิก:</strong> {formData.nisit_id || "-"}
                </span>
                <span>•</span>
                <span className="profilePointsTag">
                  <Award size={13} color="#d97706" />
                  <strong>แต้มสะสม:</strong> {formData.points} แต้ม
                </span>
                <span>•</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: "#dbeafe", color: "#1e40af", padding: "3px 10px", borderRadius: "8px", fontWeight: "700" }}>
                  <Wallet size={13} />
                  <strong>ยอดเงินในบัญชี:</strong> ฿{Number(formData.wallet_balance || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท
                </span>
                <button
                  type="button"
                  onClick={() => setShowTopup(!showTopup)}
                  style={{ background: "#2563eb", color: "#fff", border: "none", padding: "3px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "600", cursor: "pointer" }}
                >
                  {showTopup ? "ปิด" : "+ เติมเงิน"}
                </button>
                <span>•</span>
                <span>
                  <strong>ยอดซื้อสะสม:</strong> {formData.total_spent.toLocaleString()} บาท
                </span>
              </div>
            </div>
          </div>

          {/* กล่องเติมเงินเข้าบัญชี (Top-up Wallet Box) */}
          {showTopup && (
            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "12px", padding: "14px 18px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <strong style={{ color: "#1e40af", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Wallet size={16} /> เติมเงินเข้าบัญชีผู้ใช้งาน (@{formData.username})
                </strong>
                <button
                  type="button"
                  onClick={() => setShowTopup(false)}
                  style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", fontSize: "16px" }}
                >
                  ✕
                </button>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                {["100", "300", "500", "1000", "2000"].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setTopupAmount(val)}
                    style={{
                      padding: "5px 12px",
                      borderRadius: "6px",
                      border: topupAmount === val ? "2px solid #2563eb" : "1px solid #cbd5e1",
                      background: topupAmount === val ? "#dbeafe" : "#ffffff",
                      color: topupAmount === val ? "#1e40af" : "#334155",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    + ฿{val}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="จำนวนเงินที่ต้องการเติม (บาท)"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  style={{ flex: 1, padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px" }}
                />
                <button
                  type="button"
                  onClick={handleTopup}
                  disabled={topupLoading}
                  style={{ background: "#16a34a", color: "white", border: "none", padding: "8px 18px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
                >
                  {topupLoading ? "กำลังทำรายการ..." : "ยืนยันเติมเงิน"}
                </button>
              </div>
            </div>
          )}

          {/* กล่องแจ้งเตือนสถานะ */}
          {successMsg && (
            <div className="profileAlert success">
              <CheckCircle2 size={18} />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="profileAlert error">
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* กลุ่มฟิลด์ข้อมูลส่วนตัว */}
          <div className="profileFormGrid">
            {/* ชื่อ - นามสกุล */}
            <div className="profileField">
              <label>
                <User size={15} />
                <span>ชื่อ - นามสกุล *</span>
              </label>
              <input
                type="text"
                placeholder="เช่น สมชาย ใจดี"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {/* เบอร์โทรศัพท์ติดต่อ */}
            <div className="profileField">
              <label>
                <Phone size={15} />
                <span>เบอร์โทรศัพท์ติดต่อ (10 หลัก) *</span>
              </label>
              <input
                type="tel"
                maxLength={10}
                placeholder="เช่น 0812345678"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                  })
                }
                required
              />
              {formData.phone && formData.phone.length !== 10 && (
                <small className="fieldErrorHint">
                  * ต้องครบ 10 หลัก (ปัจจุบันมี {formData.phone.length}/10)
                </small>
              )}
            </div>

            {/* ชื่อผู้ใช้ (อ่านอย่างเดียว) */}
            <div className="profileField">
              <label>
                <Shield size={15} />
                <span>ชื่อผู้ใช้งาน (Username)</span>
              </label>
              <input
                type="text"
                value={formData.username}
                disabled
                className="disabledField"
                title="ชื่อผู้ใช้งานไม่สามารถเปลี่ยนแปลงได้"
              />
              <small className="fieldHint">รหัสประจำตัว/บัญชีสำหรับเข้าสู่ระบบ</small>
            </div>

            {/* เปลี่ยนรหัสผ่านใหม่ */}
            <div className="profileField">
              <label>
                <Lock size={15} />
                <span>เปลี่ยนรหัสผ่านใหม่ (หากต้องการเปลี่ยน)</span>
              </label>
              <input
                type="password"
                placeholder="เว้นว่างไว้หากใช้รหัสผ่านเดิม"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <small className="fieldHint">อย่างน้อย 4 ตัวอักษร (ปล่อยว่างไว้หากไม่เปลี่ยน)</small>
            </div>
          </div>

          {/* วันเกิด & ที่อยู่รับของขวัญและจัดส่ง */}
          <div className="profileSectionDivider">
            <Gift size={16} color="#db2777" />
            <span>ข้อมูลสำหรับรับของขวัญเทศกาลปีใหม่ & วันเกิด และที่อยู่จัดส่ง</span>
          </div>

          <div className="profileFormGrid">
            {/* วันเดือนปีเกิด */}
            <div className="profileField">
              <label>
                <Cake size={15} color="#db2777" />
                <span>วันเดือนปีเกิดของท่าน</span>
              </label>
              <input
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
              />
              <small className="fieldHint">สำหรับรับสิทธิ์ของขวัญวันเกิดจากทางร้าน</small>
            </div>

            {/* การรับสิทธิ์ของขวัญ */}
            <div className="profileField">
              <label>
                <Sparkles size={15} color="#d97706" />
                <span>การรับสิทธิ์ของขวัญพิเศษ</span>
              </label>
              <div className="profileCheckboxGroup">
                <label className="profileCheckboxLabel">
                  <input
                    type="checkbox"
                    checked={formData.newyear_gift_opt_in}
                    onChange={(e) =>
                      setFormData({ ...formData, newyear_gift_opt_in: e.target.checked })
                    }
                  />
                  <span>🎁 รับของขวัญเทศกาลปีใหม่</span>
                </label>
                <label className="profileCheckboxLabel">
                  <input
                    type="checkbox"
                    checked={formData.birthday_gift_opt_in}
                    onChange={(e) =>
                      setFormData({ ...formData, birthday_gift_opt_in: e.target.checked })
                    }
                  />
                  <span>🎂 รับของขวัญวันเกิด</span>
                </label>
              </div>
            </div>
          </div>

          {/* ที่อยู่สำหรับจัดส่งสินค้าและของขวัญ */}
          <div className="profileField fullWidth">
            <label>
              <MapPin size={15} color="#2563eb" />
              <span>ที่อยู่จัดส่งสินค้า & ของขวัญ *</span>
            </label>
            <textarea
              rows={3}
              placeholder="บ้านเลขที่, ถนน/ซอย, ตำบล/แขวง, อำเภอ/เขต, จังหวัด, รหัสไปรษณีย์"
              value={formData.gift_address}
              onChange={(e) => setFormData({ ...formData, gift_address: e.target.value })}
            />
            <small className="fieldHint">
              ที่อยู่นี้จะถูกนำไปใช้จัดส่งของขวัญวันเกิด/ปีใหม่ และเป็นที่อยู่เริ่มต้นในการสั่งซื้อสินค้า
            </small>
          </div>

          {/* ปุ่มควบคุม */}
          <div className="profileFormActions">
            {!isPage && onClose && (
              <button
                type="button"
                className="profileBtn cancel"
                onClick={onClose}
                disabled={saving}
              >
                ยกเลิก
              </button>
            )}
            <button
              type="submit"
              className="profileBtn save"
              disabled={saving}
            >
              <Save size={16} />
              <span>{saving ? "กำลังบันทึกข้อมูล..." : "บันทึกการตั้งค่า"}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );

  if (isPage) {
    return <div className="profilePageWrapper">{content}</div>;
  }

  return (
    <div className="profileModalOverlay" onClick={onClose}>
      <div className="profileModalContainer" onClick={(e) => e.stopPropagation()}>
        {content}
      </div>
    </div>
  );
}
