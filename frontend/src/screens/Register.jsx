import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, RotateCcw } from "lucide-react";
import { createMember } from "../api/memberAPI";
import "./Register.css";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nisit_id: "",
    name: "",
    username: "",
    password: "",
    phone: "",
    status: "ใช้งาน",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await createMember(formData);
    if (res && !res.error) {
      alert(`สมัครสมาชิกสำเร็จ!\nชื่อ: ${formData.name}`);
      navigate("/");
    } else {
      alert(`เกิดข้อผิดพลาดในการสมัครสมาชิก: ${res?.error || "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้"}`);
    }
  };

  const handleReset = () => {
    setFormData({
      nisit_id: "",
      name: "",
      username: "",
      password: "",
      phone: "",
      status: "ใช้งาน",
    });
  };

  return (
    <div className="card-form">
      <div className="card-header">
        <UserPlus size={22} className="header-icon" />
        <h2>สมัครสมาชิก</h2>
      </div>
      <form onSubmit={handleSubmit} className="form-body">
        <div className="form-group">
          <label>รหัสนิสิต</label>
          <input
            type="text"
            name="nisit_id"
            placeholder="เช่น 6512345678 (หากไม่กรอก ระบบจะสร้างให้อัตโนมัติ)"
            value={formData.nisit_id}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>ชื่อ - นามสกุล *</label>
          <input
            type="text"
            name="name"
            placeholder="กรอกชื่อ - นามสกุล"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>ชื่อผู้ใช้ *</label>
          <input
            type="text"
            name="username"
            placeholder="กรอก username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>รหัสผ่าน *</label>
          <input
            type="password"
            name="password"
            placeholder="กรอกรหัสผ่าน"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>เบอร์โทรศัพท์ *</label>
          <input
            type="text"
            name="phone"
            placeholder="เช่น 0812345678"
            value={formData.phone}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>สถานะ *</label>
          <select name="status" value={formData.status} onChange={handleChange}>
            <option value="ใช้งาน">ใช้งาน</option>
            <option value="ไม่ใช้งาน">ไม่ใช้งาน</option>
          </select>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-submit">
            <UserPlus size={16} /> สมัครสมาชิก
          </button>
          <button type="button" className="btn-reset" onClick={handleReset}>
            <RotateCcw size={16} /> ล้างข้อมูล
          </button>
        </div>
      </form>
    </div>
  );
}
