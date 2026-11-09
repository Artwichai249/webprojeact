import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";

// ==========================================
// 0. ระบบเข้าสู่ระบบ (Auth Module)
// ==========================================
import { ProtectedRoute, AdminRoute, useAuth } from "./modules/auth/AuthContext";
import Login from "./modules/auth/screens/Login";
import Signup from "./modules/auth/screens/Signup";

// ==========================================
// 1. ระบบสมาชิก (Member Module)
// ==========================================
import ListMember from "./modules/member/screens/ListMember";
import Register from "./modules/member/screens/Register";
import UpdateMember from "./modules/member/screens/UpdateMember";

// ==========================================
// 2. ระบบสินค้า (Product Module)
// ==========================================
import ProductList from "./modules/product/screens/ProductList";
import OrderProduct from "./modules/product/screens/OrderProduct";
import OrderPayment from "./modules/product/screens/OrderPayment";
import UpdateProduct from "./modules/product/screens/UpdateProduct";

// ============= Sales Module =============
import SalesScreen from "./modules/sales/screens/SalesScreen";

// ============= Customer Shop Module (สั่งสินค้าสำหรับลูกค้า) =============
import CustomerShop from "./modules/shop/screens/CustomerShop";

// ============= Finance Module (สรุปรายรับ - รายจ่าย) =============
import FinanceSummary from "./modules/finance/screens/FinanceSummary";

// ==========================================
// 3. ระบบตามบทบาท 3.1 - 3.5 (Role Modules)
// ==========================================
import OwnerGiftApproval from "./modules/roles/screens/OwnerGiftApproval";
import ManagerTasks from "./modules/roles/screens/ManagerTasks";
import SalesStaffPortal from "./modules/roles/screens/SalesStaffPortal";
import WarehouseStockPortal from "./modules/roles/screens/WarehouseStockPortal";
import CustomerLoyaltyPortal from "./modules/roles/screens/CustomerLoyaltyPortal";
import ProfileSettingsModal from "./modules/profile/screens/ProfileSettingsModal";
import WalletScreen from "./modules/wallet/screens/WalletScreen";

import "./App.css";

// Layout สำหรับหน้าที่ต้องเข้าสู่ระบบก่อน (มี Navbar)
function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <Navbar />
      <main className="app-content">
        <Outlet />
      </main>
    </ProtectedRoute>
  );
}

// นำทางหน้าแรกตามบทบาทผู้ใช้งาน (ตรงตามฐานข้อมูล)
function HomeRedirect() {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const uname = (user.username || "").trim().toLowerCase();
  const name = (user.name || "").trim().toLowerCase();

  if (uname === "admin1" || (!uname.startsWith("admin") && name.includes("เจ้าของ"))) return <Navigate to="/owner" replace />;
  if (uname === "admin2" || (!uname.startsWith("admin") && (name.includes("พนักงานขาย") || name.includes("ขาย")))) return <Navigate to="/sales-staff" replace />;
  if (uname === "admin3" || (!uname.startsWith("admin") && (name.includes("สต็อก") || name.includes("สต๊อก") || name.includes("คลัง")))) return <Navigate to="/warehouse" replace />;
  if (uname === "admin4" || (!uname.startsWith("admin") && name.includes("ผู้จัดการ"))) return <Navigate to="/manager" replace />;
  return <Navigate to={isAdmin ? "/members" : "/shop"} replace />;
}

// Route guard: ป้องกันพนักงานขายไม่ให้เข้าหน้า เจ้าของร้าน, ผู้จัดการ, คลังสินค้า/QC, และสินค้า
function NonSalesStaffRoute({ children }) {
  const { user } = useAuth();
  const uname = (user?.username || "").trim().toLowerCase();
  const name = (user?.name || "").trim().toLowerCase();
  const isSalesStaff = uname === "admin2" || (!uname.startsWith("admin") && (name.includes("พนักงานขาย") || name.includes("ขาย")));

  if (isSalesStaff) {
    return <Navigate to="/sales-staff" replace />;
  }
  return children;
}

// Route guard: ป้องกันเจ้าของร้านไม่ให้เข้าหน้า ผู้จัดการ, พนักงานขาย, และ POS
function NonOwnerRoute({ children }) {
  const { user } = useAuth();
  const uname = (user?.username || "").trim().toLowerCase();
  const name = (user?.name || "").trim().toLowerCase();
  const isOwner = uname === "admin1" || (!uname.startsWith("admin") && name.includes("เจ้าของ"));

  if (isOwner) {
    return <Navigate to="/owner" replace />;
  }
  return children;
}

// Route guard: ป้องกันพนักงานสต็อกไม่ให้เข้าหน้า เจ้าของร้าน, ผู้จัดการ, พนักงานขาย, สมาชิก, และ POS
function NonStockStaffRoute({ children }) {
  const { user } = useAuth();
  const uname = (user?.username || "").trim().toLowerCase();
  const name = (user?.name || "").trim().toLowerCase();
  const isStockStaff = uname === "admin3" || (!uname.startsWith("admin") && (name.includes("สต็อก") || name.includes("สต๊อก") || name.includes("คลัง")));

  if (isStockStaff) {
    return <Navigate to="/warehouse" replace />;
  }
  return children;
}

