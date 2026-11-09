// src/modules/sales/screens/SalesScreen.jsx
import { useState, useEffect } from "react";
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  Receipt,
  CheckCircle2,
  History,
  RotateCcw,
  Clock,
  User,
  ShoppingBag,
  Printer,
  FileCheck,
  FileSpreadsheet,
} from "lucide-react";
import { getAllProducts } from "../../../api/productApi";
import { createSale, getSales } from "../../../api/salesApi";
import { useAuth } from "../../auth/AuthContext";
import "./SalesScreen.css";

// ฟังก์ชันแปลงจำนวนเงินตัวเลขเป็นคำอ่านภาษาไทย (เช่น (หนึ่งร้อยเก้าสิบสองบาทถ้วน))
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

export default function SalesScreen() {
  const { user, token } = useAuth();

  // Mode: "pos" (ขายสินค้า) | "history" (ประวัติการขาย)
  const [activeTab, setActiveTab] = useState("pos");

  // สินค้าทั้งหมดจาก MySQL
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // ตะกร้าสินค้า
  const [cart, setCart] = useState([]);
  const [cash, setCash] = useState("");
  const [memberUsername, setMemberUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);

  // รูปแบบใบเสร็จ: 'short' (ฉบับแบบย่อ - สลิป POS) | 'full' (ฉบับแบบเต็ม - ใบกำกับภาษี) | 'quote' (ใบเสนอราคา)
  const [receiptFormat, setReceiptFormat] = useState("short");

  // ประวัติการขาย
  const [salesHistory, setSalesHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedSaleDetail, setSelectedSaleDetail] = useState(null);

  // โหลดรายการสินค้า
  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoadingProducts(true);
    const data = await getAllProducts();
    if (Array.isArray(data)) {
      setProducts(data);
    }
    setLoadingProducts(false);
  }

  // โหลดประวัติการขายเมื่อเปิดแท็บ history
  useEffect(() => {
    if (activeTab === "history") {
      loadSalesHistory();
    }
  }, [activeTab]);

  async function loadSalesHistory() {
    setLoadingHistory(true);
    const data = await getSales(token);
    if (Array.isArray(data)) {
      setSalesHistory(data);
    }
    setLoadingHistory(false);
  }

  // หมวดหมู่สินค้าทั้งหมดที่มี
  const categories = [
    "all",
    ...Array.from(new Set(products.map((p) => p.category).filter(Boolean))),
  ];

  // กรองสินค้าตามค้นหาและหมวดหมู่
  const filteredProducts = products.filter((p) => {
    const matchSearch =
      (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.product_id || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory =
      selectedCategory === "all" || p.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  // เพิ่มสินค้าลงตะกร้า
  const addToCart = (product) => {
    const stock = product.stock_quantity !== undefined && product.stock_quantity !== null
      ? Number(product.stock_quantity)
      : 0;

    // สินค้าจะหมดสต็อกเฉพาะเมื่อ stock <= 0 หรือระบุสถานะว่า 'หมด'
    if (stock <= 0 || product.status === "หมด" || product.status === "inactive") {
      alert(`สินค้า "${product.name}" สินค้าหมดสต็อก ไม่สามารถเพิ่มได้`);
      return;
    }

    const existing = cart.find((item) => item.product_id === product.product_id);
    const currentQty = existing ? existing.qty : 0;
    if (currentQty + 1 > stock) {
      alert(`สินค้า "${product.name}" มีในสต็อกคงเหลือเพียง ${stock} ชิ้น ไม่สามารถเพิ่มเกินจำนวนนี้ได้`);
      return;
    }

    setCart((prev) => {
      if (existing) {
        return prev.map((item) =>
          item.product_id === product.product_id
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          product_id: product.product_id,
          name: product.name,
          category: product.category,
          price: parseFloat(product.price) || 0,
          stock_quantity: stock,
          qty: 1,
        },
      ];
    });
  };

  // ปรับจำนวนในตะกร้า
  const updateQty = (productId, delta) => {
    const product = products.find((p) => p.product_id === productId);
    const stock = product && product.stock_quantity !== undefined ? Number(product.stock_quantity) : 99999;

    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product_id === productId) {
            const newQty = item.qty + delta;
            if (newQty > stock) {
              alert(`สินค้า "${item.name}" มีในสต็อกคงเหลือเพียง ${stock} ชิ้น`);
              return item;
            }
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  // ลบสินค้าออกจากตะกร้า
  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.product_id !== productId));
  };

  // ล้างตะกร้า
  const clearCart = () => {
    if (cart.length > 0 && window.confirm("ต้องการยกเลิกรายการทั้งหมดในตะกร้าหรือไม่?")) {
      setCart([]);
      setCash("");
    }
  };

  // คำนวณยอดรวม
  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  // คำนวณเงินทอน
  const cashNum = cash === "" ? 0 : parseFloat(cash);
  const changeAmount = cashNum >= totalAmount ? cashNum - totalAmount : 0;
  const isCashEnough = cashNum >= totalAmount;

  // ปรับจำนวนเงินด่วน
  const setExactCash = () => setCash(String(totalAmount));
  const addQuickCash = (amount) => {
    const current = parseFloat(cash) || 0;
    setCash(String(current + amount));
  };

  // ดำเนินการชำระเงิน
  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert("กรุณาเลือกสินค้าอย่างน้อย 1 รายการ");
      return;
    }
    if (cash !== "" && cashNum < totalAmount) {
      alert("จำนวนเงินที่รับมาไม่เพียงพอ");
      return;
    }

    setIsSubmitting(true);
    const salePayload = {
      items: cart.map((item) => ({
        product_id: item.product_id,
        qty: item.qty,
      })),
      cash: cash !== "" ? cashNum : totalAmount,
      member_username: memberUsername.trim() || undefined,
    };

    const res = await createSale(salePayload, token);
    setIsSubmitting(false);

    if (res.error) {
      alert(`เกิดข้อผิดพลาด: ${res.error}`);
      return;
    }

    // สำเร็จ แสดงใบเสร็จ
    setLastReceipt(res.sale);
    setCart([]);
    setCash("");
    setMemberUsername("");
    loadProducts(); // โหลดจำนวนสต็อกคงเหลือล่าสุดจาก MySQL
  };

  return (
    <div className="pos-container">
      {/* Header bar */}
      <div className="pos-header">
        <div className="pos-header-info">
          <div className="pos-header-icon">
            <ShoppingCart size={24} />
          </div>
          <div>
            <h2>ระบบขายสินค้า (Point of Sale)</h2>
            <p>บันทึกการขาย ออกใบเสร็จ และตัดข้อมูลสินค้าจากฐานข้อมูล MySQL</p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="pos-tabs">
          <button
            type="button"
            className={`pos-tab-btn ${activeTab === "pos" ? "active" : ""}`}
            onClick={() => setActiveTab("pos")}
          >
            <ShoppingCart size={16} />
            <span>หน้าขายสินค้า</span>
          </button>
          <button
            type="button"
            className={`pos-tab-btn ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            <History size={16} />
            <span>ประวัติการขาย</span>
          </button>
        </div>
      </div>

      {activeTab === "pos" ? (
        <div className="pos-grid">
          {/* ซ้าย: รายการสินค้า */}
          <div className="pos-catalog-panel">
            {/* Search & Category Filter */}
            <div className="pos-filter-bar">
              <div className="pos-search-input">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ หรือรหัสสินค้า..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="pos-category-chips">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`pos-chip ${selectedCategory === cat ? "active" : ""}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat === "all" ? "ทั้งหมด" : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Cards Grid */}
            {loadingProducts ? (
              <div className="pos-loading">กำลังโหลดข้อมูลสินค้าจาก MySQL...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="pos-empty">ไม่พบสินค้าตามที่ค้นหา</div>
            ) : (
              <div className="pos-product-grid">
                {filteredProducts.map((p) => {
                  const stock = p.stock_quantity !== undefined && p.stock_quantity !== null
                    ? Number(p.stock_quantity)
                    : 0;
                  // สินค้ามีของพร้อมขายหาก stock > 0 และไม่ถูกกำหนดเป็น 'หมด'
                  const inStock = stock > 0 && p.status !== "หมด" && p.status !== "inactive";
                  const inCartItem = cart.find((item) => item.product_id === p.product_id);

                  return (
                    <div
                      key={p.product_id}
                      className={`pos-product-card ${!inStock ? "disabled" : ""}`}
                      onClick={() => inStock && addToCart(p)}
                      title={!inStock ? "สินค้าหมดสต็อก" : `คลิกเพื่อเพิ่มลงตะกร้า (คงเหลือ ${stock} ชิ้น)`}
                    >
                      <div className="pos-card-head">
                        <span className="pos-card-id">{p.product_id}</span>
                        <span className="pos-card-cat">{p.category || "ทั่วไป"}</span>
                      </div>
                      <h4 className="pos-card-name">{p.name}</h4>

                      {/* แสดงสต็อกคงเหลือ */}
                      <div style={{ margin: "4px 0 10px", fontSize: "12px", display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#64748b" }}>คงเหลือ:</span>
                        <strong style={{ color: stock <= 0 ? "#dc2626" : stock <= 10 ? "#d97706" : "#059669" }}>
                          {stock} ชิ้น
                        </strong>
                      </div>

                      {/* แสดงสถานะสต็อก */}
                      <div className="pos-card-foot">
                        <span className="pos-card-price">
                          ฿{parseFloat(p.price).toLocaleString()}
                        </span>
                        <span
                          className={`pos-stock-badge ${
                            !inStock ? "stock-out" : stock < 10 ? "stock-low" : "stock-ok"
                          }`}
                        >
                          {!inStock ? "หมด" : stock < 10 ? "ใกล้หมด" : "มีสินค้า"}
                        </span>
                      </div>
                      {inCartItem && (
                        <div className="pos-in-cart-pill">
                          ในตะกร้า: {inCartItem.qty}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ขวา: ตะกร้าและคิดเงิน */}
          <div className="pos-cart-panel">
            <div className="pos-cart-header">
              <div className="pos-cart-title">
                <Receipt size={20} />
                <h3>รายการที่เลือก ({totalItems})</h3>
              </div>
              {cart.length > 0 && (
                <button type="button" className="pos-btn-clear" onClick={clearCart}>
                  <RotateCcw size={14} /> ล้าง
                </button>
              )}
            </div>

            {/* รายการในตะกร้า */}
            <div className="pos-cart-items">
              {cart.length === 0 ? (
                <div className="pos-cart-empty">
                  <ShoppingBag size={48} />
                  <p>ยังไม่มีสินค้าในตะกร้า</p>
                  <span>คลิกสินค้าจากฝั่งซ้ายเพื่อเพิ่มลงในรายการ</span>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product_id} className="pos-cart-row">
                    <div className="pos-cart-item-info">
                      <div className="pos-cart-item-name">{item.name}</div>
                      <div className="pos-cart-item-sub">
                        ฿{item.price.toLocaleString()} × {item.qty}
                      </div>
                    </div>

                    <div className="pos-cart-controls">
                      <button
                        type="button"
                        className="pos-qty-btn"
                        onClick={() => updateQty(item.product_id, -1)}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="pos-qty-value">{item.qty}</span>
                      <button
                        type="button"
                        className="pos-qty-btn"
                        onClick={() => updateQty(item.product_id, 1)}
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <div className="pos-cart-row-total">
                      ฿{(item.price * item.qty).toLocaleString()}
                    </div>

                    <button
                      type="button"
                      className="pos-cart-btn-del"
                      onClick={() => removeFromCart(item.product_id)}
                      title="ลบรายการนี้"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* สรุปยอดและรับเงิน */}
            <div className="pos-checkout-section">
              <div className="pos-summary-box">
                <div className="pos-summary-row">
                  <span>จำนวนรวม</span>
                  <strong>{totalItems} ชิ้น</strong>
                </div>
                <div className="pos-summary-row" style={{ color: "#059669", fontWeight: 700 }}>
                  <span>แต้มสะสมสมาชิก (50฿ = 5 แต้ม)</span>
                  <strong>+{Math.floor(totalAmount / 50) * 5} แต้ม</strong>
                </div>
                <div className="pos-summary-row total-row">
                  <span>ยอดชำระสุทธิ</span>
                  <span className="pos-grand-total">
                    ฿{totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* ระบุสมาชิกเพื่อสะสมแต้ม (3.3 & 3.5) */}
              <div className="pos-cash-box" style={{ marginBottom: 10 }}>
                <label className="pos-cash-label">สะสมแต้มให้สมาชิก (Username / เบอร์โทร / รหัสสมาชิก)</label>
                <div className="pos-cash-input-wrap">
                  <input
                    type="text"
                    placeholder="เช่น member1 หรือเบอร์โทร (ไม่บังคับ)"
                    value={memberUsername}
                    onChange={(e) => setMemberUsername(e.target.value)}
                    disabled={cart.length === 0}
                  />
                </div>
              </div>

              {/* ชำระด้วยเงินสด */}
              <div className="pos-cash-box">
                <label className="pos-cash-label">รับเงินสด (บาท)</label>
                <div className="pos-cash-input-wrap">
                  <input
                    type="number"
                    min="0"
                    placeholder={`฿${totalAmount.toLocaleString()}`}
                    value={cash}
                    onChange={(e) => setCash(e.target.value)}
                    disabled={cart.length === 0}
                  />
                  <button
                    type="button"
                    className="pos-exact-btn"
                    onClick={setExactCash}
                    disabled={cart.length === 0}
                  >
                    พอดี
                  </button>
                </div>

                {/* Quick cash buttons */}
                <div className="pos-quick-cash">
                  {[20, 50, 100, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      className="pos-quick-btn"
                      onClick={() => addQuickCash(amt)}
                      disabled={cart.length === 0}
                    >
                      +{amt}
                    </button>
                  ))}
                </div>

                {/* แสดงเงินทอน */}
                {cart.length > 0 && cash !== "" && (
                  <div
                    className={`pos-change-banner ${
                      isCashEnough ? "change-ok" : "change-short"
                    }`}
                  >
                    {isCashEnough ? (
                      <>
                        <span>เงินทอน:</span>
                        <strong>฿{changeAmount.toLocaleString()}</strong>
                      </>
                    ) : (
                      <>
                        <span>เงินยังขาดอีก:</span>
                        <strong>฿{(totalAmount - cashNum).toLocaleString()}</strong>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* ปุ่มยืนยันการขาย */}
              <button
                type="button"
                className="pos-checkout-btn"
                onClick={handleCheckout}
                disabled={
                  cart.length === 0 ||
                  isSubmitting ||
                  (cash !== "" && !isCashEnough)
                }
              >
                <CheckCircle2 size={18} />
                <span>
                  {isSubmitting
                    ? "กำลังบันทึกข้อมูล..."
                    : `ชำระเงิน ฿${totalAmount.toLocaleString()}`}
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* แท็บประวัติการขาย */
        <div className="pos-history-panel">
          <div className="pos-history-head">
            <h3>ประวัติการขายสินค้า (ล่าสุด 100 รายการ)</h3>
            <button
              type="button"
              className="pos-refresh-btn"
              onClick={loadSalesHistory}
            >
              <RotateCcw size={14} /> โหลดใหม่
            </button>
          </div>

          {loadingHistory ? (
            <div className="pos-loading">กำลังโหลดประวัติการขาย...</div>
          ) : salesHistory.length === 0 ? (
            <div className="pos-empty">ยังไม่มีประวัติการขายในระบบ</div>
          ) : (
            <div className="pos-history-table-wrap">
              <table className="pos-history-table">
                <thead>
                  <tr>
                    <th>เลขที่ / คำสั่งซื้อ</th>
                    <th>ช่องทาง</th>
                    <th>วันที่ / เวลา</th>
                    <th>ผู้ขาย / ลูกค้า</th>
                    <th>จำนวนรายการ</th>
                    <th>ยอดรวม</th>
                    <th>วิธีชำระ / รับเงิน</th>
                    <th>สถานะ</th>
                    <th>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {salesHistory.map((s) => (
                    <tr key={s.id || s.sale_id}>
                      <td style={{ fontWeight: 600 }}>{s.sale_no}</td>
                      <td>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "3px 8px",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            backgroundColor: s.order_type === "online" ? "#eff6ff" : "#f1f5f9",
                            color: s.order_type === "online" ? "#1d4ed8" : "#475569",
                            border: `1px solid ${s.order_type === "online" ? "#bfdbfe" : "#e2e8f0"}`,
                          }}
                        >
                          {s.order_type === "online" ? "🌐 ออนไลน์ (ลูกค้า)" : "🏬 หน้าร้าน (POS)"}
                        </span>
                      </td>
                      <td>
                        <div className="pos-history-time">
                          <Clock size={12} />
                          {new Date(s.created_at).toLocaleString("th-TH")}
                        </div>
                      </td>
                      <td>
                        <div className="pos-history-user">
                          <User size={12} />
                          <span>{s.customer_name && s.customer_name !== "-" ? s.customer_name : (s.seller_name || "-")}</span>
                        </div>
                      </td>
                      <td>{s.items?.length || 0} รายการ</td>
                      <td style={{ fontWeight: 700, color: "#059669" }}>
                        ฿{parseFloat(s.total).toLocaleString()}
                      </td>
                      <td>
                        <div style={{ fontSize: 13 }}>
                          {s.order_type === "online"
                            ? s.payment_method || "พร้อมเพย์"
                            : `เงินสด (ทอน ฿${parseFloat(s.change_amount || 0).toLocaleString()})`}
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 8px",
                            borderRadius: 9999,
                            fontSize: 11,
                            fontWeight: 600,
                            backgroundColor:
                              s.status === "สำเร็จ"
                                ? "#ecfdf5"
                                : s.status === "รอดำเนินการ"
                                ? "#fef3c7"
                                : "#f3f4f6",
                            color:
                              s.status === "สำเร็จ"
                                ? "#059669"
                                : s.status === "รอดำเนินการ"
                                ? "#d97706"
                                : "#4b5563",
                          }}
                        >
                          {s.status || "สำเร็จ"}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="pos-view-receipt-btn"
                          onClick={() => setSelectedSaleDetail(s)}
                        >
                          <Receipt size={14} /> ดูใบเสร็จ
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal ใบเสร็จ (ตามตัวอย่าง: ฉบับย่อสลิป / ฉบับเต็ม A4 / ใบเสนอราคา) */}
      {(lastReceipt || selectedSaleDetail) && (
        <div
          className="pos-modal-backdrop"
          onClick={() => {
            setLastReceipt(null);
            setSelectedSaleDetail(null);
          }}
        >
          <div
            className={`pos-receipt-modal ${receiptFormat === "full" ? "modal-wide" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Format Switcher Tabs */}
            <div className="receipt-format-switcher no-print">
              <button
                type="button"
                className={`format-tab-btn ${receiptFormat === "short" ? "active" : ""}`}
                onClick={() => setReceiptFormat("short")}
              >
                <Receipt size={14} />
                <span>ฉบับแบบย่อ (สลิป)</span>
              </button>
              <button
                type="button"
                className={`format-tab-btn ${receiptFormat === "full" ? "active" : ""}`}
                onClick={() => setReceiptFormat("full")}
              >
                <FileCheck size={14} />
                <span>ฉบับแบบเต็ม (ใบกำกับภาษี)</span>
              </button>
            </div>

            {(() => {
              const rec = lastReceipt || selectedSaleDetail;
              const total = parseFloat(rec.total || 0);
              const totalQty = rec.items
                ? rec.items.reduce((s, i) => s + (parseInt(i.qty, 10) || 1), 0)
                : 0;
              const preVat = total / 1.07;
              const vat = total - preVat;
              const dateObj = new Date(rec.created_at || Date.now());
              const dateFormatted = dateObj.toLocaleDateString("th-TH", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              });
              const timeFormatted = dateObj.toLocaleTimeString("th-TH", {
                hour: "2-digit",
                minute: "2-digit",
              });
              const thaiWords = thaiBahtText(total);

              return (
                <div className="pos-receipt-paper-wrapper">
                  {/* ======================================================== */}
                  {/* รูปแบบที่ 1: ฉบับแบบย่อ (ตามรูปที่ 3 - สไตล์ 7-Eleven) */}
                  {/* ======================================================== */}
                  {receiptFormat === "short" && (
                    <div className="receipt-thermal-paper" id="printable-receipt">
                      <div className="thermal-header text-center">
                        <div className="thermal-store-name">CP ALL, 7-Eleven PTTOR ค่ายกฤษณ์สีวะระ (15035)</div>
                        <div className="thermal-tax">TAX#0107542000011 (VAT Included)</div>
                        <div className="thermal-sub">Vat Code 12777 POS#E104700002A0472</div>
                        <div className="thermal-title">ใบเสร็จรับเงิน/ใบกำกับภาษีอย่างย่อ</div>
                      </div>

                      <div className="thermal-divider-dashed" />

                      <div className="thermal-items">
                        {rec.items?.map((item, idx) => (
                          <div key={idx} className="thermal-item-line">
                            <span className="thermal-qty">{item.qty}</span>
                            <span className="thermal-name">{item.name || item.product_name}</span>
                            <span className="thermal-unit-price">
                              @{parseFloat(item.price).toFixed(2)}
                            </span>
                            <span className="thermal-subtotal">
                              {(item.price * item.qty).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="thermal-divider-dashed" />

                      <div className="thermal-totals">
                        <div className="thermal-row">
                          <span>ยอดรวม</span>
                          <span>{total.toFixed(2)}</span>
                        </div>
                        <div className="thermal-row font-bold">
                          <span>ยอดสุทธิ &nbsp; {totalQty} ชิ้น</span>
                          <span>{total.toFixed(2)}</span>
                        </div>
                        <div className="thermal-row">
                          <span>รับเงิน (Cash)</span>
                          <span>{parseFloat(rec.cash || total).toFixed(2)}</span>
                        </div>
                        <div className="thermal-row">
                          <span>เงินทอน</span>
                          <span>{parseFloat(rec.change_amount || 0).toFixed(2)}</span>
                        </div>
                        <div className="thermal-row vat-note">
                          <span>(VAT 7% รวมในยอดแล้ว {vat.toFixed(2)} บาท)</span>
                        </div>
                      </div>

                      <div className="thermal-divider-dashed" />

                      <div className="thermal-meta">
                        <div>TID#2025120500000004208011962</div>
                        <div>
                          R#{rec.sale_no} : 1503558 &nbsp; {dateFormatted} {timeFormatted}
                        </div>
                        <div className="thermal-member-service">
                          * ศูนย์บริการสมาชิก All Member 0-2826-7777 *
                        </div>
                        <div className="thermal-digital-sign">
                          Digitally Signed By บริษัท ซีพี ออลล์ จำกัด (มหาชน)
                          <br />
                          เอกสารฉบับนี้ได้จัดทำและส่งข้อมูลให้แก่กรมสรรพากรด้วยวิธีการทางอิเล็กทรอนิกส์
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ======================================================== */}
                  {/* รูปแบบที่ 2: ฉบับแบบเต็ม (ตามรูปที่ 2 - ใบเสร็จรับเงิน/ใบกำกับภาษี) */}
                  {/* ======================================================== */}
                  {receiptFormat === "full" && (
                    <div className="receipt-full-paper" id="printable-receipt">
                      <div className="full-header">
                        <h2 className="full-doc-title">ใบเสร็จรับเงิน/ใบกำกับภาษี</h2>
                        <span className="full-sheet-no">แผ่นที่ 1/1</span>
                      </div>

                      <div className="full-company-info">
                        <div className="full-company-name">บมจ. ซีพี ออลล์</div>
                        <div>313 อาคาร ซี.พี.ทาวเวอร์ ชั้น24 ถ.สีลม แขวงสีลม เขตบางรัก กรุงเทพฯ 10500</div>
                        <div className="full-split-row">
                          <span>เลขประจำตัวผู้เสียภาษีอากร 0107542000011</span>
                          <span><strong>เลขที่</strong> {rec.sale_no}</span>
                        </div>
                        <div className="full-split-row">
                          <span>สาขาที่ออกใบกำกับภาษี : 07875 สาขา 7-Eleven สกลนคร 1 Vat Code (06021)</span>
                          <span>อัตราภาษีมูลค่าเพิ่ม 7.00%</span>
                        </div>
                        <div className="full-split-row">
                          <span>เป็นการยกเลิกใบกำกับภาษีอย่างย่อเลขที่ : {rec.sale_no} วันที่ {dateFormatted}</span>
                          <span><strong>วันที่</strong> {dateFormatted}</span>
                        </div>
                        <div>และออกใบกำกับภาษีอิเล็กทรอนิกส์ใหม่แทน</div>
                      </div>

                      <div className="full-buyer-info">
                        <div><strong>เลขประจำตัวผู้เสียภาษีอากร:</strong> 0105556123456 (บุคคลธรรมดา)</div>
                        <div className="full-split-row">
                          <span><strong>ชื่อผู้ซื้อสินค้า :</strong> {rec.customer_name && rec.customer_name !== "-" ? rec.customer_name : "ศิริพร ทับทิม"}</span>
                          <span><strong>เบอร์โทรศัพท์ :</strong> {rec.customer_phone && rec.customer_phone !== "-" ? rec.customer_phone : "082-345-6789"}</span>
                        </div>
                        <div><strong>ที่อยู่ :</strong> {rec.shipping_address && rec.shipping_address !== "-" ? rec.shipping_address : "88/12 หมู่ 4 ต.ธาตุเชิงชุม อ.เมืองสกลนคร จ.สกลนคร 47000"}</div>
                      </div>

                      <table className="full-table">
                        <thead>
                          <tr>
                            <th style={{ width: "45px", textAlign: "center" }}>NO.</th>
                            <th style={{ width: "65px", textAlign: "center" }}>จำนวน</th>
                            <th>รายการสินค้า</th>
                            <th style={{ width: "110px", textAlign: "right" }}>ราคาต่อหน่วย</th>
                            <th style={{ width: "135px", textAlign: "right" }}>ราคารวมภาษีมูลค่าเพิ่ม</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rec.items?.map((item, idx) => (
                            <tr key={idx}>
                              <td className="text-center">{idx + 1}</td>
                              <td className="text-center">{item.qty}</td>
                              <td>{item.name || item.product_name}</td>
                              <td className="text-right">{parseFloat(item.price).toFixed(2)}</td>
                              <td className="text-right">{(item.price * item.qty).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div className="full-summary-grid">
                        <div className="full-notes">
                          <div><strong>หมายเหตุ :</strong> 1. N = สินค้าได้รับการยกเว้นภาษีมูลค่าเพิ่ม, P = สินค้าจัดรายการส่งเสริมการขาย</div>
                          <div>2. หากพ้นกำหนดเวลา 7 วันนับจากวันที่ในเอกสารฉบับนี้ ทางบริษัทขอสงวนสิทธิ์ในการเปลี่ยนแปลงหรือแก้ไข</div>
                          <div>3. ข้อความ'สำนักงานใหญ่/สาขาที่' ของผู้ซื้อ ใช้กรณีผู้ซื้อที่เป็นนิติบุคคลเท่านั้น</div>
                          <div>4. หากมีข้อสงสัยเกี่ยวกับการบริการและสินค้าสามารถติดต่อได้ที่ศูนย์ลูกค้าสัมพันธ์ Tel. 02-826-7744</div>
                        </div>

                        <div className="full-totals-box">
                          <div className="full-tot-row">
                            <span>มูลค่าสินค้ารวม</span>
                            <span>{total.toFixed(2)}</span>
                          </div>
                          <div className="full-tot-row">
                            <span>หักส่วนลด</span>
                            <span>0.00</span>
                          </div>
                          <div className="full-tot-row">
                            <span>ส่วนลดที่ได้ทั้งหมด</span>
                            <span>0.00</span>
                          </div>
                          <div className="full-tot-row">
                            <span>มูลค่าสินค้าก่อนภาษีมูลค่าเพิ่ม</span>
                            <span>{preVat.toFixed(2)}</span>
                          </div>
                          <div className="full-tot-row">
                            <span>ภาษีมูลค่าเพิ่ม 7%</span>
                            <span>{vat.toFixed(2)}</span>
                          </div>
                          <div className="full-tot-row">
                            <span>มูลค่าสินค้ารวมภาษีมูลค่าเพิ่ม</span>
                            <span>{total.toFixed(2)}</span>
                          </div>
                          <div className="full-tot-row grand-total">
                            <span>รวมเงินทั้งสิ้น</span>
                            <span>{total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="full-baht-text">
                        {thaiWords}
                      </div>

                      <div className="full-footer">
                        Digitally Signed By บริษัท ซีพี ออลล์ จำกัด (มหาชน)
                        <br />
                        เอกสารฉบับนี้ได้จัดทำและส่งข้อมูลให้แก่กรมสรรพากรด้วยวิธีการทางอิเล็กทรอนิกส์
                      </div>
                    </div>
                  )}

                  {/* Actions (พิมพ์ / ปิด) */}
                  <div className="pos-receipt-actions no-print">
                    <button
                      type="button"
                      className="pos-btn-print"
                      onClick={() => window.print()}
                    >
                      <Printer size={16} />
                      <span>พิมพ์เอกสาร (Print / PDF)</span>
                    </button>
                    <button
                      type="button"
                      className="pos-btn-close-receipt"
                      onClick={() => {
                        setLastReceipt(null);
                        setSelectedSaleDetail(null);
                      }}
                    >
                      ปิดหน้าต่าง
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
