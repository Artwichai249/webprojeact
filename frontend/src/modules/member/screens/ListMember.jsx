// src/modules/member/screens/ListMember.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMembers, deleteMember } from "../api/memberAPI";
import {
  getMemberLoyaltyDetails,
  adjustMemberPoints,
  approveOwnerGift,
  resetAllMemberPoints,
} from "../../../api/roleSystemApi";
import { useAuth } from "../../auth/AuthContext";
import {
  UserCheck,
  ShieldCheck,
  RefreshCw,
  PlusCircle,
  Package,
  Crown,
  Search,
  Pencil,
  Trash2,
  X,
  User,
  Award,
  Gift,
  Calendar,
  MapPin,
  Phone,
  History,
  Truck,
  CheckCircle2,
  Sparkles,
  Plus,
  RotateCcw,
} from "lucide-react";
import "./ListMember.css";

export default function ListMember() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("ทั้งหมด");

  // State สำหรับ Modal ตรวจสอบระบบสะสมแต้มและของขวัญสมาชิก
  const [selectedMember, setSelectedMember] = useState(null);
  const [loyaltyData, setLoyaltyData] = useState(null);
  const [loadingLoyalty, setLoadingLoyalty] = useState(false);

  // ปรับแต้มพิเศษ / แลกแต้ม
  const [showAdjustPoints, setShowAdjustPoints] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [submittingAdjust, setSubmittingAdjust] = useState(false);
  const [resettingPoints, setResettingPoints] = useState(false);

  useEffect(() => {
    if (user) {
      loadMembers();
    }
  }, [user]);

  async function loadMembers() {
    setIsLoading(true);
    try {
      const data = await getMembers();
      if (Array.isArray(data)) {
        const colors = [
          { bg: "#ccfbf1", text: "#0f766e" },
          { bg: "#ede9fe", text: "#6d28d9" },
          { bg: "#fef3c7", text: "#b45309" },
          { bg: "#e0f2fe", text: "#0369a1" },
          { bg: "#dcfce7", text: "#15803d" },
        ];
        const mapped = data.map((item, idx) => {
          const nameParts = (item.name || "").split(" ");
          const initials =
            nameParts.map((p) => p.charAt(0)).join("").slice(0, 2) ||
            (item.username || "สม").slice(0, 2);
          const colorObj = colors[idx % colors.length];
          return {
            ...item,
            status: item.status || "ใช้งาน",
            avatarStyle: { backgroundColor: colorObj.bg, color: colorObj.text },
            initials: initials,
          };
        });
        setMembers(mapped);
      }
    } catch (err) {
      console.error("API Error:", err);
    } finally {
      setIsLoading(false);
    }
  }

  // เปิดดู Modal ตรวจสอบระบบสะสมแต้มและของขวัญของสมาชิก
  const handleOpenLoyaltyModal = async (memberItem) => {
    setSelectedMember(memberItem);
    setShowAdjustPoints(false);
    setAdjustAmount("");
    setAdjustReason("");
    setLoadingLoyalty(true);

    const data = await getMemberLoyaltyDetails(memberItem.username, token);
    if (data && !data.error) {
      setLoyaltyData(data);
    } else {
      setLoyaltyData({
        profile: {
          username: memberItem.username,
          member_name: memberItem.name,
          nisit_id: memberItem.nisit_id || memberItem.id,
          phone: memberItem.phone,
          points: Number(memberItem.points || 0),
          total_spent: Number(memberItem.total_spent || 0),
          birth_date: memberItem.birth_date || "",
          gift_address: memberItem.gift_address || "",
        },
        point_history: [],
        gifts: [],
      });
    }
    setLoadingLoyalty(false);
  };

  // ปรับแต้มสะสม
  const handleAdjustPointsSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMember || !adjustAmount) return;
    const num = parseInt(adjustAmount, 10);
    if (isNaN(num) || num === 0) {
      alert("กรุณาระบุจำนวนแต้มที่ต้องการปรับ (สามารถใส่เลขบวกหรือลบได้)");
      return;
    }

    setSubmittingAdjust(true);
    const res = await adjustMemberPoints(
      selectedMember.username,
      {
        points_change: num,
        reason: adjustReason || (num > 0 ? "แต้มพิเศษจากเจ้าหน้าที่" : "หักแลกของรางวัล"),
      },
      token
    );
    setSubmittingAdjust(false);

    if (res && !res.error) {
      alert(res.message);
      setAdjustAmount("");
      setAdjustReason("");
      setShowAdjustPoints(false);
      // โหลดข้อมูลใหม่ทั้งใน modal และตารางหลัก
      const updated = await getMemberLoyaltyDetails(selectedMember.username, token);
      if (updated && !updated.error) setLoyaltyData(updated);
      loadMembers();
    } else {
      alert(res?.error || "เกิดข้อผิดพลาดในการปรับแต้ม");
    }
  };

  // อนุมัติของขวัญด่วนจากใน Modal ตรวจสอบ
  const handleQuickApproveGift = async (giftId) => {
    if (!window.confirm("ยืนยันอนุมัติการจัดส่งของขวัญชิ้นนี้ใช่หรือไม่?")) return;
    const res = await approveOwnerGift(giftId, { status: "อนุมัติแล้ว" }, token);
    if (res && !res.error) {
      alert("อนุมัติของขวัญสำเร็จ!");
      if (selectedMember) {
        const updated = await getMemberLoyaltyDetails(selectedMember.username, token);
        if (updated && !updated.error) setLoyaltyData(updated);
      }
    } else {
      alert(res?.error || "ไม่สามารถอนุมัติได้");
    }
  };

  const handleResetAllPoints = async () => {
    const confirmReset = window.confirm(
      "คำเตือน: คุณต้องการรีเซ็ตแต้มสะสมของสมาชิกทุกคนเป็น 0 แต้ม และล้างประวัติความเคลื่อนไหวแต้มทั้งหมดใช่หรือไม่?"
    );
    if (!confirmReset) return;

    setResettingPoints(true);
    try {
      const res = await resetAllMemberPoints(token);
      if (res && !res.error) {
        alert("รีเซ็ตแต้มสะสมของสมาชิกทุกคนเป็น 0 สำเร็จเรียบร้อยแล้ว");
        await loadMembers();
      } else {
        alert(res?.error || "ไม่สามารถรีเซ็ตแต้มได้");
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setResettingPoints(false);
    }
  };

  // กรองรายชื่อสมาชิกตามคำค้นหาและสถานะ
  const filteredMembers = members.filter((m) => {
    const keyword = searchText.toLowerCase();
    const matchesSearch =
      (m.name && m.name.toLowerCase().includes(keyword)) ||
      (m.username && m.username.toLowerCase().includes(keyword)) ||
      (String(m.nisit_id || m.id || "").toLowerCase().includes(keyword)) ||
      (m.phone && m.phone.includes(keyword));

    const matchesStatus =
      statusFilter === "ทั้งหมด" || m.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (id, name, isCurrent) => {
    const confirmMsg = isCurrent
      ? `คุณต้องการลบบัญชีตนเอง "${name}" ใช่หรือไม่?\n⚠️ การลบบัญชีจะทำให้ระบบออกจากระบบทันที`
      : `คุณต้องการลบข้อมูลสมาชิก "${name}" ใช่หรือไม่?`;

    if (window.confirm(confirmMsg)) {
      const res = await deleteMember(id);
      if (res && !res.error) {
        if (isCurrent) {
          alert("ลบบัญชีของคุณสำเร็จ กำลังนำคุณออกจากระบบ");
          await logout();
          navigate("/login");
        } else {
          alert("ลบข้อมูลสมาชิกสำเร็จ");
          setMembers((prev) => prev.filter((m) => (m.nisit_id || m.id) !== id));
        }
      } else {
        alert(`เกิดข้อผิดพลาดในการลบข้อมูล: ${res?.error || "ไม่สามารถลบได้"}`);
      }
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

  const activeCount = members.filter((m) => m.status === "ใช้งาน" || m.status === "active").length;
  const inactiveCount = members.filter((m) => m.status === "ไม่ใช้งาน").length;
  const adminUsernames = ["admin1", "admin2", "admin3", "admin4"];

  return (
    <main className="memberContainer">
      {/* ส่วนหัวแบนเนอร์และปุ่มควบคุมหลัก */}
      <section className="memberHeaderCard">
        <div className="memberTitleWrap">
          <div className="memberIconBadge">
            <ShieldCheck size={28} />
          </div>
          <div className="memberTitleInfo">
            <h1>
              ระบบจัดการสมาชิก (Member)
              <span className="memberAdminTag">
                <Crown size={12} /> Admin Only
              </span>
            </h1>
            <p>จัดการข้อมูลสมาชิก ตรวจสอบแต้มสะสม และของขวัญปีใหม่/วันเกิด (สิทธิ์เฉพาะ admin1 - admin4)</p>
          </div>
        </div>

        {/* ปุ่มลัดและช่องค้นหา */}
        <div className="memberHeaderActions">
          <div className="memberSearchBox">
            <Search size={18} className="memberSearchIcon" />
            <input
              type="text"
              className="memberSearchInput"
              placeholder="ค้นหาชื่อ, username หรือเบอร์โทร..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            {searchText && (
              <button
                type="button"
                onClick={() => setSearchText("")}
                className="memberSearchClear"
                title="ล้างข้อมูลค้นหา"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <Link to="/register" className="btnAddMember">
            <PlusCircle size={16} />
            <span>เพิ่มสมาชิกใหม่</span>
          </Link>

          <Link to="/products" className="btnProductNav" title="ไปยังระบบจัดการสินค้า">
            <Package size={16} />
            <span>ระบบสินค้า</span>
          </Link>
        </div>
      </section>

      {/* แถบตัวกรองสถานะ และปุ่มรีเฟรช */}
      <div className="memberFilterBar">
        <div className="memberFilterGroup">
          <span className="memberFilterLabel">สถานะ:</span>
          <div className="memberStatusChips">
            <button
              type="button"
              onClick={() => setStatusFilter("ทั้งหมด")}
              className={`memberChipBtn ${statusFilter === "ทั้งหมด" ? "active" : ""}`}
            >
              ทั้งหมด ({members.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("ใช้งาน")}
              className={`memberChipBtn ${statusFilter === "ใช้งาน" ? "active" : ""}`}
            >
              ใช้งาน ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("ไม่ใช้งาน")}
              className={`memberChipBtn ${statusFilter === "ไม่ใช้งาน" ? "active" : ""}`}
            >
              ไม่ใช้งาน ({inactiveCount})
            </button>
          </div>
        </div>

        <div className="memberFilterActions">
          <button
            type="button"
            onClick={handleResetAllPoints}
            disabled={resettingPoints}
            className="btnResetPoints"
            title="รีเซ็ตแต้มสะสมของสมาชิกทุกคนเป็น 0 แต้ม"
          >
            <RotateCcw size={14} className={resettingPoints ? "animate-spin" : ""} />
            <span>{resettingPoints ? "กำลังรีเซ็ต..." : "รีเซ็ตแต้มทั้งหมด"}</span>
          </button>

          <button type="button" onClick={loadMembers} className="btnRefresh">
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            <span>รีเฟรชข้อมูล</span>
          </button>
        </div>
      </div>

      {/* แถบแจ้งเตือนสิทธิ์ Admin */}
      <div className="memberNoticeBanner">
        <Crown size={16} color="#d97706" style={{ flexShrink: 0 }} />
        <span>
          <strong>ระบบสิทธิ์การเข้าถึง:</strong> บัญชีผู้ดูแลระบบ <strong>(admin1, admin2, admin3, admin4)</strong> สามารถตรวจสอบแต้มสะสมและของขวัญของสมาชิกได้โดยกดปุ่ม <strong>"ตรวจสอบ"</strong> ในตาราง
        </span>
      </div>

      {/* ตารางแสดงข้อมูลสมาชิก */}
      <div className="memberTableCard">
        <div className="memberTableWrap">
          <table className="memberTable">
            <thead>
              <tr>
                <th style={{ width: "50px", textAlign: "center" }}>ลำดับ</th>
                <th>รหัสนิสิต</th>
                <th>ชื่อ - นามสกุล</th>
                <th>Username</th>
                <th style={{ textAlign: "center" }}>แต้มสะสม</th>
                <th style={{ textAlign: "right" }}>ยอดเงินในบัญชี (฿)</th>
                <th>ระดับสิทธิ์</th>
                <th>เบอร์โทรศัพท์</th>
                <th style={{ textAlign: "center" }}>สถานะ</th>
                <th style={{ textAlign: "center", width: "240px" }}>จัดการ / ตรวจสอบ</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                    กำลังโหลดข้อมูลสมาชิก...
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                    ไม่พบข้อมูลสมาชิกที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              ) : (
                filteredMembers.map((item, index) => {
                  const targetId = item.nisit_id || item.id;
                  const isCurrent =
                    user &&
                    (user.username === item.username ||
                      String(user.id) === String(targetId));
                  const isMemberAdmin = adminUsernames.includes(item.username?.toLowerCase());

                  return (
                    <tr
                      key={targetId || index}
                      className={isCurrent ? "memberRowCurrent" : ""}
                    >
                      <td style={{ textAlign: "center", fontWeight: 700, color: "#64748b" }}>
                        {index + 1}
                      </td>
                      <td style={{ fontWeight: 700, color: "#334155", fontFamily: "monospace" }}>
                        {item.nisit_id}
                      </td>
                      <td>
                        <div className="memberUserCol">
                          <div
                            className="memberAvatar"
                            style={item.avatarStyle}
                          >
                            {item.initials || "สม"}
                          </div>
                          <div>
                            <span className="memberName">{item.name}</span>
                            {isCurrent && (
                              <span className="memberCurrentBadge">
                                <UserCheck size={11} /> คุณ
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ fontFamily: "monospace" }}>
                        <span style={{ fontWeight: isMemberAdmin ? 700 : 500, color: isMemberAdmin ? "#b45309" : "#475569" }}>
                          @{item.username}
                        </span>
                      </td>
                      {/* คอลัมน์แต้มสะสม */}
                      <td style={{ textAlign: "center" }}>
                        <span className="memberPointsBadge">
                          <Award size={13} />
                          {Number(item.points || 0).toLocaleString()} แต้ม
                        </span>
                      </td>
                      {/* คอลัมน์ยอดเงินในบัญชีลูกค้า */}
                      <td style={{ textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "#1d4ed8" }}>
                        ฿{Number(item.wallet_balance || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        {isMemberAdmin ? (
                          <span className="memberRoleBadge admin">
                            <Crown size={12} /> Admin
                          </span>
                        ) : (
                          <span className="memberRoleBadge user">
                            <User size={12} /> สมาชิก
                          </span>
                        )}
                      </td>
                      <td style={{ fontFamily: "monospace", color: "#475569" }}>
                        {item.phone || "-"}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {item.status === "ใช้งาน" || item.status === "active" || item.status === "ปกติ" ? (
                          <span className="memberStatusBadge active">
                            <span className="memberStatusDot" />
                            ใช้งาน
                          </span>
                        ) : (
                          <span className="memberStatusBadge inactive">
                            <span className="memberStatusDot" />
                            ไม่ใช้งาน
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <div className="memberActions">
                          {/* ปุ่มตรวจสอบระบบสะสมแต้มและของขวัญ */}
                          <button
                            type="button"
                            className="btnCheckLoyalty"
                            onClick={() => handleOpenLoyaltyModal(item)}
                            title="ตรวจสอบระบบสะสมแต้มและของขวัญสมาชิก"
                          >
                            <Gift size={13} />
                            <span>ตรวจสอบ</span>
                          </button>

                          <Link
                            to={`/members/update/${targetId}`}
                            className="btnEditMember"
                            title="แก้ไขข้อมูลสมาชิก"
                          >
                            <Pencil size={13} />
                            <span>แก้ไข</span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(targetId, item.name, isCurrent)}
                            className="btnDeleteMember"
                            title="ลบสมาชิก"
                          >
                            <Trash2 size={13} />
                            <span>ลบ</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="memberFooter">
          <span>
            แสดงสมาชิกทั้งหมด <strong>{filteredMembers.length}</strong> รายการ
          </span>
          <span style={{ color: "#94a3b8" }}>สิทธิ์การจัดการระดับผู้ดูแลระบบ (Admin)</span>
        </div>
      </div>

      {/* Modal: ตรวจสอบระบบสะสมแต้มและของขวัญสมาชิก */}
      {selectedMember && (
        <div className="loyaltyModalBackdrop" onClick={() => setSelectedMember(null)}>
          <div className="loyaltyModal" onClick={(e) => e.stopPropagation()}>
            <div className="loyaltyModalHeader">
              <h3>
                <Gift size={20} color="#059669" />
                ตรวจสอบระบบสะสมแต้ม และของขวัญสมาชิก
              </h3>
              <button
                type="button"
                className="loyaltyModalClose"
                onClick={() => setSelectedMember(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="loyaltyModalBody">
              {loadingLoyalty ? (
                <p style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                  กำลังดึงข้อมูลแต้มสะสมและของขวัญ...
                </p>
              ) : loyaltyData ? (
                <>
                  {/* Hero Card สรุปยอดแต้มสะสม */}
                  <div className="loyaltyHeroCard">
                    <div className="loyaltyHeroLeft">
                      <h4>{loyaltyData.profile?.member_name || selectedMember.name}</h4>
                      <p>
                        @{loyaltyData.profile?.username} • รหัส: {loyaltyData.profile?.nisit_id || selectedMember.nisit_id}
                        {loyaltyData.profile?.phone ? ` • โทร ${loyaltyData.profile.phone}` : ""}
                      </p>
                    </div>
                    <div className="loyaltyHeroRight">
                      <span>ยอดแต้มสะสมคงเหลือ</span>
                      <strong>{Number(loyaltyData.profile?.points || 0).toLocaleString()} แต้ม</strong>
                      <div style={{ marginTop: "4px", fontSize: "12px", background: "rgba(255,255,255,0.2)", padding: "2px 8px", borderRadius: "4px" }}>
                        ยอดเงินในบัญชีลูกค้า: <strong>฿{Number(loyaltyData.profile?.wallet_balance || selectedMember.wallet_balance || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</strong>
                      </div>
                      <small style={{ fontSize: 11, opacity: 0.9, marginTop: "2px", display: "block" }}>
                        ยอดซื้อสะสม ฿{Number(loyaltyData.profile?.total_spent || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                      </small>
                    </div>
                  </div>

                  {/* กล่องข้อมูลวันเกิดและที่อยู่จัดส่งของขวัญ */}
                  <div className="loyaltyInfoGrid">
                    <div className="loyaltyInfoBox">
                      <div className="loyaltyInfoBoxTitle">
                        <Calendar size={14} color="#db2777" />
                        วันเกิดของสมาชิก (สำหรับของขวัญวันเกิด)
                      </div>
                      <div className="loyaltyInfoBoxValue" style={{ color: "#be185d" }}>
                        {loyaltyData.profile?.birth_date
                          ? formatDate(loyaltyData.profile.birth_date)
                          : "ยังไม่ได้ระบุวันเกิด"}
                      </div>
                    </div>

                    <div className="loyaltyInfoBox">
                      <div className="loyaltyInfoBoxTitle">
                        <MapPin size={14} color="#ef4444" />
                        ที่อยู่จัดส่งสำหรับรับของขวัญปีใหม่/วันเกิด
                      </div>
                      <div className="loyaltyInfoBoxValue">
                        {loyaltyData.profile?.gift_address || "ยังไม่ได้ระบุที่อยู่จัดส่ง"}
                      </div>
                    </div>
                  </div>

                  {/* รายการของขวัญเทศกาลปีใหม่และวันเกิด */}
                  <div className="loyaltySectionTitle">
                    <Gift size={16} color="#059669" />
                    <span>รายการขอรับและจัดส่งของขวัญ ({loyaltyData.gifts?.length || 0})</span>
                  </div>

                  {!loyaltyData.gifts || loyaltyData.gifts.length === 0 ? (
                    <p style={{ color: "#94a3b8", fontSize: 13, background: "#f8fafc", padding: 12, borderRadius: 10 }}>
                      ยังไม่มีรายการของขวัญสำหรับสมาชิกท่านนี้
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                      {loyaltyData.gifts.map((g) => (
                        <div key={g.gift_id} className="loyaltyGiftCard">
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>
                              {g.gift_type === "วันเกิด" ? "🎂 ของขวัญวันเกิด" : "🎄 ของขวัญเทศกาลปีใหม่"} ({g.gift_no})
                            </div>
                            <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>
                              {g.gift_item}
                            </div>
                            {g.tracking_no && (
                              <div style={{ fontSize: 11, color: "#2563eb", fontWeight: 700, marginTop: 2 }}>
                                📦 เลขพัสดุ: {g.tracking_no}
                              </div>
                            )}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span
                              className={`status-pill ${
                                g.status === "อนุมัติแล้ว"
                                  ? "approved"
                                  : g.status === "จัดส่งสำเร็จ"
                                  ? "shipped"
                                  : "pending"
                              }`}
                            >
                              {g.status}
                            </span>
                            {g.status === "รออนุมัติ" && (
                              <button
                                type="button"
                                className="role-btn success sm"
                                onClick={() => handleQuickApproveGift(g.gift_id)}
                              >
                                <CheckCircle2 size={13} />
                                อนุมัติ
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ประวัติการสะสมแต้มจากการซื้อสินค้า */}
                  <div className="loyaltySectionTitle">
                    <History size={16} color="#059669" />
                    <span>ประวัติการได้รับแต้ม (ซื้อ 50 บาท ได้รับ 5 แต้ม)</span>
                  </div>

                  {!loyaltyData.point_history || loyaltyData.point_history.length === 0 ? (
                    <p style={{ color: "#94a3b8", fontSize: 13, background: "#f8fafc", padding: 12, borderRadius: 10 }}>
                      ยังไม่มีประวัติการทำรายการสะสมแต้ม
                    </p>
                  ) : (
                    <div style={{ maxHeight: 180, overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: 12 }}>
                      <table className="loyaltyHistoryTable">
                        <thead>
                          <tr>
                            <th>วันที่</th>
                            <th>เลขอ้างอิง / ช่องทาง</th>
                            <th>ยอดซื้อ</th>
                            <th>แต้มที่ได้</th>
                            <th>คงเหลือ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loyaltyData.point_history.map((h) => (
                            <tr key={h.history_id}>
                              <td>{formatDate(h.created_at)}</td>
                              <td>
                                <strong>{h.reference_no}</strong>
                                <div style={{ fontSize: 11, color: "#64748b" }}>{h.channel}</div>
                              </td>
                              <td>฿{Number(h.purchase_amount || 0).toFixed(2)}</td>
                              <td style={{ color: h.points_change >= 0 ? "#059669" : "#dc2626", fontWeight: 800 }}>
                                {h.points_change >= 0 ? `+${h.points_change}` : h.points_change} แต้ม
                              </td>
                              <td style={{ fontWeight: 700 }}>{h.points_balance} แต้ม</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* ปุ่มและฟอร์มปรับแต้มสะสมโดยเจ้าหน้าที่ */}
                  <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
                    {!showAdjustPoints ? (
                      <button
                        type="button"
                        className="role-btn outline sm"
                        onClick={() => setShowAdjustPoints(true)}
                      >
                        <Plus size={13} />
                        ให้แต้มโบนัสพิเศษ / ปรับยอดแต้มสมาชิก
                      </button>
                    ) : (
                      <form onSubmit={handleAdjustPointsSubmit} style={{ background: "#f8fafc", padding: 14, borderRadius: 12, border: "1px solid #e2e8f0" }}>
                        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: "#0f172a" }}>
                          ฟอร์มปรับแต้มสะสมสมาชิก (@{selectedMember.username})
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 10 }}>
                          <div>
                            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>
                              จำนวนแต้ม (+ หรือ -) *
                            </label>
                            <input
                              type="number"
                              className="role-input"
                              placeholder="เช่น 50 หรือ -20"
                              value={adjustAmount}
                              onChange={(e) => setAdjustAmount(e.target.value)}
                              required
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>
                              เหตุผลการปรับแต้ม
                            </label>
                            <input
                              type="text"
                              className="role-input"
                              placeholder="เช่น แต้มโบนัสลูกค้าประจำ, แลกของรางวัล"
                              value={adjustReason}
                              onChange={(e) => setAdjustReason(e.target.value)}
                            />
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                          <button type="submit" className="role-btn success sm" disabled={submittingAdjust}>
                            <CheckCircle2 size={13} />
                            {submittingAdjust ? "กำลังบันทึก..." : "ยืนยันปรับแต้ม"}
                          </button>
                          <button
                            type="button"
                            className="role-btn outline sm"
                            onClick={() => setShowAdjustPoints(false)}
                          >
                            ยกเลิก
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