export default function App() {
  return (
    <div className="app-container">
      <Routes>
        {/* ============ หน้าเข้าสู่ระบบ (ไม่ต้อง login) ============ */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route element={<ProtectedLayout />}>
          {/* หน้าแรกตามสิทธิ์บทบาท */}
          <Route path="/" element={<HomeRedirect />} />

          {/* ============ หน้าตั้งค่าข้อมูลส่วนบุคคล & กระเป๋าเงิน ============ */}
          <Route path="/profile" element={<ProfileSettingsModal isPage={true} />} />
          <Route path="/settings" element={<ProfileSettingsModal isPage={true} />} />
          <Route path="/wallet" element={<WalletScreen />} />
          <Route path="/topup" element={<WalletScreen />} />

          {/* ============ เส้นทางสำหรับลูกค้า / สมาชิก (3.5) ============ */}
          <Route path="/shop" element={<CustomerShop />} />
          <Route path="/customer-order" element={<CustomerShop />} />
          <Route path="/loyalty" element={<CustomerLoyaltyPortal />} />
          <Route path="/member-portal" element={<CustomerLoyaltyPortal />} />

          {/* ============ เส้นทางระบบตามบทบาท 3.1 - 3.4 (เฉพาะ admin1 - admin4) ============ */}
          {/* 3.1 เจ้าของร้าน: อนุมัติของขวัญปีใหม่และวันเกิด + ค้นหาตามเงื่อนไข */}
          <Route path="/owner" element={<AdminRoute><NonSalesStaffRoute><NonStockStaffRoute><OwnerGiftApproval /></NonStockStaffRoute></NonSalesStaffRoute></AdminRoute>} />
          {/* 3.2 ผู้จัดการ: มอบหมายงานและติดตามความก้าวหน้าพนักงาน + ค้นหาตามเงื่อนไข */}
          <Route path="/manager" element={<AdminRoute><NonSalesStaffRoute><NonOwnerRoute><NonStockStaffRoute><ManagerTasks /></NonStockStaffRoute></NonOwnerRoute></NonSalesStaffRoute></AdminRoute>} />
          {/* 3.3 พนักงานขาย: ค้นหาสมาชิก ตรวจสอบแต้มสะสม และบันทึกสมัครสมาชิกใหม่ */}
          <Route path="/sales-staff" element={<AdminRoute><NonOwnerRoute><NonStockStaffRoute><SalesStaffPortal /></NonStockStaffRoute></NonOwnerRoute></AdminRoute>} />
          {/* 3.4 พนักงานสต็อก / คลังสินค้า: รับสินค้าเข้าคลัง ตรวจ QC บันทึกสินค้าชำรุด + โกดัง (1:1) */}
          <Route path="/warehouse" element={<AdminRoute><NonSalesStaffRoute><WarehouseStockPortal /></NonSalesStaffRoute></AdminRoute>} />

          {/* ============ เส้นทางระบบสมาชิก (เฉพาะ admin1 - admin4, ตัดออกจากพนักงานสต็อก) ============ */}
          <Route path="/members" element={<AdminRoute><NonStockStaffRoute><ListMember /></NonStockStaffRoute></AdminRoute>} />
          <Route path="/members/register" element={<AdminRoute><NonStockStaffRoute><Register /></NonStockStaffRoute></AdminRoute>} />
          <Route path="/register" element={<AdminRoute><NonStockStaffRoute><Register /></NonStockStaffRoute></AdminRoute>} />
          <Route path="/members/update/:id" element={<AdminRoute><NonStockStaffRoute><UpdateMember /></NonStockStaffRoute></AdminRoute>} />
          <Route path="/update/:id" element={<AdminRoute><NonStockStaffRoute><UpdateMember /></NonStockStaffRoute></AdminRoute>} />
          <Route path="/update" element={<AdminRoute><NonStockStaffRoute><UpdateMember /></NonStockStaffRoute></AdminRoute>} />

          {/* ============ เส้นทางระบบสินค้า (เฉพาะ admin1 - admin4, ตัดออกจากพนักงานขาย) ============ */}
          <Route path="/products" element={<AdminRoute><NonSalesStaffRoute><ProductList /></NonSalesStaffRoute></AdminRoute>} />
          <Route path="/products/order" element={<AdminRoute><NonSalesStaffRoute><OrderProduct /></NonSalesStaffRoute></AdminRoute>} />
          <Route path="/products/order/payment/:id" element={<AdminRoute><NonSalesStaffRoute><OrderPayment /></NonSalesStaffRoute></AdminRoute>} />
          <Route path="/payment/:id" element={<AdminRoute><NonSalesStaffRoute><OrderPayment /></NonSalesStaffRoute></AdminRoute>} />
          <Route path="/products/add" element={<AdminRoute><NonSalesStaffRoute><OrderProduct /></NonSalesStaffRoute></AdminRoute>} />
          <Route path="/add-product" element={<AdminRoute><NonSalesStaffRoute><OrderProduct /></NonSalesStaffRoute></AdminRoute>} />
          <Route path="/products/update/:id" element={<AdminRoute><NonSalesStaffRoute><UpdateProduct /></NonSalesStaffRoute></AdminRoute>} />
          <Route path="/products/edit/:id" element={<AdminRoute><NonSalesStaffRoute><UpdateProduct /></NonSalesStaffRoute></AdminRoute>} />

          {/* ============ เส้นทางระบบขายสินค้า (POS) - เฉพาะ admin1 - admin4 (ตัดออกจากเจ้าของร้าน และพนักงานสต็อก) ============ */}
          <Route path="/sales" element={<AdminRoute><NonOwnerRoute><NonStockStaffRoute><SalesScreen /></NonStockStaffRoute></NonOwnerRoute></AdminRoute>} />
          <Route path="/pos" element={<AdminRoute><NonOwnerRoute><NonStockStaffRoute><SalesScreen /></NonStockStaffRoute></NonOwnerRoute></AdminRoute>} />

          {/* ============ เส้นทางสรุปรายรับ - รายจ่าย (เฉพาะ admin1 - admin4) ============ */}
          <Route path="/finance" element={<AdminRoute><FinanceSummary /></AdminRoute>} />
          <Route path="/summary" element={<AdminRoute><FinanceSummary /></AdminRoute>} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </div>
  );
}
