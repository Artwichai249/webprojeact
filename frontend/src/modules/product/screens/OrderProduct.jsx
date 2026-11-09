// src/modules/product/screens/OrderProduct.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  PackagePlus,
  ArrowLeft,
  CheckCircle2,
  Boxes,
  Truck,
  DollarSign,
  FileText,
  User,
  History,
  Search,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ShoppingBag,
  Clock,
  Check,
  Trash2,
  ClipboardList,
  CreditCard,
  ShoppingCart,
  Printer,
  X,
  Lock,
} from "lucide-react";
import {
  getAllProducts,
  createPurchaseOrder,
  getPurchaseOrders,
  approvePurchaseOrder,
  deletePurchaseOrder,
} from "../../../api/productApi";
import { useAuth } from "../../auth/AuthContext";
import "./OrderProduct.css";

// ฟังก์ชันแปลงตัวเลขเป็นคำอ่านภาษาไทยสำหรับใบเสนอราคา (เช่น (เจ็ดล้านหกแสนสามหมื่นสามพันสองร้อยแปดสิบสามบาทเจ็ดสิบสตางค์))
function thaiBahtText(num) {
  if (num === null || num === undefined || isNaN(num)) return "";
  const digits = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
  const units = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];

  const [intPart, decPart = "00"] = Number(num).toFixed(2).split(".");

  const convertGroup = (str) => {
    let res = "";
    const len = str.length;
    for (let i = 0; i < len; i++) {
      const d = parseInt(str[i], 10);
      const pos = len - i - 1;
      if (d !== 0) {
        if (pos === 1 && d === 1) res += "";
        else if (pos === 1 && d === 2) res += "ยี่";
        else if (pos === 0 && d === 1 && len > 1 && parseInt(str[i - 1], 10) !== 0) res += "เอ็ด";
        else res += digits[d];
        res += units[pos];
      }
    }
    return res;
  };

  let intStr = parseInt(intPart, 10) === 0 ? "ศูนย์" : convertGroup(intPart);
  let decStr = parseInt(decPart, 10) === 0 ? "ถ้วน" : convertGroup(decPart) + "สตางค์";

  return `(${intStr}บาท${decStr})`;
}

