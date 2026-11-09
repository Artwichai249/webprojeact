import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Save, X, Edit3, ShieldAlert, Lock, UserCheck } from "lucide-react";
import { getMemberById, updateMember } from "../api/memberAPI";
import { useAuth } from "../../auth/AuthContext";
import "./UpdateMember.css";

export default function UpdateMember() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, updateCurrentUser, isAdmin } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    phone: "",
    status: "ใช้งาน",
  });
  const [loading, setLoading] = useState(false);
  const [isForbidden, setIsForbidden] = useState(false);
  const [targetUsername, setTargetUsername] = useState("");

  useEffect(() => {
    if (id) {
      loadMember(id);
    }
  }, [id, user]);

  const loadMember = async (memberId) => {
    setLoading(true);
    const data = await getMemberById(memberId);
    if (data && !data.error) {
      // ตรวจสอบสิทธิ์: ผู้ดูแลระบบ (admin1-admin4) หรือเจ้าของบัญชีเท่านั้นที่แก้ไขได้
      const isOwner =
        user &&
        (user.username === data.username ||
          String(user.id) === String(data.nisit_id || data.id));
      const canEdit = isAdmin || isOwner;

      if (!canEdit) {
        setIsForbidden(true);
        setTargetUsername(data.username || "ผู้อื่น");
        setLoading(false);
        return;
      }

      setIsForbidden(false);
      setFormData({
        name: data.name || "",
        username: data.username || "",
        password: data.password || "",
        phone: data.phone || "",
        status: data.status || "ใช้งาน",
      });
    } else {
      alert("ไม่พบข้อมูลสมาชิก");
      navigate("/");
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const digits = value.replace(/\D/g, "").slice(0, 10);
      setFormData({ ...formData, phone: digits });
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const phoneDigits = (formData.phone || "").replace(/\D/g, "");
    if (phoneDigits.length !== 10) {
      alert("เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลักเท่านั้น (เช่น 0812345678)");
      return;
    }
    if (id) {
      const res = await updateMember(id, { ...formData, phone: phoneDigits });
      if (res && !res.error) {
        // อัปเดตข้อมูลผู้ใช้ใน Context ทันที (หากมีการเปลี่ยนชื่อ หรือ username)
        if (updateCurrentUser) {
          updateCurrentUser({
            name: formData.name,
            username: formData.username,
          });
        }
        alert("บันทึกการแก้ไขข้อมูลสำเร็จ!");
        navigate("/");
      } else {
        alert(`เกิดข้อผิดพลาด: ${res?.error || "ไม่สามารถแก้ไขข้อมูลได้"}`);
      }
    } else {
      navigate("/");
    }
  };

  // กรณีไม่มีสิทธิ์แก้ไข (ไม่ใช่บัญชีของ username ที่ล็อกอินอยู่)
  if (isForbidden) {
    return (
      <div className="update-modal" style={{ maxWidth: 480 }}>
        <div
          className="modal-header"
          style={{ backgroundColor: "#fff1f2", borderBottom: "1px solid #fecaca" }}
        >
          <div className="modal-title" style={{ color: "#be123c" }}>
            <ShieldAlert size={20} />
            <h3>ไม่มีสิทธิ์แก้ไขข้อมูลสมาชิกนี้</h3>
          </div>
          <button className="btn-close" onClick={() => navigate("/")}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: "28px 24px", textAlign: "center" }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              backgroundColor: "#fee2e2",
              color: "#e11d48",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <Lock size={26} />
          </div>
          <h4 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>
            แก้ไขได้เฉพาะบัญชีของคุณที่ใช้ Login เท่านั้น
          </h4>
          <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.6, marginBottom: "22px" }}>
            คุณกำลังพยายามแก้ไขบัญชี <strong>"{targetUsername}"</strong> ซึ่งไม่ใช่บัญชีที่คุณใช้เข้าสู่ระบบ (คุณ Login ในชื่อ <strong>"{user?.username}"</strong>)
          </p>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn-cancel"
              onClick={() => navigate("/")}
              style={{ padding: "8px 18px", borderRadius: "8px" }}
            >
              กลับหน้ารายการสมาชิก
            </button>
            {user?.id && (
              <button
                type="button"
                className="btn-save"
                onClick={() => navigate(`/update/${user.id}`)}
                style={{
                  padding: "8px 18px",
                  borderRadius: "8px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <UserCheck size={16} /> แก้ไขบัญชีของฉัน (@{user.username})
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="update-modal">
      <div className="modal-header">
        <div className="modal-title">
          <Edit3 size={18} />
          <h3>แก้ไขข้อมูลสมาชิก</h3>
          {user && (
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: "9999px",
                backgroundColor: "#ccfbf1",
                color: "#0f766e",
                border: "1px solid #99f6e4",
              }}
            >
              บัญชีของคุณ (@{user.username})
            </span>
          )}
        </div>
        <button className="btn-close" onClick={() => navigate("/")}>
          <X size={18} />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="modal-body">
        <div className="form-grid">
          <div className="form-group">
            <label>ชื่อ - นามสกุล *</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>เบอร์โทรศัพท์ (ตัวเลข 10 หลัก) *</label>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              name="phone"
              placeholder="เช่น 0812345678"
              value={formData.phone}
              onChange={handleChange}
              required
            />
            {formData.phone && formData.phone.length !== 10 && (
              <small style={{ color: "#ef4444", fontSize: "11px", display: "block", marginTop: "4px" }}>
                * ต้องเป็นตัวเลขครบ 10 หลัก (ปัจจุบันมี {formData.phone.length}/10 หลัก)
              </small>
            )}
          </div>
          <div className="form-group">
            <label>ชื่อผู้ใช้ (Username) *</label>
            <input type="text" name="username" value={formData.username} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>สถานะ *</label>
            <select name="status" value={formData.status} onChange={handleChange}>
              <option value="ใช้งาน">ใช้งาน</option>
              <option value="ไม่ใช้งาน">ไม่ใช้งาน</option>
            </select>
          </div>
          <div className="form-group full-width">
            <label>รหัสผ่าน (เว้นว่างไว้หากไม่ต้องการเปลี่ยน)</label>
            <input
              type="password"
              name="password"
              placeholder="กรอกรหัสผ่านใหม่หากต้องการเปลี่ยน"
              value={formData.password}
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="modal-actions">
          <button type="submit" className="btn-save">
            <Save size={16} /> บันทึก
          </button>
          <button type="button" className="btn-cancel" onClick={() => navigate("/")}>
            ยกเลิก
          </button>
        </div>
      </form>
    </div>
  );
}
