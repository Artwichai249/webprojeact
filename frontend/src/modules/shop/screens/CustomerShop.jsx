// src/modules/shop/screens/CustomerShop.jsx
import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  ShoppingCart,
  Store,
  Package,
  Truck,
  CreditCard,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Plus,
  Minus,
  Trash2,
  QrCode,
  MapPin,
  User,
  Phone,
  ArrowRight,
  Printer,
  X,
  FileText,
  Sparkles,
  Check,
  XCircle,
} from "lucide-react";
import { getAllProducts } from "../../../api/productApi";
import {
  createCustomerOrder,
  getCustomerOrders,
  getCustomerOrderById,
  getExistingPhones,
  updateCustomerOrderStatus,
} from "../../../api/customerOrderApi";
import { useAuth } from "../../auth/AuthContext";
import "./CustomerShop.css";

export default function CustomerShop() {
  const navigate = useNavigate();
  const { user, token, isAdmin, updateCurrentUser } = useAuth();

  const isSalesStaff =
    isAdmin ||
    user?.username === "admin2" ||
    (user?.role && (user.role.includes("sales") || user.role.includes("ขาย"))) ||
    (user?.name && (user.name.includes("sales") || user.name.includes("ขาย")));

  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  // Tab: "catalog" (เลือกซื้อสินค้า) | "cart" (ตะกร้าและสั่งซื้อ) | "orders" (ประวัติคำสั่งซื้อ)
  const [activeTab, setActiveTab] = useState("catalog");

  // สินค้าทั้งหมด
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // ตะกร้าสินค้า
  const [cart, setCart] = useState([]);
  const [addedNotice, setAddedNotice] = useState(null); // Feedback เมื่อเพิ่มสินค้า

  // ฟอร์มสั่งซื้อและที่อยู่จัดส่ง
  const [checkoutForm, setCheckoutForm] = useState({
    customer_name: user?.name || user?.username || "",
    customer_phone: user?.phone || "",
    shipping_address: "",
    payment_method: "พร้อมเพย์ / PromptPay",
    shipping_fee: 0,
    note: "",
  });

  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderSuccessData, setOrderSuccessData] = useState(null);

  // ประวัติคำสั่งซื้อ
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);

  // รายการเบอร์โทรศัพท์ที่มีอยู่ในระบบ
  const [existingPhones, setExistingPhones] = useState([]);

  useEffect(() => {
    loadProducts();
    loadExistingPhones();
  }, [token]);

  async function loadExistingPhones() {
    try {
      const data = await getExistingPhones(token);
      if (Array.isArray(data) && data.length > 0) {
        setExistingPhones(data);
        setCheckoutForm((prev) => {
          if (!prev.customer_phone && data[0]?.phone) {
            return {
              ...prev,
              customer_phone: data[0].phone,
              shipping_address: prev.shipping_address || data[0].address || "",
            };
          }
          return prev;
        });
      }
    } catch (e) {
      console.error("Error loading existing phones:", e);
    }
  }

  function handleSelectExistingPhone(phoneNum) {
    if (!phoneNum) return;
    const cleanDigits = phoneNum.replace(/\D/g, "").slice(0, 10);
    const matched = existingPhones.find((p) => p.phone === cleanDigits);
    setCheckoutForm((prev) => ({
      ...prev,
      customer_phone: cleanDigits,
      customer_name: matched?.name || matched?.username || prev.customer_name,
      shipping_address: matched?.address ? matched.address : prev.shipping_address,
    }));
  }

  function handlePhoneInputChange(digits) {
    const matched = existingPhones.find((p) => p.phone === digits);
    setCheckoutForm((prev) => ({
      ...prev,
      customer_phone: digits,
      ...(matched && (!prev.customer_name || prev.customer_name === user?.name || prev.customer_name === user?.username)
        ? { customer_name: matched.name || prev.customer_name }
        : {}),
      ...(matched && !prev.shipping_address && matched.address
        ? { shipping_address: matched.address }
        : {}),
    }));
  }

  useEffect(() => {
    if (user) {
      setCheckoutForm((prev) => ({
        ...prev,
        customer_name: user.name || user.username || "",
        customer_phone: user.phone ? user.phone.replace(/\D/g, "").slice(0, 10) : prev.customer_phone,
      }));
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === "orders") {
      loadCustomerOrders();
    }
  }, [activeTab]);

  async function loadProducts() {
    setLoadingProducts(true);
    const data = await getAllProducts();
    if (Array.isArray(data)) {
      setProducts(data);
    }
    setLoadingProducts(false);
  }

  async function loadCustomerOrders() {
    setLoadingOrders(true);
    // พนักงานขายและ Admin ดึงคำสั่งซื้อทั้งหมดเพื่อให้ตรวจสอบและอนุมัติสินค้าได้
    const data = await getCustomerOrders(token, isSalesStaff);
    if (Array.isArray(data)) {
      setOrders(data);
    }
    setLoadingOrders(false);
  }

  // คำสั่งซื้อที่นำมาแสดง: ถ้าเป็นพนักงานขาย/Admin แสดงคำสั่งซื้อที่เข้ามาในระบบทั้งหมดเพื่อให้กดยืนยันสินค้า/อนุมัติได้
  // แต่ถ้าเป็นลูกค้า/สมาชิกทั่วไป ให้แสดงเฉพาะของตนเอง
  const displayedOrders = useMemo(() => {
    if (!Array.isArray(orders)) return [];
    if (!user) return orders;
    if (isSalesStaff) return orders;

    const currentUsername = (user.username || "").trim().toLowerCase();
    const currentUserId = user.id !== undefined && user.id !== null ? String(user.id).trim() : "";

    return orders.filter((o) => {
      const orderUsername = (o.customer_username || "").trim().toLowerCase();
      const orderCustId =
        o.customer_id !== undefined && o.customer_id !== null ? String(o.customer_id).trim() : "";
      return (
        (currentUsername && orderUsername === currentUsername) ||
        (currentUserId && orderCustId === currentUserId)
      );
    });
  }, [orders, user, isSalesStaff]);

  const handleUpdateStatus = async (orderId, newStatus, orderNo) => {
    const actionLabel =
      newStatus === "อนุมัติแล้ว"
        ? "ยืนยันสินค้าและอนุมัติคำสั่งซื้อ"
        : newStatus === "กำลังจัดส่ง"
        ? "เปลี่ยนสถานะเป็นกำลังจัดส่งสินค้า"
        : newStatus === "สำเร็จ"
        ? "เปลี่ยนสถานะเป็นสำเร็จเรียบร้อย"
        : "ยกเลิกคำสั่งซื้อ";

    if (!window.confirm(`ต้องการ "${actionLabel}" สำหรับคำสั่งซื้อ ${orderNo || orderId} ใช่หรือไม่?`)) {
      return;
    }

    setUpdatingOrderId(orderId);
    try {
      const res = await updateCustomerOrderStatus(orderId, newStatus, token);
      if (res && !res.error) {
        alert(`คำสั่งซื้อ ${orderNo || orderId} ถูกปรับสถานะเป็น "${newStatus}" เรียบร้อยแล้ว`);
        setOrders((prev) =>
          prev.map((o) => (o.order_id === orderId ? { ...o, status: newStatus } : o))
        );
        setSelectedOrderDetail((prev) =>
          prev && prev.order_id === orderId ? { ...prev, status: newStatus } : prev
        );
      } else {
        alert(res?.error || "ไม่สามารถอัปเดตสถานะได้");
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // ดึงหมวดหมู่สินค้าทั้งหมด
  const categories = [
    "all",
    ...Array.from(new Set(products.map((p) => p.category).filter(Boolean))),
  ];

  // กรองรายการสินค้า
  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCategory === "all" || p.category === selectedCategory;
    const matchSearch =
      (p.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.product_id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.category || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  // เพิ่มสินค้าลงในตะกร้า
  const addToCart = (product) => {
    const stock =
      product.stock_quantity !== undefined && product.stock_quantity !== null
        ? Number(product.stock_quantity)
        : 0;

    if (stock <= 0 || product.status === "หมด") {
      alert(`ขออภัย สินค้า "${product.name}" สินค้าหมดชั่วคราว`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === product.product_id);
      if (existing) {
        if (existing.qty + 1 > stock) {
          alert(`ขออภัย สินค้า "${product.name}" มีจำนวนในสต็อกคงเหลือ ${stock} ชิ้น`);
          return prev;
        }
        return prev.map((i) =>
          i.product_id === product.product_id ? { ...i, qty: i.qty + 1 } : i
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

    // แสดงแจ้งเตือนเพิ่มสินค้าสำเร็จชั่วคราว
    setAddedNotice(product.name);
    setTimeout(() => {
      setAddedNotice((curr) => (curr === product.name ? null : curr));
    }, 2000);
  };

  // ปรับจำนวนสินค้าในตะกร้า
  const updateCartQty = (productId, delta) => {
    const item = cart.find((i) => i.product_id === productId);
    if (!item) return;

    const newQty = item.qty + delta;
    if (newQty > item.stock_quantity) {
      alert(`สินค้าชิ้นนี้มีในสต็อกคงเหลือ ${item.stock_quantity} ชิ้น`);
      return;
    }

    if (newQty <= 0) {
      removeFromCart(productId);
    } else {
      setCart((prev) =>
        prev.map((i) => (i.product_id === productId ? { ...i, qty: newQty } : i))
      );
    }
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((i) => i.product_id !== productId));
  };

  const clearCart = () => {
    if (window.confirm("ต้องการนำสินค้าทั้งหมดออกจากตะกร้าหรือไม่?")) {
      setCart([]);
    }
  };

  // คำนวณยอดเงินรวมในตะกร้า
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const totalCartQty = cart.reduce((sum, item) => sum + item.qty, 0);
  // ฟรีค่าจัดส่งเมื่อสั่งซื้อครบ 500 บาท หรือคิด 35 บาท
  const shippingFee = cartSubtotal >= 500 || cartSubtotal === 0 ? 0 : 35;
  const grandTotal = cartSubtotal + shippingFee;

  // ส่งคำสั่งซื้อสินค้า
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert("กรุณาเลือกสินค้าลงตะกร้าก่อนทำการสั่งซื้อ");
      return;
    }
    if (!checkoutForm.shipping_address.trim()) {
      alert("กรุณากรอกที่อยู่สำหรับจัดส่งสินค้าให้ครบถ้วน");
      return;
    }
    if (!checkoutForm.customer_name.trim() || !checkoutForm.customer_phone.trim()) {
      alert("กรุณาระบุชื่อผู้รับและเบอร์โทรศัพท์ติดต่อ");
      return;
    }

    const cleanPhone = checkoutForm.customer_phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      alert("เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลักเท่านั้น (เช่น 0812345678)");
      return;
    }

    setIsSubmittingOrder(true);
    const payload = {
      items: cart.map((i) => ({
        product_id: i.product_id,
        qty: i.qty,
      })),
      customer_name: checkoutForm.customer_name.trim(),
      customer_phone: cleanPhone,
      shipping_address: checkoutForm.shipping_address.trim(),
      payment_method: checkoutForm.payment_method,
      shipping_fee: shippingFee,
      note: checkoutForm.note,
    };

    const res = await createCustomerOrder(payload, token);
    setIsSubmittingOrder(false);

    if (res.error) {
      alert(`ไม่สามารถทำรายการได้: ${res.error}`);
      return;
    }

    // หากชำระผ่านยอดเงินในบัญชี ให้อัปเดตยอดเงินใน auth state ทันที
    if (checkoutForm.payment_method === "หักจากยอดเงินในบัญชีลูกค้า" && updateCurrentUser) {
      const remaining = Math.max(0, (user?.wallet_balance || 0) - grandTotal);
      updateCurrentUser({ wallet_balance: remaining });
    }

    // สำเร็จ
    setOrderSuccessData(res.order);
    setCart([]);
    loadProducts(); // รีเฟรชสต็อกสินค้า
  };

  return (
    <div className={`shopContainer ${selectedOrderDetail ? "has-open-receipt" : ""}`}>
      {/* Toast Alert เมื่อกดเพิ่มสินค้าลงตะกร้า */}
      {addedNotice && (
        <div className="shopToast">
          <CheckCircle2 size={18} />
          <span>เพิ่ม <strong>"{addedNotice}"</strong> ลงตะกร้าแล้ว</span>
        </div>
      )}

      {/* Hero Banner Header */}
      <div className="shopHero">
        <div className="shopHeroContent">
          <div className="shopHeroIcon">
            <Store size={32} />
          </div>
          <div className="shopHeroText">
            <div className="shopHeroBadge">
              <Sparkles size={13} />
              <span>ระบบสั่งซื้อสินค้าออนไลน์สำหรับลูกค้า</span>
            </div>
            <h1>ร้านค้าออนไลน์คุณภาพ (Online Store)</h1>
            <p>
              ยินดีต้อนรับคุณ <strong>{user?.name || user?.username}</strong> — เลือกซื้อสินค้าคุณภาพ จัดส่งตรงถึงบ้านคุณ
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="shopNavTabs">
          <button
            type="button"
            className={`shopTabBtn ${activeTab === "catalog" ? "active" : ""}`}
            onClick={() => setActiveTab("catalog")}
          >
            <ShoppingBag size={17} />
            <span>เลือกดูสินค้า</span>
          </button>

          <button
            type="button"
            className={`shopTabBtn ${activeTab === "cart" ? "active" : ""}`}
            onClick={() => setActiveTab("cart")}
          >
            <ShoppingCart size={17} />
            <span>ตะกร้าของฉัน</span>
            {totalCartQty > 0 && <span className="cartBadgeCount">{totalCartQty}</span>}
          </button>

          <button
            type="button"
            className={`shopTabBtn ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            <Package size={17} />
            <span>ประวัติการสั่งซื้อ</span>
            {orders.length > 0 && <span className="ordersBadgeCount">{orders.length}</span>}
          </button>

          <Link
            to="/loyalty"
            className="shopTabBtn"
            style={{ textDecoration: "none", background: "rgba(255,255,255,0.22)", color: "#fff" }}
          >
            <Sparkles size={17} />
            <span>แต้มสะสม & ของขวัญปีใหม่/วันเกิด</span>
          </Link>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: แคตตาล็อกเลือกซื้อสินค้า (Catalog) */}
      {/* ======================================================== */}
      {activeTab === "catalog" && (
        <div className="catalogSection">
          {/* Search & Category Filter Toolbar */}
          <div className="catalogToolbar">
            <div className="shopSearchBox">
              <Search size={18} className="shopSearchIcon" />
              <input
                type="text"
                placeholder="ค้นหาชื่อสินค้า รหัส หรือหมวดหมู่..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="shopClearSearch"
                  onClick={() => setSearchQuery("")}
                >
                  ✕
                </button>
              )}
            </div>

            <div className="categoryPillList">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`categoryPill ${selectedCategory === cat ? "active" : ""}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat === "all" ? "ทั้งหมด" : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid */}
          {loadingProducts ? (
            <div className="shopLoadingBox">
              <div className="shopSpinner" />
              <p>กำลังโหลดรายการสินค้า...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="shopEmptyBox">
              <ShoppingBag size={48} className="emptyIcon" />
              <h3>ไม่พบสินค้าที่ตรงกับการค้นหา</h3>
              <p>ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่อื่นดูนะครับ</p>
            </div>
          ) : (
            <div className="productGrid">
              {filteredProducts.map((p) => {
                const stock =
                  p.stock_quantity !== undefined && p.stock_quantity !== null
                    ? Number(p.stock_quantity)
                    : 0;
                const isOutOfStock = stock <= 0 || p.status === "หมด";
                const isLowStock = !isOutOfStock && stock < 10;
                const inCartItem = cart.find((i) => i.product_id === p.product_id);

                return (
                  <div
                    key={p.product_id}
                    className={`productShopCard ${isOutOfStock ? "outOfStock" : ""}`}
                  >
                    {/* Image / Category Icon Representation */}
                    <div className="productCardMedia">
                      <div className="productMediaIcon">
                        <Package size={40} />
                      </div>

                      {/* Stock Badge */}
                      <div className="productStockTag">
                        {isOutOfStock ? (
                          <span className="badgeStock out">สินค้าหมด</span>
                        ) : isLowStock ? (
                          <span className="badgeStock low">ใกล้หมด (เหลือ {stock})</span>
                        ) : (
                          <span className="badgeStock available">มีสินค้า ({stock} ชิ้น)</span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="productCardBody">
                      <div className="productCategoryBadge">{p.category || "สินค้าทั่วไป"}</div>
                      <h3 className="productCardTitle" title={p.name}>
                        {p.name}
                      </h3>
                      <div className="productCodeText">รหัส: {p.product_id}</div>

                      <div className="productCardFooter">
                        <div className="productPriceTag">
                          <span className="currency">฿</span>
                          <span className="amount">
                            {parseFloat(p.price || 0).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>

                        {/* Add to Cart Button */}
                        <button
                          type="button"
                          className={`btnAddToCart ${inCartItem ? "inCart" : ""}`}
                          disabled={isOutOfStock}
                          onClick={() => addToCart(p)}
                          title={isOutOfStock ? "สินค้าหมดสต็อก" : "เพิ่มสินค้าลงตะกร้า"}
                        >
                          {isOutOfStock ? (
                            <span>หมด</span>
                          ) : inCartItem ? (
                            <>
                              <Check size={15} />
                              <span>ในตะกร้า ({inCartItem.qty})</span>
                            </>
                          ) : (
                            <>
                              <ShoppingCart size={15} />
                              <span>หยิบใส่ตะกร้า</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Floating Cart Quick Bar (เมื่อมีสินค้าในตะกร้า) */}
          {totalCartQty > 0 && (
            <div className="floatingCartBar">
              <div className="floatingCartInfo">
                <div className="floatingCartIcon">
                  <ShoppingCart size={20} />
                  <span className="floatingCount">{totalCartQty}</span>
                </div>
                <div>
                  <div className="floatingLabel">สินค้าในตะกร้า {totalCartQty} ชิ้น</div>
                  <div className="floatingTotal">ยอดรวม: ฿{cartSubtotal.toLocaleString()} บาท</div>
                </div>
              </div>
              <button
                type="button"
                className="btnGoToCart"
                onClick={() => setActiveTab("cart")}
              >
                <span>ดูตะกร้าและสั่งซื้อ</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: ตะกร้าสินค้าและการชำระเงิน (Cart & Checkout) */}
      {/* ======================================================== */}
      {activeTab === "cart" && (
        <div className="cartSection">
          {cart.length === 0 ? (
            <div className="emptyCartState">
              <div className="emptyCartIcon">
                <ShoppingCart size={54} />
              </div>
              <h2>ตะกร้าสินค้าของคุณว่างเปล่า</h2>
              <p>ยังไม่มีสินค้าในตะกร้า เลือกชมสินค้าและเพิ่มลงในตะกร้าเพื่อสั่งซื้อได้เลย</p>
              <button
                type="button"
                className="btnBackToShopping"
                onClick={() => setActiveTab("catalog")}
              >
                <ShoppingBag size={18} />
                <span>กลับไปเลือกดูสินค้า</span>
              </button>
            </div>
          ) : (
            <div className="cartLayout">
              {/* รายการสินค้าในตะกร้า */}
              <div className="cartItemsCard">
                <div className="cartCardHeader">
                  <div className="cartCardTitle">
                    <ShoppingCart size={20} />
                    <h2>รายการสินค้าในตะกร้า ({cart.length} รายการ)</h2>
                  </div>
                  <button type="button" className="btnClearCart" onClick={clearCart}>
                    <Trash2 size={14} />
                    <span>ล้างตะกร้า</span>
                  </button>
                </div>

                <div className="cartList">
                  {cart.map((item) => (
                    <div key={item.product_id} className="cartItemRow">
                      <div className="cartItemIcon">
                        <Package size={24} />
                      </div>

                      <div className="cartItemDetail">
                        <h4>{item.name}</h4>
                        <div className="cartItemMeta">
                          <span>หมวดหมู่: {item.category}</span>
                          <span>สต็อกคงเหลือ: {item.stock_quantity} ชิ้น</span>
                        </div>
                        <div className="cartItemUnitPrice">
                          ฿{item.price.toLocaleString()} / ชิ้น
                        </div>
                      </div>

                      {/* ตัวปรับจำนวน */}
                      <div className="cartItemQtyControl">
                        <button
                          type="button"
                          className="btnQty"
                          onClick={() => updateCartQty(item.product_id, -1)}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="qtyDisplay">{item.qty}</span>
                        <button
                          type="button"
                          className="btnQty"
                          onClick={() => updateCartQty(item.product_id, 1)}
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      {/* ยอดเงินรวมแต่ละชิ้น */}
                      <div className="cartItemSubtotal">
                        ฿{(item.price * item.qty).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </div>

                      <button
                        type="button"
                        className="btnRemoveItem"
                        title="ลบรายการนี้"
                        onClick={() => removeFromCart(item.product_id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* ฟอร์มข้อมูลการจัดส่ง & สรุปยอดสั่งซื้อ */}
              <div className="checkoutCard">
                <form onSubmit={handlePlaceOrder} className="checkoutForm">
                  <h3 className="checkoutTitle">
                    <Truck size={20} />
                    <span>ข้อมูลจัดส่งและการชำระเงิน</span>
                  </h3>

                  <div className="formField">
                    <label>
                      <User size={14} />
                      <span>ชื่อ - นามสกุล ผู้รับ *</span>
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น สมชาย ใจดี"
                      value={checkoutForm.customer_name}
                      onChange={(e) =>
                        setCheckoutForm({ ...checkoutForm, customer_name: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="formField">
                    <div className="formFieldLabelRow">
                      <label>
                        <Phone size={14} />
                        <span>เบอร์โทรศัพท์ติดต่อ (ตัวเลข 10 หลัก) *</span>
                      </label>
                      {existingPhones.length > 0 && (
                        <span className="existingPhoneCountBadge">
                          เบอร์ของฉัน ({existingPhones.length})
                        </span>
                      )}
                    </div>

                    {/* เมนูดรอปดาวน์เมื่อมีเบอร์ของตนเองมากกว่า 1 เบอร์ */}
                    {existingPhones.length > 1 && (
                      <div className="existingPhoneSelectWrapper">
                        <select
                          className="existingPhoneSelect"
                          value={
                            existingPhones.some((p) => p.phone === checkoutForm.customer_phone)
                              ? checkoutForm.customer_phone
                              : ""
                          }
                          onChange={(e) => handleSelectExistingPhone(e.target.value)}
                        >
                          <option value="">-- เลือกเบอร์โทรของฉัน ({existingPhones.length} เบอร์) --</option>
                          {existingPhones.map((p) => (
                            <option key={p.phone} value={p.phone}>
                              📞 {p.phone} ({p.source})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]{10}"
                      maxLength={10}
                      list="my-phones-datalist"
                      placeholder="เช่น 0812345678"
                      value={checkoutForm.customer_phone}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                        handlePhoneInputChange(digits);
                      }}
                      required
                    />

                    <datalist id="my-phones-datalist">
                      {existingPhones.map((p) => (
                        <option key={p.phone} value={p.phone}>
                          {p.source}
                        </option>
                      ))}
                    </datalist>

                    {/* ปุ่มลัดเลือกเบอร์ของฉัน */}
                    {existingPhones.length > 0 && (
                      <div className="existingPhoneQuickChips">
                        <span className="quickChipTitle">เบอร์ของฉัน:</span>
                        {existingPhones.map((p) => (
                          <button
                            type="button"
                            key={p.phone}
                            className={`phoneChipBtn ${checkoutForm.customer_phone === p.phone ? "active" : ""}`}
                            onClick={() => handleSelectExistingPhone(p.phone)}
                            title={`ใช้เบอร์ ${p.phone} (${p.source})`}
                          >
                            📞 {p.phone} ({p.source})
                          </button>
                        ))}
                      </div>
                    )}

                    {checkoutForm.customer_phone && checkoutForm.customer_phone.length !== 10 && (
                      <small style={{ color: "#ef4444", fontSize: "11px", marginTop: "2px" }}>
                        * ต้องเป็นตัวเลขครบ 10 หลัก (ปัจจุบันมี {checkoutForm.customer_phone.length}/10 หลัก)
                      </small>
                    )}
                  </div>

                  <div className="formField">
                    <label>
                      <MapPin size={14} />
                      <span>ที่อยู่สำหรับจัดส่งสินค้า *</span>
                    </label>
                    <textarea
                      rows="3"
                      placeholder="บ้านเลขที่ ซอย ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด รหัสไปรษณีย์"
                      value={checkoutForm.shipping_address}
                      onChange={(e) =>
                        setCheckoutForm({ ...checkoutForm, shipping_address: e.target.value })
                      }
                      required
                    />
                  </div>

                  {/* วิธีการชำระเงิน */}
                  <div className="formField">
                    <label>
                      <CreditCard size={14} />
                      <span>วิธีการชำระเงิน</span>
                    </label>
                    <div className="paymentMethodOptions">
                      <label
                        className={`paymentOption ${checkoutForm.payment_method === "พร้อมเพย์ / PromptPay"
                          ? "active"
                          : ""
                          }`}
                      >
                        <input
                          type="radio"
                          name="payment_method"
                          value="พร้อมเพย์ / PromptPay"
                          checked={checkoutForm.payment_method === "พร้อมเพย์ / PromptPay"}
                          onChange={(e) =>
                            setCheckoutForm({ ...checkoutForm, payment_method: e.target.value })
                          }
                        />
                        <div className="paymentOptionText">
                          <strong>📱 สแกน QR Code พร้อมเพย์</strong>
                          <small>ชำระสะดวกผ่าน Mobile Banking ทุกธนาคาร</small>
                        </div>
                      </label>

                      {/* ชำระด้วยยอดเงินในบัญชีลูกค้า */}
                      <label
                        className={`paymentOption ${checkoutForm.payment_method === "หักจากยอดเงินในบัญชีลูกค้า"
                          ? "active"
                          : ""
                          }`}
                      >
                        <input
                          type="radio"
                          name="payment_method"
                          value="หักจากยอดเงินในบัญชีลูกค้า"
                          checked={checkoutForm.payment_method === "หักจากยอดเงินในบัญชีลูกค้า"}
                          onChange={(e) =>
                            setCheckoutForm({ ...checkoutForm, payment_method: e.target.value })
                          }
                        />
                        <div className="paymentOptionText">
                          <strong style={{ color: "#1d4ed8" }}>💳 หักจากยอดเงินในบัญชีของฉัน (กระเป๋าเงินลูกค้า)</strong>
                          <small>
                            ยอดเงินคงเหลือในบัญชี: <strong>฿{Number(user?.wallet_balance || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</strong>
                            {Number(user?.wallet_balance || 0) < grandTotal ? (
                              <span style={{ color: "#e11d48", display: "block", fontWeight: 700 }}>
                                ⚠️ ยอดเงินในบัญชีไม่พอ (ขาดอีก ฿{(grandTotal - Number(user?.wallet_balance || 0)).toFixed(2)})
                              </span>
                            ) : (
                              <span style={{ color: "#059669", display: "block" }}>
                                ✓ ยอดเงินเพียงพอสำหรับชำระสินค้านี้
                              </span>
                            )}
                          </small>
                        </div>
                      </label>

                      <label
                        className={`paymentOption ${checkoutForm.payment_method === "เก็บเงินปลายทาง (COD)"
                          ? "active"
                          : ""
                          }`}
                      >
                        <input
                          type="radio"
                          name="payment_method"
                          value="เก็บเงินปลายทาง (COD)"
                          checked={checkoutForm.payment_method === "เก็บเงินปลายทาง (COD)"}
                          onChange={(e) =>
                            setCheckoutForm({ ...checkoutForm, payment_method: e.target.value })
                          }
                        />
                        <div className="paymentOptionText">
                          <strong>🚚 ชำระเงินปลายทาง </strong>
                          <small>ชำระเงินสดกับเจ้าหน้าที่จัดส่งเมื่อได้รับของ</small>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="formField">
                    <label>
                      <span>หมายเหตุถึงร้านค้า (ถ้ามี)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น ฝากไว้หน้ารั้ว, โทรแจ้งก่อนส่ง"
                      value={checkoutForm.note}
                      onChange={(e) =>
                        setCheckoutForm({ ...checkoutForm, note: e.target.value })
                      }
                    />
                  </div>

                  {/* สรุปยอดเงิน */}
                  <div className="orderSummaryBox">
                    <div className="summaryRow">
                      <span>ยอดรวมสินค้า ({totalCartQty} ชิ้น):</span>
                      <span>฿{cartSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>

                    <div className="summaryRow">
                      <span>ค่าจัดส่ง:</span>
                      <span>
                        {shippingFee === 0 ? (
                          <strong className="text-emerald-600">ฟรี (โปรโมชั่น)</strong>
                        ) : (
                          `฿${shippingFee.toFixed(2)}`
                        )}
                      </span>
                    </div>

                    <div className="summaryRow">
                      <span>แต้มสะสมที่จะได้รับ (ซื้อทุก 50฿ รับ 5 แต้ม):</span>
                      <strong style={{ color: "#059669" }}>
                        +{Math.floor(grandTotal / 50) * 5} แต้ม
                      </strong>
                    </div>

                    <div className="summaryRow totalRow">
                      <span>ยอดชำระสุทธิ:</span>
                      <strong className="totalGrandPrice">
                        ฿{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </strong>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btnConfirmOrder"
                    disabled={isSubmittingOrder}
                  >
                    {isSubmittingOrder ? (
                      <span>กำลังส่งคำสั่งซื้อ...</span>
                    ) : (
                      <>
                        <CheckCircle2 size={18} />
                        <span>ยืนยันการสั่งซื้อสินค้า</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: ประวัติคำสั่งซื้อของลูกค้า (My Orders) */}
      {/* ======================================================== */}
      {activeTab === "orders" && (
        <div className="ordersSection">
          <div className="ordersHeaderBar">
            <div className="ordersTitleWrap">
              <Package size={22} />
              <h2>
                {isSalesStaff
                  ? `รายการคำสั่งซื้อของลูกค้า (สำหรับพนักงานขายตรวจสอบและอนุมัติ) (${displayedOrders.length} ออเดอร์)`
                  : `ประวัติคำสั่งซื้อของฉัน (${displayedOrders.length} ออเดอร์)`}
              </h2>
            </div>
            <button
              type="button"
              className="btnRefreshOrders"
              onClick={loadCustomerOrders}
              disabled={loadingOrders}
            >
              <span>รีเฟรชประวัติ</span>
            </button>
          </div>

          {loadingOrders ? (
            <div className="shopLoadingBox">
              <div className="shopSpinner" />
              <p>กำลังโหลดประวัติการสั่งซื้อ...</p>
            </div>
          ) : displayedOrders.length === 0 ? (
            <div className="shopEmptyBox">
              <Package size={48} className="emptyIcon" />
              <h3>ยังไม่มีรายการคำสั่งซื้อสินค้าในระบบ</h3>
              <p>เลือกซื้อสินค้าที่ถูกใจ แล้วสั่งซื้อได้ง่าย ๆ เลยครับ</p>
              <button
                type="button"
                className="btnBackToShopping"
                onClick={() => setActiveTab("catalog")}
              >
                <ShoppingBag size={16} />
                <span>เริ่มเลือกซื้อสินค้า</span>
              </button>
            </div>
          ) : (
            <div className="ordersGrid">
              {displayedOrders.map((o) => {
                const dateStr = o.created_at
                  ? new Date(o.created_at).toLocaleString("th-TH")
                  : "-";

                const isApproved = o.status === "อนุมัติแล้ว";
                const isShipping = o.status === "กำลังจัดส่ง";
                const isCompleted = o.status === "สำเร็จ";
                const isCancelled = o.status === "ยกเลิก";

                return (
                  <div key={o.order_id} className="customerOrderCard">
                    <div className="orderCardTop">
                      <div className="orderNoWrap">
                        <span className="orderPrefix">คำสั่งซื้อ:</span>
                        <strong className="orderNoText">{o.order_no}</strong>
                      </div>
                      <span
                        className={`orderStatusBadge ${
                          isApproved
                            ? "approved"
                            : isShipping
                            ? "shipping"
                            : isCompleted
                            ? "completed"
                            : isCancelled
                            ? "cancelled"
                            : "pending"
                        }`}
                      >
                        {isApproved || isCompleted ? (
                          <CheckCircle2 size={13} />
                        ) : isShipping ? (
                          <Truck size={13} />
                        ) : isCancelled ? (
                          <XCircle size={13} />
                        ) : (
                          <Clock size={13} />
                        )}
                        <span>{o.status || "รอดำเนินการ"}</span>
                      </span>
                    </div>

                    <div className="orderDateText">
                      <span>สั่งซื้อเมื่อ:</span> {dateStr}
                    </div>

                    {/* รายการสินค้าสรุป */}
                    <div className="orderItemsList">
                      {o.items?.map((item, idx) => (
                        <div key={idx} className="orderItemMiniRow">
                          <span className="orderItemQty">×{item.qty}</span>
                          <span className="orderItemName">{item.product_name}</span>
                          <span className="orderItemPrice">
                            ฿{(item.price * item.qty).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="orderCardBottom">
                      <div className="orderShipInfo">
                        <div>
                          <strong>จัดส่งถึง:</strong> {o.customer_name} ({o.customer_phone})
                        </div>
                        <div className="orderPayMethod">
                          <strong>ชำระโดย:</strong> {o.payment_method}
                        </div>
                      </div>

                      <div className="orderTotalBox">
                        <span className="totalLabel">ยอดรวมทั้งสิ้น</span>
                        <span className="totalPrice">
                          ฿{parseFloat(o.total_amount).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="orderCardActions">
                      {/* ปุ่มสำหรับพนักงานขาย / ผู้ดูแลระบบกดยืนยันสินค้าหรืออนุมัติ */}
                      {isSalesStaff && (
                        <>
                          {(!o.status || o.status === "รอดำเนินการ") && (
                            <button
                              type="button"
                              className="btnApproveOrder"
                              onClick={() => handleUpdateStatus(o.order_id, "อนุมัติแล้ว", o.order_no)}
                              disabled={updatingOrderId === o.order_id}
                              title="พนักงานขายกดยืนยันสินค้าและอนุมัติคำสั่งซื้อ"
                            >
                              <CheckCircle2 size={15} />
                              <span>
                                {updatingOrderId === o.order_id ? "กำลังบันทึก..." : "ยืนยันสินค้า / อนุมัติ"}
                              </span>
                            </button>
                          )}

                          {o.status === "อนุมัติแล้ว" && (
                            <button
                              type="button"
                              className="btnShipOrder"
                              onClick={() => handleUpdateStatus(o.order_id, "กำลังจัดส่ง", o.order_no)}
                              disabled={updatingOrderId === o.order_id}
                              title="เปลี่ยนสถานะเป็นกำลังจัดส่งสินค้า"
                            >
                              <Truck size={15} />
                              <span>จัดส่งสินค้า</span>
                            </button>
                          )}

                          {o.status === "กำลังจัดส่ง" && (
                            <button
                              type="button"
                              className="btnCompleteOrder"
                              onClick={() => handleUpdateStatus(o.order_id, "สำเร็จ", o.order_no)}
                              disabled={updatingOrderId === o.order_id}
                              title="เปลี่ยนสถานะเป็นจัดส่งสำเร็จ"
                            >
                              <Check size={15} />
                              <span>สำเร็จแล้ว</span>
                            </button>
                          )}

                          {!isCancelled && !isCompleted && (
                            <button
                              type="button"
                              className="btnCancelOrder"
                              onClick={() => handleUpdateStatus(o.order_id, "ยกเลิก", o.order_no)}
                              disabled={updatingOrderId === o.order_id}
                              title="ยกเลิกคำสั่งซื้อนี้"
                            >
                              <XCircle size={14} />
                              <span>ยกเลิก</span>
                            </button>
                          )}
                        </>
                      )}

                      <button
                        type="button"
                        className="btnViewOrderReceipt"
                        onClick={() => setSelectedOrderDetail(o)}
                      >
                        <FileText size={15} />
                        <span>ดูใบเสร็จ / รายละเอียดคำสั่งซื้อ</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: แจ้งเตือนสั่งซื้อสำเร็จ (Order Success Modal) */}
      {/* ======================================================== */}
      {orderSuccessData && (
        <div className="shopModalBackdrop">
          <div className="shopModalCard">
            <div className="orderSuccessIcon">
              <CheckCircle2 size={54} color="#10b981" />
            </div>
            <h2>สั่งซื้อสินค้าสำเร็จ เรียบร้อยแล้ว!</h2>
            <p className="orderSuccessSub">
              ทางร้านได้รับคำสั่งซื้อของคุณแล้ว และจะรีบดำเนินการจัดส่งสินค้าให้เร็วที่สุด
            </p>

            <div className="orderSuccessInfoBox">
              <div className="infoRow">
                <span>เลขที่คำสั่งซื้อ:</span>
                <strong className="text-blue-700 font-mono font-bold">
                  {orderSuccessData.order_no}
                </strong>
              </div>
              <div className="infoRow">
                <span>ชื่อผู้รับ:</span>
                <span>{orderSuccessData.customer_name}</span>
              </div>
              <div className="infoRow">
                <span>เบอร์โทรศัพท์:</span>
                <span>{orderSuccessData.customer_phone}</span>
              </div>
              <div className="infoRow">
                <span>วิธีชำระเงิน:</span>
                <span className="font-semibold">{orderSuccessData.payment_method}</span>
              </div>
              <div className="infoRow">
                <span>ที่อยู่จัดส่ง:</span>
                <span className="text-right text-slate-700">{orderSuccessData.shipping_address}</span>
              </div>
              <div className="infoRow highlightRow">
                <span>ยอดชำระทั้งสิ้น:</span>
                <strong className="text-emerald-700 text-lg">
                  ฿{parseFloat(orderSuccessData.total_amount).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })} บาท
                </strong>
              </div>
            </div>

            <div className="orderSuccessModalActions">
              <button
                type="button"
                className="btnSuccessViewOrders"
                onClick={() => {
                  setOrderSuccessData(null);
                  setActiveTab("orders");
                }}
              >
                <Package size={16} />
                <span>ดูประวัติการสั่งซื้อ</span>
              </button>
              <button
                type="button"
                className="btnSuccessShopMore"
                onClick={() => {
                  setOrderSuccessData(null);
                  setActiveTab("catalog");
                }}
              >
                <span>เลือกซื้อสินค้าต่อ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ใบสั่งซื้อ / ใบเสร็จสำหรับลูกค้า (Receipt Modal) */}
      {/* ======================================================== */}
      {selectedOrderDetail && (
        <div
          className="shopModalBackdrop"
          onClick={() => setSelectedOrderDetail(null)}
        >
          <div className="receiptModalContent" onClick={(e) => e.stopPropagation()}>
            <div className="receiptModalHeader no-print">
              <div className="receiptHeaderTitle">
                <FileText size={18} />
                <h3>ใบสั่งซื้อสินค้า (Customer Order Receipt)</h3>
              </div>
              <button
                type="button"
                className="btnCloseModal"
                onClick={() => setSelectedOrderDetail(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="printableReceiptArea" id="printable-customer-receipt">
              <div className="receiptPaper">
                {/* Header */}
                <div className="receiptHeader">
                  <div className="receiptBrandLogo">WEB PROJECT STORE</div>
                  <h2>ใบยืนยันคำสั่งซื้อสินค้า (Order Confirmation)</h2>
                  <div className="receiptMetaRow">
                    <span><strong>เลขที่คำสั่งซื้อ:</strong> {selectedOrderDetail.order_no}</span>
                    <span>
                      <strong>วันที่:</strong>{" "}
                      {new Date(selectedOrderDetail.created_at).toLocaleString("th-TH")}
                    </span>
                  </div>
                </div>

                {/* Customer & Shipping info */}
                <div className="receiptCustomerBox">
                  <div className="custRow">
                    <span><strong>ชื่อลูกค้า:</strong> {selectedOrderDetail.customer_name}</span>
                    <span><strong>เบอร์โทรศัพท์:</strong> {selectedOrderDetail.customer_phone}</span>
                  </div>
                  <div className="custRow">
                    <span><strong>วิธีชำระเงิน:</strong> {selectedOrderDetail.payment_method}</span>
                    <span><strong>สถานะ:</strong> {selectedOrderDetail.status}</span>
                  </div>
                  <div className="custRow full">
                    <span><strong>ที่อยู่จัดส่ง:</strong> {selectedOrderDetail.shipping_address}</span>
                  </div>
                  {selectedOrderDetail.note && (
                    <div className="custRow full">
                      <span><strong>หมายเหตุ:</strong> {selectedOrderDetail.note}</span>
                    </div>
                  )}
                </div>

                {/* Items Table */}
                <table className="receiptItemsTable">
                  <thead>
                    <tr>
                      <th style={{ width: "40px", textAlign: "center" }}>ลำดับ</th>
                      <th>รายการสินค้า</th>
                      <th style={{ width: "60px", textAlign: "center" }}>จำนวน</th>
                      <th style={{ width: "90px", textAlign: "right" }}>ราคา/หน่วย</th>
                      <th style={{ width: "100px", textAlign: "right" }}>รวมเงิน (บาท)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrderDetail.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="text-center">{idx + 1}</td>
                        <td>{item.product_name}</td>
                        <td className="text-center">{item.qty}</td>
                        <td className="text-right">{parseFloat(item.price).toFixed(2)}</td>
                        <td className="text-right">
                          {(item.price * item.qty).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="receiptTotalsWrap">
                  <div className="receiptTotalsBox">
                    <div className="rTotRow">
                      <span>มูลค่าสินค้า:</span>
                      <span>{parseFloat(selectedOrderDetail.subtotal || selectedOrderDetail.total_amount).toFixed(2)}</span>
                    </div>
                    <div className="rTotRow">
                      <span>ค่าจัดส่ง:</span>
                      <span>{parseFloat(selectedOrderDetail.shipping_fee || 0).toFixed(2)}</span>
                    </div>
                    <div className="rTotRow grand">
                      <span>ยอดชำระทั้งสิ้น:</span>
                      <span>
                        {parseFloat(selectedOrderDetail.total_amount).toFixed(2)} บาท
                      </span>
                    </div>
                  </div>
                </div>

                <div className="receiptFooterNote">
                  <p>*** ขอบคุณที่อุดหนุนสินค้ากับเรา ***</p>
                  <p>หากมีข้อสงสัยหรือต้องการสอบถามสถานะสินค้า ติดต่อฝ่ายบริการลูกค้าได้ตลอด 24 ชม.</p>
                </div>
              </div>
            </div>

            <div className="receiptModalFooter no-print">
              {isSalesStaff && (!selectedOrderDetail.status || selectedOrderDetail.status === "รอดำเนินการ") && (
                <button
                  type="button"
                  className="btnApproveOrder"
                  style={{ marginRight: "auto" }}
                  onClick={() =>
                    handleUpdateStatus(
                      selectedOrderDetail.order_id,
                      "อนุมัติแล้ว",
                      selectedOrderDetail.order_no
                    )
                  }
                  disabled={updatingOrderId === selectedOrderDetail.order_id}
                >
                  <CheckCircle2 size={16} />
                  <span>
                    {updatingOrderId === selectedOrderDetail.order_id
                      ? "กำลังบันทึก..."
                      : "ยืนยันสินค้า / อนุมัติคำสั่งซื้อนี้"}
                  </span>
                </button>
              )}

              <button
                type="button"
                className="btnPrintReceipt"
                onClick={() => window.print()}
              >
                <Printer size={16} />
                <span>พิมพ์ใบสั่งซื้อ (Print / PDF)</span>
              </button>
              <button
                type="button"
                className="btnCloseReceipt"
                onClick={() => setSelectedOrderDetail(null)}
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
