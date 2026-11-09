// src/components/Navbar.jsx
import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Users,
  ShoppingBag,
  Layers,
  LogOut,
  ShoppingCart,
  TrendingUp,
  Store,
  Crown,
  Briefcase,
  UserCheck,
  Warehouse,
  Gift,
  UserCog,
  Wallet,
} from "lucide-react";
import { useAuth } from "../modules/auth/AuthContext";
import ProfileSettingsModal from "../modules/profile/screens/ProfileSettingsModal";
import InstallAppButton from "./InstallAppButton";
import "./Navbar.css";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleLogout = async () => {
    if (!window.confirm("ต้องการออกจากระบบใช่หรือไม่?")) return;
    await logout();
    navigate("/login", { replace: true });
  };

  const getRoleLabel = (username, fullName = "") => {
    const u = (username || "").trim().toLowerCase();
    const n = (fullName || (user?.name || "")).trim().toLowerCase();

    // 1. ตรวจสอบตามรหัสบัญชีในระบบ (admin1-4) ลำดับแรกเสมอ เพื่อไม่ให้บทบาทสลับกัน
    if (u === "admin1") return "เจ้าของร้าน";
    if (u === "admin2") return "พนักงานขาย";
    if (u === "admin3") return "พนักงานสต็อก";
    if (u === "admin4") return "ผู้จัดการ";

    // 2. ตรวจสอบตามชื่อ
    if (n.includes("เจ้าของ")) return "เจ้าของร้าน";
    if (n.includes("ผู้จัดการ")) return "ผู้จัดการ";
    if (n.includes("สต็อก") || n.includes("สต๊อก") || n.includes("คลัง")) return "พนักงานสต็อก";
    if (n.includes("พนักงานขาย") || n.includes("ขาย")) return "พนักงานขาย";

    return "ลูกค้า/สมาชิก";
  };

  const isMemberActive =
    location.pathname.startsWith("/members") ||
    location.pathname.startsWith("/register") ||
    location.pathname.startsWith("/update");

  const isProductActive =
    location.pathname.startsWith("/products") ||
    location.pathname.startsWith("/add-product");

  const isSalesActive =
    location.pathname === "/sales" ||
    location.pathname.startsWith("/pos");

  const isFinanceActive =
    location.pathname.startsWith("/finance") ||
    location.pathname.startsWith("/summary");

  const isShopActive =
    location.pathname.startsWith("/shop") ||
    location.pathname.startsWith("/customer-order");

  const isLoyaltyActive =
    location.pathname.startsWith("/loyalty") ||
    location.pathname.startsWith("/member-portal");

  const isWalletActive =
    location.pathname.startsWith("/wallet") ||
    location.pathname.startsWith("/topup");

  const isOwnerActive = location.pathname.startsWith("/owner");
  const isManagerActive = location.pathname.startsWith("/manager");
  const isSalesStaffActive = location.pathname.startsWith("/sales-staff");
  const isWarehouseActive = location.pathname.startsWith("/warehouse");

  const userUname = (user?.username || "").trim().toLowerCase();
  const userName = (user?.name || "").trim().toLowerCase();

  const isOwner =
    userUname === "admin1" ||
    (!userUname.startsWith("admin") && userName.includes("เจ้าของ"));

  const isSalesStaff =
    userUname === "admin2" ||
    (!userUname.startsWith("admin") && (userName.includes("พนักงานขาย") || userName.includes("ขาย")));

  const isStockStaff =
    userUname === "admin3" ||
    (!userUname.startsWith("admin") && (userName.includes("สต็อก") || userName.includes("สต๊อก") || userName.includes("คลัง")));

  const isManager =
    userUname === "admin4" ||
    (!userUname.startsWith("admin") && userName.includes("ผู้จัดการ"));

  return (
    <nav className="mainNavbar">
      <div className="navbarContainer" style={{ flexWrap: "wrap", gap: "10px" }}>
        <NavLink to="/" className="navbarBrand">
          <div className="navbarBrandIcon">
            <Layers size={20} />
          </div>
          <div>
            <span className="navbarBrandTitle">ระบบบริหารจัดการร้านค้าครบวงจร</span>
            <span className="navbarBrandSubtitle">
              {user ? `บทบาท: ${getRoleLabel(user.username, user.name)}` : "React + Vite + MySQL"}
            </span>
          </div>
        </NavLink>

        <div className="navbarLinks" style={{ flexWrap: "wrap" }}>
          {/* เมนูสั่งซื้อสินค้าสำหรับลูกค้า */}
          <NavLink
            to="/shop"
            className={`navItem shop ${isShopActive ? "active" : ""}`}
          >
            <Store size={15} />
            <span>สั่งซื้อสินค้า</span>
            <span className="navItemBadge">Shop</span>
          </NavLink>

          {/* สำหรับลูกค้า / สมาชิกทั่วไป (ส่วน Admin สามารถตรวจสอบแต้มและของขวัญได้จากหน้าสมาชิก) */}
          {!isAdmin && (
            <NavLink
              to="/loyalty"
              className={`navItem ${isLoyaltyActive ? "active" : ""}`}
            >
              <Gift size={15} />
              <span>แต้มสะสม & ของขวัญ</span>
            </NavLink>
          )}

          {/* เมนูกระเป๋าเงิน & เติมเงินเข้าบัญชี (มียอดเงินคงเหลือและเติมเงินในหน้านี้ได้ทันที) */}
          <NavLink
            to="/wallet"
            className={`navItem ${isWalletActive ? "active" : ""}`}
            title="กระเป๋าเงิน & ยอดเงินคงเหลือ เติมเงินเข้าบัญชี"
          >
            <Wallet size={15} />
            <span>กระเป๋าเงิน</span>
            {user?.wallet_balance !== undefined && (
              <span
                className="navItemBadge"
                style={{ background: "#2563eb", color: "#ffffff", fontWeight: 700 }}
              >
                ฿{Number(user.wallet_balance).toLocaleString("th-TH", { maximumFractionDigits: 0 })}
              </span>
            )}
          </NavLink>

          {/* เมนูตามบทบาทสำหรับ Admin (admin1 - admin4) */}
          {isAdmin && (
            <>
              {/* เจ้าของร้าน: แสดงเฉพาะเจ้าของร้าน (admin1) - ซ่อนสำหรับพนักงานขาย, ผู้จัดการ, และพนักงานสต็อก */}
              {isOwner && (
                <NavLink
                  to="/owner"
                  className={`navItem ${isOwnerActive ? "active" : ""}`}
                  title="เจ้าของร้าน: อนุมัติของขวัญปีใหม่และวันเกิด"
                >
                  <Crown size={15} />
                  <span>เจ้าของร้าน</span>
                </NavLink>
              )}

              {/* ผู้จัดการ: แสดงเฉพาะผู้จัดการ (admin4) - ซ่อนสำหรับเจ้าของร้าน, พนักงานขาย, และพนักงานสต็อก */}
              {isManager && (
                <NavLink
                  to="/manager"
                  className={`navItem ${isManagerActive ? "active" : ""}`}
                  title="ผู้จัดการ: มอบหมายงานและติดตามความก้าวหน้าพนักงาน"
                >
                  <Briefcase size={15} />
                  <span>ผู้จัดการ</span>
                </NavLink>
              )}

              {/* พนักงานขาย: แสดงเฉพาะพนักงานขาย (admin2) - ซ่อนสำหรับเจ้าของร้าน, ผู้จัดการ, และพนักงานสต็อก */}
              {isSalesStaff && (
                <NavLink
                  to="/sales-staff"
                  className={`navItem ${isSalesStaffActive ? "active" : ""}`}
                  title="พนักงานขาย: ค้นหาสมาชิก ตรวจสอบแต้มสะสม สมัครสมาชิกใหม่"
                >
                  <UserCheck size={15} />
                  <span>พนักงานขาย</span>
                </NavLink>
              )}

              {/* คลังสินค้า/QC: ซ่อนสำหรับพนักงานขาย */}
              {!isSalesStaff && (
                <NavLink
                  to="/warehouse"
                  className={`navItem ${isWarehouseActive ? "active" : ""}`}
                  title="พนักงานสต็อก/คลังสินค้า: รับสินค้าตรวจ QC & โกดัง 1:1"
                >
                  <Warehouse size={15} />
                  <span>คลังสินค้า/QC</span>
                </NavLink>
              )}

              {/* สมาชิก: ซ่อนสำหรับพนักงานสต็อก */}
              {!isStockStaff && (
                <NavLink
                  to="/members"
                  className={`navItem member ${isMemberActive ? "active" : ""}`}
                >
                  <Users size={15} />
                  <span>สมาชิก</span>
                </NavLink>
              )}

              {/* สินค้า: ซ่อนสำหรับพนักงานขาย */}
              {!isSalesStaff && (
                <NavLink
                  to="/products"
                  className={`navItem product ${isProductActive ? "active" : ""}`}
                >
                  <ShoppingBag size={15} />
                  <span>สินค้า</span>
                </NavLink>
              )}

              {/* POS: ซ่อนสำหรับเจ้าของร้าน, ผู้จัดการ, และพนักงานสต็อก (แสดงเฉพาะพนักงานขาย) */}
              {isSalesStaff && (
                <NavLink
                  to="/sales"
                  className={`navItem sales ${isSalesActive ? "active" : ""}`}
                >
                  <ShoppingCart size={15} />
                  <span>POS</span>
                </NavLink>
              )}

              <NavLink
                to="/finance"
                className={`navItem finance ${isFinanceActive ? "active" : ""}`}
              >
                <TrendingUp size={15} />
                <span>การเงิน</span>
              </NavLink>
            </>
          )}
        </div>

        {user && (
          <div className="navbarUser">
            <div
              className="navbarAvatar"
              onClick={() => setShowProfileModal(true)}
              style={{ cursor: "pointer" }}
              title="คลิกเพื่อตั้งค่าข้อมูลส่วนบุคคล"
            >
              {(user.name || user.username).charAt(0)}
            </div>
            <div
              className="navbarUserInfo"
              onClick={() => setShowProfileModal(true)}
              style={{ cursor: "pointer" }}
              title="คลิกเพื่อตั้งค่าข้อมูลส่วนบุคคล"
            >
              <span className="navbarUserName">{user.name}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span className="navbarUserHandle">@{user.username}</span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    backgroundColor: isAdmin ? "#fef3c7" : "#fce7f3",
                    color: isAdmin ? "#b45309" : "#be185d",
                    padding: "1px 6px",
                    borderRadius: 9999,
                    border: isAdmin ? "1px solid #fde68a" : "1px solid #fbcfe8",
                  }}
                >
                  {getRoleLabel(user.username, user.name)}
                </span>
                {user.wallet_balance !== undefined && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/wallet");
                    }}
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      backgroundColor: "#eff6ff",
                      color: "#1d4ed8",
                      padding: "1px 6px",
                      borderRadius: 9999,
                      border: "1px solid #bfdbfe",
                      cursor: "pointer",
                    }}
                    title="คลิกเพื่อดูยอดเงินคงเหลือและเติมเงินเข้าบัญชี"
                  >
                    ฿{Number(user.wallet_balance).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </span>
                )}
              </div>
            </div>

            {/* ปุ่มติดตั้งแอปพลิเคชัน (PWA Mobile/Desktop Install) */}
            <InstallAppButton />

            {/* ปุ่มเปิดหน้าต่างตั้งค่าข้อมูลส่วนบุคคล */}
            <button
              type="button"
              className="navbarProfileBtn"
              onClick={() => setShowProfileModal(true)}
              title="ตั้งค่าข้อมูลส่วนบุคคล"
            >
              <UserCog size={15} />
              <span>ข้อมูลส่วนบุคคล</span>
            </button>

            <button id="navbar-logout" type="button" className="navbarLogout" onClick={handleLogout}>
              <LogOut size={16} />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        )}
      </div>

      {/* หน้าต่างตั้งค่าข้อมูลส่วนบุคคล */}
      <ProfileSettingsModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </nav>
  );
}