export default function OrderProduct() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // แท็บปัจจุบัน: "order" (ฟอร์มเสนอสั่งซื้อ) | "history" (ประวัติการเสนอสั่งซื้อ)
  const [activeTab, setActiveTab] = useState("order");

  // โหมดการเสนอสั่งซื้อ: "existing" (เสนอสั่งซื้อสินค้าเดิม) | "new" (เสนอสั่งซื้อสินค้าใหม่)
  const [orderType, setOrderType] = useState("existing");

  // รายการสินค้าทั้งหมดในระบบ
  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // ฟอร์มเสนอสั่งซื้อสินค้า
  const [formData, setFormData] = useState({
    product_id: "",
    name: "",
    category: "เครื่องเขียน",
    price: "",
    quantity: "20",
    cost_price: "10",
    supplier: "บริษัท ซัพพลายเออร์ สยาม จำกัด",
    ordered_by: user?.name || user?.username || "เจ้าหน้าที่คลังสินค้า",
    note: "เสนอสั่งซื้อเติมสต็อกสินค้า",
    status: "รออนุมัติ", // 'รออนุมัติ' | 'อนุมัติแล้ว'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [successModalData, setSuccessModalData] = useState(null);

  // สถานะเปิดดูใบเสนอราคา (Quotation Modal)
  const [selectedQuoteOrder, setSelectedQuoteOrder] = useState(null);

  // ประวัติการเสนอสั่งซื้อ
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [historySearch, setHistorySearch] = useState("");

  // โหลดรายการสินค้าเมื่อเปิดหน้า
  useEffect(() => {
    loadProducts();
  }, []);

  // ตรวจสอบว่าผู้ใช้งานปัจจุบันเป็นพนักงานสต็อกหรือไม่
  const isStockStaff = (() => {
    if (!user) return false;
    const u = (user.username || "").trim().toLowerCase();
    const name = (user.name || "").trim().toLowerCase();
    const role = (user.role || "").trim().toLowerCase();

    // 1. บัญชี admin3 (พนักงานสต็อกในฐานข้อมูล)
    if (u === "admin3") return true;

    // 2. ตรวจสอบจากชื่อหรือบทบาทว่ามีคำว่า สต็อก/สต๊อก/คลัง/stock/warehouse
    if (name.includes("สต็อก") || name.includes("สต๊อก") || name.includes("คลัง") || name.includes("stock") || name.includes("warehouse")) {
      return true;
    }
    if (role.includes("สต็อก") || role.includes("สต๊อก") || role.includes("คลัง") || role.includes("stock") || role.includes("warehouse")) {
      return true;
    }
    return false;
  })();

  // เมื่อเปลี่ยนผู้ใช้ ให้อัปเดตชื่อผู้เสนอสั่งซื้อ
  useEffect(() => {
    if (user?.name || user?.username) {
      setFormData((prev) => ({
        ...prev,
        ordered_by: user.name || user.username,
        status: isStockStaff ? "รออนุมัติ" : prev.status,
      }));
    }
  }, [user, isStockStaff]);

  // หากเป็นพนักงานสต็อก ให้บังคับสถานะเป็น "รออนุมัติ" เสมอ
  useEffect(() => {
    if (isStockStaff && formData.status !== "รออนุมัติ") {
      setFormData((prev) => ({ ...prev, status: "รออนุมัติ" }));
    }
  }, [isStockStaff, formData.status]);

  // โหลดประวัติเมื่อเปิดแท็บประวัติ
  useEffect(() => {
    if (activeTab === "history") {
      loadOrderHistory();
    }
  }, [activeTab]);

  async function loadProducts() {
    setIsLoadingProducts(true);
    const data = await getAllProducts();
    if (Array.isArray(data)) {
      setProducts(data);
      // ตั้งค่าเริ่มต้นเป็นสินค้าตัวแรกถ้ายังไม่ได้เลือก
      if (data.length > 0 && !formData.product_id) {
        const first = data[0];
        setFormData((prev) => ({
          ...prev,
          product_id: first.product_id,
          cost_price: (parseFloat(first.price) * 0.7).toFixed(2),
        }));
      }
    }
    setIsLoadingProducts(false);
  }

  async function loadOrderHistory() {
    setIsLoadingOrders(true);
    const data = await getPurchaseOrders();
    if (Array.isArray(data)) {
      setOrders(data);
    }
    setIsLoadingOrders(false);
  }

  // หาสินค้าที่เลือกอยู่ในปัจจุบัน
  const selectedProduct = products.find(
    (p) => p.product_id === formData.product_id
  );

  // จัดการการเปลี่ยนข้อมูลในฟอร์ม
  function handleChange(e) {
    const { name, value } = e.target;
    if (name === "status" && isStockStaff && value === "อนุมัติแล้ว") {
      alert("พนักงานสต็อกทำได้เฉพาะ 'รออนุมัติ' เท่านั้น (ไม่มีสิทธิ์อนุมัติทันที ต้องรอให้เจ้าของร้านหรือผู้จัดการอนุมัติ)");
      return;
    }
    setFormData((prev) => {
      const next = { ...prev, [name]: value };

      // หากเลือกสินค้าเดิมจาก dropdown
      if (name === "product_id" && orderType === "existing") {
        const p = products.find((item) => item.product_id === value);
        if (p) {
          next.cost_price = (parseFloat(p.price) * 0.7).toFixed(2);
        }
      }
      return next;
    });
  }

  // ปุ่มลัดเพิ่มจำนวนเสนอสั่งซื้อ (+10, +25, +50, +100)
  function handleQuickQuantity(addQty) {
    const current = parseInt(formData.quantity, 10) || 0;
    setFormData((prev) => ({
      ...prev,
      quantity: String(Math.max(1, current + addQty)),
    }));
  }

  // คำนวณสต็อกและยอดรวม
  const currentStock =
    orderType === "existing" && selectedProduct
      ? parseInt(selectedProduct.stock_quantity, 10) || 0
      : 0;
  const orderQuantity = parseInt(formData.quantity, 10) || 0;
  const unitCost = parseFloat(formData.cost_price) || 0;
  const newStockForecast = currentStock + orderQuantity;
  const totalCost = orderQuantity * unitCost;

  // ส่งฟอร์มเสนอสั่งซื้อ
  async function handleSubmit(e) {
    e.preventDefault();

    if (orderQuantity <= 0) {
      alert("กรุณาระบุจำนวนสินค้าที่เสนอสั่งซื้อให้มากกว่า 0 ชิ้น");
      return;
    }

    if (orderType === "existing" && !formData.product_id) {
      alert("กรุณาเลือกสินค้าที่ต้องการเสนอสั่งซื้อ");
      return;
    }

    if (orderType === "new" && !formData.name.trim()) {
      alert("กรุณาระบุชื่อสินค้าใหม่");
      return;
    }

    setIsSubmitting(true);
    const finalStatus = isStockStaff ? "รออนุมัติ" : formData.status;
    const payload = {
      order_type: orderType,
      product_id: formData.product_id,
      name: formData.name,
      category: formData.category,
      price: formData.price,
      quantity: orderQuantity,
      cost_price: unitCost,
      supplier: formData.supplier,
      ordered_by: formData.ordered_by,
      note: formData.note,
      status: finalStatus,
    };

    const res = await createPurchaseOrder(payload);
    setIsSubmitting(false);

    if (res && !res.error) {
      setSuccessModalData(res.order);
      // โหลดข้อมูลสินค้าใหม่เพื่อให้สต็อกเป็นปัจจุบัน (กรณีเลือกอนุมัติทันที)
      loadProducts();
    } else {
      alert(`เกิดข้อผิดพลาด: ${res?.error || "ไม่สามารถบันทึกการเสนอสั่งซื้อได้"}`);
    }
  }

  // อนุมัติใบเสนอสั่งซื้อ (รับสินค้าเข้าสต็อก)
  async function handleApprove(orderId, orderNo, productName, qty) {
    if (isStockStaff) {
      alert("พนักงานสต็อกทำได้เฉพาะ 'รออนุมัติ' เท่านั้น (ไม่มีสิทธิ์อนุมัติ ต้องรอการอนุมัติจากเจ้าของร้านหรือผู้จัดการ)");
      return;
    }

    if (
      !window.confirm(
        `ยืนยันการอนุมัติใบเสนอสั่งซื้อ ${orderNo}?\nระบบจะทำการเพิ่มสต็อกสินค้า "${productName}" จำนวน ${qty} ชิ้นทันที`
      )
    ) {
      return;
    }

    setActionLoadingId(orderId);
    const res = await approvePurchaseOrder(orderId);
    setActionLoadingId(null);

    if (res && !res.error) {
      alert("อนุมัติใบเสนอสั่งซื้อและรับสินค้าเข้าสต็อกเรียบร้อยแล้ว!");
      loadOrderHistory();
      loadProducts();
    } else {
      alert(`เกิดข้อผิดพลาด: ${res?.error || "ไม่สามารถอนุมัติได้"}`);
    }
  }

  // ลบใบเสนอสั่งซื้อ
  async function handleDelete(orderId, orderNo) {
    if (!window.confirm(`คุณต้องการลบใบเสนอสั่งซื้อ ${orderNo} ใช่หรือไม่?`)) {
      return;
    }

    setActionLoadingId(orderId);
    const res = await deletePurchaseOrder(orderId);
    setActionLoadingId(null);

    if (res && !res.error) {
      setOrders((prev) => prev.filter((o) => o.order_id !== orderId));
      alert("ลบใบเสนอสั่งซื้อสำเร็จ");
    } else {
      alert(`เกิดข้อผิดพลาด: ${res?.error || "ไม่สามารถลบได้"}`);
    }
  }

  // สั่งออเดอร์จากรายการในประวัติ (คัดลอกข้อมูลไปฟอร์มสั่งซื้อ)
  function handleReorder(orderItem) {
    setOrderType("existing");
    setFormData({
      product_id: orderItem.product_id,
      name: orderItem.product_name || "",
      category: orderItem.category || "เครื่องเขียน",
      price: "",
      quantity: String(orderItem.quantity || 20),
      cost_price: String(orderItem.cost_price || 10),
      supplier: orderItem.supplier || "บริษัท ซัพพลายเออร์ สยาม จำกัด",
      ordered_by: user?.name || user?.username || orderItem.ordered_by || "ผู้เสนอสั่งซื้อ",
      note: `สั่งออเดอร์อ้างอิงจาก ${orderItem.order_no}`,
      status: "รออนุมัติ",
    });
    setActiveTab("order");
  }

  // สรุปยอดในประวัติการเสนอสั่งซื้อ
  const totalOrdersCount = orders.length;
  const pendingCount = orders.filter((o) => o.status === "รออนุมัติ").length;
  const approvedCount = orders.filter((o) => o.status === "อนุมัติแล้ว").length;
  const totalSpent = orders.reduce(
    (sum, o) => sum + (parseFloat(o.total_cost) || 0),
    0
  );

  const filteredOrders = orders.filter((o) => {
    const term = historySearch.toLowerCase();
    const noMatch = (o.order_no || "").toLowerCase().includes(term);
    const nameMatch = (o.product_name || "").toLowerCase().includes(term);
    const pIdMatch = (o.product_id || "").toLowerCase().includes(term);
    const supplierMatch = (o.supplier || "").toLowerCase().includes(term);
    const statusMatch = (o.status || "").toLowerCase().includes(term);
    return noMatch || nameMatch || pIdMatch || supplierMatch || statusMatch;
  });

  return (
    <div className="orderProductContainer">
      {/* ส่วนหัวหน้าเสนอการสั่งซื้อ */}
      <div className="orderPageHeader">
        <div className="headerLeft">
          <Link to="/products" className="btnBackToProducts" title="กลับหน้ารายการสินค้า">
            <ArrowLeft size={18} />
            <span>กลับรายการสินค้า</span>
          </Link>
          <div className="titleGroup">
            <div className="titleBadge">
              <ClipboardList size={14} />
              <span>Purchase Requisition (PR)</span>
            </div>
            <h1>เสนอการสั่งซื้อสินค้า</h1>
            <p className="subtitle">
              ทำรายการเสนอการสั่งซื้อสินค้าจากผู้จัดจำหน่าย เพื่อส่งขออนุมัติและเติมสต็อกเข้าสู่ระบบ
            </p>
          </div>
        </div>

        {/* แถบสลับแท็บ ฟอร์มเสนอสั่งซื้อ <-> ประวัติการเสนอสั่งซื้อ */}
        <div className="tabSwitchGroup">
          <button
            type="button"
            className={`tabSwitchBtn ${activeTab === "order" ? "active" : ""}`}
            onClick={() => setActiveTab("order")}
          >
            <PackagePlus size={16} />
            <span>ทำรายการเสนอสั่งซื้อ</span>
          </button>
          <button
            type="button"
            className={`tabSwitchBtn ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            <History size={16} />
            <span>ประวัติการเสนอสั่งซื้อ</span>
            {pendingCount > 0 && (
              <span className="tabCounter pending" title="รออนุมัติ">
                {pendingCount} รออนุมัติ
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ===================== TAB 1: ฟอร์มเสนอการสั่งซื้อสินค้า ===================== */}
      {activeTab === "order" && (
        <div className="orderGrid">
          {/* การ์ดฟอร์มหลัก */}
          <div className="orderFormCard">
            {/* สลับโหมด: สินค้าเดิม / สินค้าใหม่ */}
            <div className="orderTypeToggle">
              <button
                type="button"
                className={`typePill ${orderType === "existing" ? "active" : ""}`}
                onClick={() => setOrderType("existing")}
              >
                <Boxes size={16} />
                <div>
                  <span className="pillTitle">เสนอสั่งซื้อสินค้าเดิมในระบบ</span>
                  <span className="pillDesc">เลือกสินค้าที่มีอยู่เพื่อขอเติมสต็อก</span>
                </div>
              </button>

              <button
                type="button"
                className={`typePill ${orderType === "new" ? "active" : ""}`}
                onClick={() => setOrderType("new")}
              >
                <Sparkles size={16} />
                <div>
                  <span className="pillTitle">เสนอสั่งซื้อสินค้าใหม่</span>
                  <span className="pillDesc">เสนอรายการสินค้าใหม่เข้าระบบคลัง</span>
                </div>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="orderFormBody">
              {/* โหมด 1: เลือกสินค้าเดิมในระบบ */}
              {orderType === "existing" ? (
                <div className="formSection">
                  <label className="sectionLabel">
                    <Boxes size={16} />
                    <span>เลือกสินค้าที่ต้องการเสนอสั่งซื้อ *</span>
                  </label>

                  {isLoadingProducts ? (
                    <div className="selectLoading">กำลังโหลดรายการสินค้า...</div>
                  ) : (
                    <select
                      name="product_id"
                      value={formData.product_id}
                      onChange={handleChange}
                      className="productSelectInput"
                      required
                    >
                      <option value="" disabled>
                        -- กรุณาเลือกสินค้า --
                      </option>
                      {products.map((p) => (
                        <option key={p.product_id} value={p.product_id}>
                          [{p.product_id}] {p.name} - หมวดหมู่: {p.category} (คงเหลือ {p.stock_quantity || 0} ชิ้น)
                        </option>
                      ))}
                    </select>
                  )}

                  {/* แสดงการ์ดสรุปสถานะสินค้าปัจจุบันที่เลือก */}
                  {selectedProduct && (
                    <div className="selectedProductPreview">
                      <div className="previewMain">
                        <div className="previewIconWrapper">
                          <ShoppingBag size={24} />
                        </div>
                        <div className="previewDetails">
                          <span className="previewCode">รหัส: {selectedProduct.product_id}</span>
                          <h4 className="previewTitle">{selectedProduct.name}</h4>
                          <span className="previewCategory">หมวดหมู่: {selectedProduct.category}</span>
                        </div>
                      </div>

                      <div className="previewStockStatus">
                        <span className="stockLabel">สต็อกปัจจุบัน</span>
                        <div className="stockValueRow">
                          <span className="stockNumber">{currentStock}</span>
                          <span className="stockUnit">ชิ้น</span>
                        </div>
                        <span
                          className={`stockBadge ${
                            currentStock <= 0
                              ? "outOfStock"
                              : currentStock < 10
                              ? "lowStock"
                              : "inStock"
                          }`}
                        >
                          {currentStock <= 0
                            ? "สินค้าหมด"
                            : currentStock < 10
                            ? "ใกล้หมด"
                            : "มีสินค้า"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* โหมด 2: กรอกข้อมูลสินค้าใหม่ */
                <div className="formSection newProductGrid">
                  <div className="formGroup">
                    <label>รหัสสินค้า (เว้นว่างเพื่อสร้างให้อัตโนมัติ)</label>
                    <input
                      type="text"
                      name="product_id"
                      placeholder="เช่น P008"
                      value={formData.product_id}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="formGroup">
                    <label>ชื่อสินค้าใหม่ *</label>
                    <input
                      type="text"
                      name="name"
                      placeholder="เช่น แฟ้มเอกสาร A4"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="formGroup">
                    <label>หมวดหมู่สินค้า *</label>
                    <input
                      type="text"
                      name="category"
                      placeholder="เช่น เครื่องเขียน, ของใช้"
                      value={formData.category}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="formGroup">
                    <label>ราคาขายปลีกหน้าร้าน (บาท) *</label>
                    <input
                      type="number"
                      step="0.01"
                      name="price"
                      placeholder="เช่น 45.00"
                      value={formData.price}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              )}

              {/* ส่วนจำนวนที่เสนอสั่งซื้อ + ปุ่มลัด */}
              <div className="formSection">
                <div className="quantityHeader">
                  <label className="sectionLabel">
                    <TrendingUp size={16} />
                    <span>จำนวนที่เสนอสั่งซื้อ (ชิ้น) *</span>
                  </label>
                  <div className="quickAddGroup">
                    <span>เพิ่มด่วน:</span>
                    <button type="button" onClick={() => handleQuickQuantity(10)}>+10</button>
                    <button type="button" onClick={() => handleQuickQuantity(25)}>+25</button>
                    <button type="button" onClick={() => handleQuickQuantity(50)}>+50</button>
                    <button type="button" onClick={() => handleQuickQuantity(100)}>+100</button>
                  </div>
                </div>

                <div className="quantityInputRow">
                  <input
                    type="number"
                    min="1"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    className="largeNumberInput"
                    required
                  />
                  <span className="unitLabel">ชิ้น</span>
                </div>

                {/* กล่องทำนายสต็อกหลังเสนอสั่งซื้อ */}
                <div className="stockForecastBox">
                  <div className="forecastStep">
                    <span className="forecastLabel">สต็อกปัจจุบัน</span>
                    <span className="forecastNumber">{currentStock} ชิ้น</span>
                  </div>
                  <span className="forecastOperator">+</span>
                  <div className="forecastStep highlight">
                    <span className="forecastLabel">จำนวนเสนอสั่งซื้อ</span>
                    <span className="forecastNumber">+{orderQuantity} ชิ้น</span>
                  </div>
                  <span className="forecastOperator">=</span>
                  <div className="forecastStep result">
                    <span className="forecastLabel">สต็อกหลังได้รับอนุมัติ</span>
                    <span className="forecastNumber newStock">{newStockForecast} ชิ้น</span>
                  </div>
                </div>
              </div>

              {/* ส่วนราคาต้นทุน & ซัพพลายเออร์ */}
              <div className="formGridTwoCols">
                <div className="formGroup">
                  <label>
                    <DollarSign size={15} />
                    <span>ราคาต้นทุนประมาณการ/หน่วย (บาท) *</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="cost_price"
                    placeholder="เช่น 12.50"
                    value={formData.cost_price}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="formGroup">
                  <label>
                    <Truck size={15} />
                    <span>ผู้จัดจำหน่าย / ซัพพลายเออร์ *</span>
                  </label>
                  <input
                    type="text"
                    name="supplier"
                    placeholder="เช่น บริษัท สยามสเตชั่นเนอรี่ จำกัด"
                    value={formData.supplier}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="formGroup">
                  <label>
                    <User size={15} />
                    <span>ผู้ทำรายการเสนอสั่งซื้อ</span>
                  </label>
                  <input
                    type="text"
                    name="ordered_by"
                    placeholder="ชื่อผู้เสนอสั่งซื้อ"
                    value={formData.ordered_by}
                    onChange={handleChange}
                  />
                </div>

                <div className="formGroup">
                  <label>
                    <Clock size={15} />
                    <span>สถานะการทำรายการ *</span>
                  </label>
                  <select
                    name="status"
                    value={isStockStaff ? "รออนุมัติ" : formData.status}
                    onChange={handleChange}
                    className="statusSelectInput"
                    disabled={isStockStaff}
                    style={isStockStaff ? { backgroundColor: "#f8fafc", cursor: "not-allowed" } : {}}
                  >
                    <option value="รออนุมัติ">⏳ รออนุมัติ (บันทึกเป็นใบเสนอสั่งซื้อเพื่อพิจารณา)</option>
                    {!isStockStaff && (
                      <option value="อนุมัติแล้ว">✅ อนุมัติทันที (บันทึกและเพิ่มเข้าสต็อกทันที)</option>
                    )}
                    {isStockStaff && (
                      <option value="อนุมัติแล้ว" disabled>🔒 อนุมัติทันที (พนักงานสต็อกไม่มีสิทธิ์อนุมัติ)</option>
                    )}
                  </select>
                  {isStockStaff && (
                    <small style={{ color: "#d97706", fontSize: "11.5px", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px", fontWeight: "600" }}>
                      <Lock size={12} />
                      * พนักงานสต็อกทำได้เฉพาะ "รออนุมัติ" (ต้องรอการอนุมัติจากเจ้าของร้านหรือผู้จัดการ)
                    </small>
                  )}
                </div>

                <div className="formGroup fullWidth">
                  <label>
                    <FileText size={15} />
                    <span>เหตุผล / หมายเหตุการเสนอสั่งซื้อ</span>
                  </label>
                  <input
                    type="text"
                    name="note"
                    placeholder="เช่น สินค้าขายดี ต้องการสำรองสต็อกรอบประจำสัปดาห์"
                    value={formData.note}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* สรุปยอดเงินและปุ่มสั่งซื้อ */}
              <div className="orderSubmitBar">
                <div className="totalCostSummary">
                  <span className="totalCostLabel">ยอดรวมงบประมาณที่เสนอ:</span>
                  <span className="totalCostValue">
                    {totalCost.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    บาท
                  </span>
                </div>

                <div className="buttonActions">
                  <button
                    type="button"
                    className="btnCancelOrder"
                    onClick={() => navigate("/products")}
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="btnSubmitOrder"
                    disabled={isSubmitting}
                  >
                    <ClipboardList size={18} />
                    <span>{isSubmitting ? "กำลังบันทึก..." : "ส่งแบบเสนอการสั่งซื้อ"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* แผงข้อมูลด้านขวา (สรุป & คำแนะนำ) */}
          <div className="orderSidebar">
            <div className="sidebarCard infoCard">
              <div className="sidebarCardHeader">
                <ClipboardList size={20} className="iconHighlight" />
                <h3>ขั้นตอนการเสนอสั่งซื้อ (PR)</h3>
              </div>
              <ul className="infoList">
                <li>
                  <strong>1. ทำรายการเสนอ:</strong> เจ้าหน้าที่เลือกสินค้าและระบุจำนวนที่ต้องการขอซื้อ
                </li>
                <li>
                  <strong>2. ตรวจสอบ & ขออนุมัติ:</strong> ระบบจะบันทึกสถานะเป็น <em>"รออนุมัติ"</em>
                </li>
                <li>
                  <strong>3. รับเข้าสต็อก:</strong> เมื่อผู้มีอำนาจกดอนุมัติ ยอดสต็อกจะถูกเพิ่มเข้าสู่ระบบทันที
                </li>
              </ul>
            </div>

            <div className="sidebarCard alertCard">
              <div className="sidebarCardHeader">
                <AlertTriangle size={20} className="iconWarning" />
                <h3>เกณฑ์สต็อกสินค้าที่ควรเสนอสั่งซื้อ</h3>
              </div>
              <div className="thresholdItems">
                <div className="thresholdItem red">
                  <span className="badgeDot red" />
                  <div>
                    <strong>หมดสต็อก (เร่งด่วน):</strong> 0 ชิ้น
                  </div>
                </div>
                <div className="thresholdItem orange">
                  <span className="badgeDot orange" />
                  <div>
                    <strong>ใกล้หมด (ควรเสนอซื้อ):</strong> ต่ำกว่า 10 ชิ้น
                  </div>
                </div>
                <div className="thresholdItem green">
                  <span className="badgeDot green" />
                  <div>
                    <strong>มีสินค้าเพียงพอ:</strong> 10 ชิ้นขึ้นไป
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 2: ประวัติการเสนอสั่งซื้อ ===================== */}
      {activeTab === "history" && (
        <div className="historyContainer">
          {/* การ์ดสถิติสรุป 4 กล่อง */}
          <div className="historyStatsGrid fourCols">
            <div className="statCard">
              <span className="statLabel">ใบเสนอสั่งซื้อทั้งหมด</span>
              <span className="statValue">{totalOrdersCount} รายการ</span>
            </div>
            <div className="statCard pendingCard">
              <span className="statLabel">รออนุมัติ</span>
              <span className="statValue pendingValue">{pendingCount} รายการ</span>
            </div>
            <div className="statCard approvedCard">
              <span className="statLabel">อนุมัติแล้ว</span>
              <span className="statValue approvedValue">{approvedCount} รายการ</span>
            </div>
            <div className="statCard">
              <span className="statLabel">ยอดงบประมาณรวมทั้งหมด</span>
              <span className="statValue money">
                {totalSpent.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                บาท
              </span>
            </div>
          </div>

          {/* ค้นหาและตารางประวัติ */}
          <div className="historyCard">
            <div className="historyToolbar">
              <div className="searchWrapper">
                <Search size={18} className="searchIcon" />
                <input
                  type="text"
                  placeholder="ค้นหาเลขที่ PR, ชื่อสินค้า, รหัสสินค้า, ผู้จัดจำหน่าย, สถานะ..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                />
              </div>

              <button
                type="button"
                className="btnRefreshHistory"
                onClick={loadOrderHistory}
                title="รีเฟรชข้อมูล"
              >
                <RotateCcw size={16} />
                <span>รีเฟรช</span>
              </button>

              <button
                type="button"
                className="btnNewOrderInHistory"
                onClick={() => setActiveTab("order")}
                title="สร้างรายการเสนอสั่งซื้อใหม่"
              >
                <PackagePlus size={16} />
                <span>+ สั่งซื้อสินค้า</span>
              </button>
            </div>

            <div className="historyTableWrapper">
              {isLoadingOrders ? (
                <p className="loadingHistoryText">กำลังโหลดประวัติการเสนอสั่งซื้อ...</p>
              ) : filteredOrders.length === 0 ? (
                <p className="emptyHistoryText">ไม่พบประวัติการเสนอสั่งซื้อสินค้า</p>
              ) : (
                <table className="historyTable">
                  <thead>
                    <tr>
                      <th style={{ width: "45px", textAlign: "center" }}>ลำดับ</th>
                      <th>เลขที่ PR / วันที่</th>
                      <th>สินค้า</th>
                      <th style={{ textAlign: "center" }}>จำนวน</th>
                      <th>ยอดเงินรวม (ต้นทุน)</th>
                      <th>ผู้จัดจำหน่าย / ผู้เสนอ</th>
                      <th style={{ textAlign: "center" }}>สถานะ</th>
                      <th style={{ textAlign: "center", width: "170px" }}>สั่งซื้อ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((o, idx) => {
                      const dateStr = o.created_at
                        ? new Date(o.created_at).toLocaleString("th-TH")
                        : "-";
                      const isPending = o.status === "รออนุมัติ";
                      const isApproved = o.status === "อนุมัติแล้ว";

                      return (
                        <tr key={o.order_id || idx}>
                          <td style={{ textAlign: "center" }}>{idx + 1}</td>
                          <td>
                            <div style={{ fontWeight: 700, color: "#1e40af" }}>
                              {o.order_no}
                            </div>
                            <small style={{ color: "#64748b", fontSize: "11px" }}>
                              {dateStr}
                            </small>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, color: "#0f172a" }}>{o.product_name}</div>
                            <small style={{ color: "#64748b" }}>รหัส: {o.product_id}</small>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <span className="qtyBadge">+{o.quantity} ชิ้น</span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 700, color: "#0f172a" }}>
                              ฿{parseFloat(o.total_cost || 0).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}
                            </div>
                            <small style={{ color: "#64748b", fontSize: "11px" }}>
                              (@ ฿{parseFloat(o.cost_price || 0).toLocaleString()})
                            </small>
                          </td>
                          <td>
                            <div style={{ fontWeight: 500 }}>{o.supplier || "-"}</div>
                            <small style={{ color: "#64748b", fontSize: "11px" }}>
                              โดย: {o.ordered_by || "-"}
                            </small>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <span
                              className={`proposalStatusBadge ${
                                isPending
                                  ? "pending"
                                  : o.status === "ชำระเงินแล้ว"
                                  ? "paid"
                                  : isApproved
                                  ? "approved"
                                  : "success"
                              }`}
                            >
                              {isPending ? (
                                <>
                                  <Clock size={13} />
                                  <span>รออนุมัติ</span>
                                </>
                              ) : o.status === "ชำระเงินแล้ว" ? (
                                <>
                                  <CheckCircle2 size={13} />
                                  <span>ชำระเงินแล้ว</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 size={13} />
                                  <span>อนุมัติแล้ว</span>
                                </>
                              )}
                            </span>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <div className="tableActionBtns">
                              {/* ปุ่มดูใบเสนอราคา (Quotation) */}
                              <button
                                type="button"
                                className="btnQuoteAction"
                                title="ดูใบเสนอราคา (Quotation)"
                                onClick={() => setSelectedQuoteOrder(o)}
                              >
                                <FileText size={14} />
                                <span>ใบเสนอราคา</span>
                              </button>

                              {isPending ? (
                                <>
                                  {/* ปุ่มสั่งซื้อ (ไปหน้าจ่ายเงิน) */}
                                  <button
                                    type="button"
                                    className="btnOrderPaymentAction"
                                    title="คลิกเพื่อสั่งซื้อและดำเนินการชำระเงิน"
                                    onClick={() =>
                                      navigate(`/products/order/payment/${o.order_id}`)
                                    }
                                  >
                                    <ShoppingCart size={15} />
                                    <span>สั่งซื้อ</span>
                                  </button>

                                  {!isStockStaff && (
                                    <button
                                      type="button"
                                      className="btnApproveSmall"
                                      title="อนุมัติและรับสินค้าเข้าสต็อกทันที"
                                      disabled={actionLoadingId === o.order_id}
                                      onClick={() =>
                                        handleApprove(
                                          o.order_id,
                                          o.order_no,
                                          o.product_name,
                                          o.quantity
                                        )
                                      }
                                    >
                                      <Check size={14} />
                                    </button>
                                  )}
                                </>
                              ) : (
                                /* ปุ่มสั่งซื้อซ้ำ */
                                <button
                                  type="button"
                                  className="btnReorderRow"
                                  title="สั่งซื้อสินค้านี้ซ้ำ"
                                  onClick={() => handleReorder(o)}
                                >
                                  <PackagePlus size={14} />
                                  <span>สั่งซื้อซ้ำ</span>
                                </button>
                              )}

                              <button
                                type="button"
                                className="btnDeleteRow"
                                title="ลบรายการนี้"
                                disabled={actionLoadingId === o.order_id}
                                onClick={() => handleDelete(o.order_id, o.order_no)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL เสนอสั่งซื้อสำเร็จ ===================== */}
      {successModalData && (
        <div className="orderModalOverlay">
          <div className="orderSuccessModal">
            <div className="modalIconSuccess">
              <ClipboardList size={44} color="#2563eb" />
            </div>
            <h2>บันทึกใบเสนอการสั่งซื้อสำเร็จ!</h2>
            <p className="modalSub">
              {successModalData.status === "อนุมัติแล้ว"
                ? "รายการได้รับการอนุมัติและอัปเดตสต็อกเรียบร้อยแล้ว"
                : "รายการถูกบันทึกในสถานะ 'รออนุมัติ' เรียบร้อยแล้ว"}
            </p>

            <div className="modalReceiptBox">
              <div className="receiptRow">
                <span>เลขที่ใบเสนอสั่งซื้อ (PR):</span>
                <strong>{successModalData.order_no}</strong>
              </div>
              <div className="receiptRow">
                <span>สินค้า:</span>
                <strong>
                  {successModalData.product_name} ({successModalData.product_id})
                </strong>
              </div>
              <div className="receiptRow">
                <span>จำนวนที่เสนอซื้อ:</span>
                <span className="receiptQty">+{successModalData.quantity} ชิ้น</span>
              </div>
              <div className="receiptRow">
                <span>สถานะใบเสนอซื้อ:</span>
                <span
                  style={{
                    fontWeight: 700,
                    color:
                      successModalData.status === "อนุมัติแล้ว"
                        ? "#16a34a"
                        : "#d97706",
                  }}
                >
                  {successModalData.status}
                </span>
              </div>
              <div className="receiptRow">
                <span>ยอดเงินประมาณการ:</span>
                <strong>
                  {parseFloat(successModalData.total_cost || 0).toLocaleString()}{" "}
                  บาท
                </strong>
              </div>
              <div className="receiptRow">
                <span>ผู้จัดจำหน่าย:</span>
                <span>{successModalData.supplier}</span>
              </div>
            </div>

            <div className="modalActionButtons">
              <button
                type="button"
                className="btnModalQuote"
                style={{
                  background: "#2563eb",
                  color: "white",
                  padding: "10px",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
                onClick={() => {
                  const quoteObj = { ...successModalData };
                  setSuccessModalData(null);
                  setSelectedQuoteOrder(quoteObj);
                }}
              >
                <FileText size={16} />
                <span>ดูใบเสนอราคา (Quotation)</span>
              </button>
              <button
                type="button"
                className="btnModalNewOrder"
                onClick={() => setSuccessModalData(null)}
              >
                ทำรายการเสนอสั่งซื้อเพิ่ม
              </button>
              <button
                type="button"
                className="btnModalViewHistory"
                onClick={() => {
                  setSuccessModalData(null);
                  setActiveTab("history");
                }}
              >
                ดูประวัติการเสนอสั่งซื้อ
              </button>
              <button
                type="button"
                className="btnModalGoProducts"
                onClick={() => navigate("/products")}
              >
                กลับหน้ารายการสินค้า
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL ใบเสนอราคา (QUOTATION ตามรูปที่ 1) ===================== */}
      {selectedQuoteOrder && (
        <div className="quoteModalOverlay" onClick={() => setSelectedQuoteOrder(null)}>
          <div className="quoteModalCard" onClick={(e) => e.stopPropagation()}>
            <div className="quoteModalHeader no-print">
              <div className="quoteModalHeaderTitle">
                <FileText size={18} />
                <h3>ใบเสนอราคา (Quotation)</h3>
                <span className="quoteOrderNoTag">{selectedQuoteOrder.order_no}</span>
              </div>
              <button
                type="button"
                className="btnCloseQuoteModal"
                onClick={() => setSelectedQuoteOrder(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="quoteModalBody">
              {(() => {
                const totalCost = parseFloat(selectedQuoteOrder.total_cost || 0);
                const preVat = totalCost / 1.07;
                const vat = totalCost - preVat;
                const dateObj = new Date(selectedQuoteOrder.created_at || Date.now());
                const dateFormatted = dateObj.toLocaleDateString("th-TH", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                });
                const expireDateObj = new Date(dateObj.getTime() + 7 * 24 * 60 * 60 * 1000);
                const expireDateFormatted = expireDateObj.toLocaleDateString("th-TH", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                });
                const thaiWords = thaiBahtText(totalCost);

                return (
                  <div className="receipt-quote-paper" id="printable-quote">
                    {/* Header */}
                    <div className="quote-header">
                      <div className="quote-brand">
                        <div className="quote-logo-box">PROSOFT</div>
                        <div className="quote-company-title">
                          <h3>บริษัท ตัวอย่าง จำกัด</h3>
                          <p>2571/1 ซ.รามคำแหง 75 ถ.รามคำแหง แขวงหัวหมาก เขตบางกะปิ กรุงเทพฯ 10240</p>
                          <p>โทร. 0-2739-5900 โทรสาร 0-2739-5910 เลขประจำตัวผู้เสียภาษี 31523611000</p>
                        </div>
                      </div>
                      <span className="quote-sheet-no">หน้า 1 / 1</span>
                    </div>

                    {/* Title & Document Box */}
                    <div className="quote-title-bar">
                      <h2>ใบเสนอราคา</h2>
                      <div className="quote-meta-box">
                        <div><strong>เลขที่:</strong> QU-{selectedQuoteOrder.order_no}</div>
                        <div><strong>วันที่:</strong> {dateFormatted}</div>
                      </div>
                    </div>

                    {/* Contact & Terms Grid */}
                    <div className="quote-contact-grid">
                      <div className="quote-contact-left">
                        <div><strong>ชื่อผู้ติดต่อ:</strong> {selectedQuoteOrder.ordered_by || "คุณกาญจนา ศิริ"}</div>
                        <div><strong>ชื่อบริษัท:</strong> {selectedQuoteOrder.supplier || "กรุงเทพผลิตเหล็ก จำกัด (มหาชน)"}</div>
                        <div><strong>โทร.:</strong> 035-214-940-2 &nbsp;&nbsp; <strong>โทรสาร:</strong> 035-271-556</div>
                      </div>
                      <div className="quote-contact-right">
                        <div><strong>วันที่กำหนดส่ง:</strong> {dateFormatted}</div>
                        <div><strong>ยืนราคาภายใน (วัน):</strong> 7 วัน &nbsp;&nbsp; <strong>Expire Date:</strong> {expireDateFormatted}</div>
                        <div><strong>จำนวนวันเครดิต:</strong> 30 วัน</div>
                      </div>
                    </div>

                    {/* Product Items Table */}
                    <table className="quote-table">
                      <thead>
                        <tr>
                          <th style={{ width: "95px" }}>รหัสสินค้า</th>
                          <th>รายการ</th>
                          <th style={{ width: "70px", textAlign: "center" }}>จำนวน</th>
                          <th style={{ width: "60px", textAlign: "center" }}>หน่วย</th>
                          <th style={{ width: "105px", textAlign: "right" }}>ราคา/หน่วย</th>
                          <th style={{ width: "75px", textAlign: "right" }}>ส่วนลด</th>
                          <th style={{ width: "115px", textAlign: "right" }}>จำนวนเงิน</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="font-mono text-xs">{selectedQuoteOrder.product_id || "IC-0001"}</td>
                          <td>
                            <strong>{selectedQuoteOrder.product_name}</strong>
                            {selectedQuoteOrder.category && (
                              <span style={{ fontSize: "11px", color: "#64748b", marginLeft: "6px" }}>
                                ({selectedQuoteOrder.category})
                              </span>
                            )}
                          </td>
                          <td className="text-center">{selectedQuoteOrder.quantity}</td>
                          <td className="text-center">ชิ้น</td>
                          <td className="text-right">
                            {parseFloat(selectedQuoteOrder.cost_price || 0).toFixed(2)}
                          </td>
                          <td className="text-right">0.00</td>
                          <td className="text-right">
                            {totalCost.toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Summary Wrap */}
                    <div className="quote-summary-wrap">
                      <div className="quote-remarks">
                        <strong>หมายเหตุ :</strong>
                        <p>{selectedQuoteOrder.note || "ราคารวมภาษีมูลค่าเพิ่มแล้ว ส่งมอบสินค้าตามกำหนดที่ตกลง"}</p>
                      </div>
                      <div className="quote-calc-box">
                        <div className="quote-row">
                          <span>รวมเงิน</span>
                          <span>{preVat.toFixed(2)}</span>
                        </div>
                        <div className="quote-row">
                          <span>ส่วนลดการค้า</span>
                          <span>0.00</span>
                        </div>
                        <div className="quote-row">
                          <span>เงินหลังหักส่วนลด</span>
                          <span>{preVat.toFixed(2)}</span>
                        </div>
                        <div className="quote-row">
                          <span>ภาษีมูลค่าเพิ่ม 7%</span>
                          <span>{vat.toFixed(2)}</span>
                        </div>
                        <div className="quote-row grand-total">
                          <span>จำนวนเงินทั้งสิ้น</span>
                          <span>{totalCost.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Thai Baht text */}
                    <div className="quote-baht-text">
                      {thaiWords}
                    </div>

                    {/* Signatures */}
                    <div className="quote-signatures-grid">
                      <div className="quote-sig-box">
                        <div className="quote-sig-line" />
                        <div className="sig-name">ผู้อนุมัติซื้อ</div>
                        <div className="sig-date">วันที่ {dateFormatted}</div>
                      </div>
                      <div className="quote-sig-box">
                        <div className="quote-sig-line" />
                        <div className="sig-name">{selectedQuoteOrder.ordered_by || user?.name || "นางสาวอัมพรรณ ปองแก้ว"}</div>
                        <div className="sig-date">พนักงานขาย วันที่ {dateFormatted}</div>
                      </div>
                      <div className="quote-sig-box">
                        <div className="quote-sig-line" />
                        <div className="sig-name">ผู้จัดการฝ่ายขาย</div>
                        <div className="sig-date">วันที่ {dateFormatted}</div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="quoteModalFooter no-print">
              <button
                type="button"
                className="btnPrintQuote"
                onClick={() => window.print()}
              >
                <Printer size={16} />
                <span>พิมพ์ใบเสนอราคา (Print / PDF)</span>
              </button>
              <button
                type="button"
                className="btnCloseQuote"
                onClick={() => setSelectedQuoteOrder(null)}
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
