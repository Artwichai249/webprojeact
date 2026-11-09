// src/modules/product/screens/OrderPayment.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  CreditCard,
  QrCode,
  DollarSign,
  ArrowLeft,
  CheckCircle2,
  Boxes,
  Truck,
  Building,
  Calendar,
  FileText,
  Clock,
  Printer,
  ShoppingBag,
} from "lucide-react";
import { getPurchaseOrderById, payPurchaseOrder } from "../api/productApi";
import "./OrderPayment.css";

export default function OrderPayment() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // ช่องทางการชำระเงิน: "promptpay" | "bank" | "cash"
  const [paymentMethod, setPaymentMethod] = useState("promptpay");

  // ฟอร์มข้อมูลการชำระเงิน
  const [paymentForm, setPaymentForm] = useState({
    cashPaid: "",
    paymentRef: "",
    paymentNote: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  // โหลดข้อมูลใบเสนอสั่งซื้อตาม ID
  useEffect(() => {
    if (id) {
      loadOrder(id);
    }
  }, [id]);

  async function loadOrder(orderId) {
    setIsLoading(true);
    setErrorMessage("");
    const data = await getPurchaseOrderById(orderId);
    if (data && !data.error) {
      setOrder(data);
      setPaymentForm((prev) => ({
        ...prev,
        cashPaid: String(data.total_cost || 0),
        paymentRef: `PAY-${Date.now().toString().slice(-6)}`,
      }));
    } else {
      setErrorMessage(data?.error || "ไม่พบข้อมูลใบเสนอสั่งซื้อที่ระบุ");
    }
    setIsLoading(false);
  }

  // คำนวณเงินทอนสำหรับเงินสด
  const totalCost = parseFloat(order?.total_cost || 0);
  const cashGiven = parseFloat(paymentForm.cashPaid) || 0;
  const changeAmount = Math.max(0, cashGiven - totalCost);
  const isCashSufficient = paymentMethod !== "cash" || cashGiven >= totalCost;

  // ส่งข้อมูลการชำระเงิน
  async function handlePaymentSubmit(e) {
    e.preventDefault();
    if (!order) return;

    if (paymentMethod === "cash" && cashGiven < totalCost) {
      alert("จำนวนเงินสดที่ชำระน้อยกว่ายอดที่ต้องจ่าย");
      return;
    }

    setIsSubmitting(true);
    const methodLabels = {
      promptpay: "QR Code PromptPay",
      bank: "โอนผ่านบัญชีธนาคาร",
      cash: "เงินสด",
    };

    const payload = {
      payment_method: methodLabels[paymentMethod] || "เงินสด",
      paid_amount: paymentMethod === "cash" ? cashGiven : totalCost,
      payment_ref: paymentForm.paymentRef || `REF-${Date.now().toString().slice(-6)}`,
      payment_note: paymentForm.paymentNote,
    };

    const res = await payPurchaseOrder(order.order_id, payload);
    setIsSubmitting(false);

    if (res && !res.error) {
      setReceiptData(res.order);
    } else {
      alert(`เกิดข้อผิดพลาดในการชำระเงิน: ${res?.error || "ไม่สามารถทำรายการได้"}`);
    }
  }

  if (isLoading) {
    return (
      <div className="paymentPageContainer">
        <div className="paymentLoadingCard">
          <Clock size={36} className="spinningIcon" />
          <p>กำลังโหลดข้อมูลการชำระเงิน...</p>
        </div>
      </div>
    );
  }

  if (errorMessage || !order) {
    return (
      <div className="paymentPageContainer">
        <div className="paymentErrorCard">
          <h2>เกิดข้อผิดพลาด</h2>
          <p>{errorMessage || "ไม่พบข้อมูลใบเสนอสั่งซื้อ"}</p>
          <Link to="/products/order" className="btnBackOrder">
            <ArrowLeft size={16} />
            <span>กลับหน้าเสนอการสั่งซื้อ</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="paymentPageContainer">
      {/* ส่วนหัวหน้าชำระเงิน */}
      <div className="paymentHeader">
        <Link to="/products/order" className="btnBackOrder">
          <ArrowLeft size={16} />
          <span>กลับหน้าเสนอการสั่งซื้อ</span>
        </Link>
        <div className="paymentHeaderInfo">
          <div className="paymentBadge">
            <CreditCard size={14} />
            <span>ชำระเงินค่าสินค้า (Order Payment)</span>
          </div>
          <h1>ชำระเงินใบเสนอสั่งซื้อ #{order.order_no}</h1>
          <p className="paymentSubtitle">
            ตรวจสอบรายการยอดเงิน และเลือกวิธีการชำระเงินเพื่ออนุมัติรับสินค้าเข้าสต็อก
          </p>
        </div>
      </div>

      <div className="paymentMainGrid">
        {/* คอลัมน์ซ้าย: สรุปข้อมูลใบเสนอสั่งซื้อ */}
        <div className="orderSummaryPanel">
          <div className="panelCard">
            <div className="panelHead">
              <ShoppingBag size={20} className="textBlue" />
              <h3>สรุปรายการที่เสนอสั่งซื้อ</h3>
            </div>

            <div className="orderDetailBox">
              <div className="orderItemMain">
                <div className="itemIcon">
                  <Boxes size={24} />
                </div>
                <div className="itemInfo">
                  <span className="itemCode">รหัส: {order.product_id}</span>
                  <h4 className="itemName">{order.product_name}</h4>
                  <span className="itemCategory">หมวดหมู่: {order.category || "ทั่วไป"}</span>
                </div>
              </div>

              <div className="orderSummaryLines">
                <div className="summaryLine">
                  <span className="lineLabel">จำนวนเสนอซื้อ:</span>
                  <span className="lineVal fontBold">+{order.quantity} ชิ้น</span>
                </div>
                <div className="summaryLine">
                  <span className="lineLabel">ราคาต้นทุน/ชิ้น:</span>
                  <span className="lineVal">฿{parseFloat(order.cost_price || 0).toLocaleString()}</span>
                </div>
                <div className="summaryLine">
                  <span className="lineLabel">ผู้จัดจำหน่าย:</span>
                  <span className="lineVal">{order.supplier || "-"}</span>
                </div>
                <div className="summaryLine">
                  <span className="lineLabel">ผู้เสนอสั่งซื้อ:</span>
                  <span className="lineVal">{order.ordered_by || "-"}</span>
                </div>
                <div className="summaryLine">
                  <span className="lineLabel">สถานะปัจจุบัน:</span>
                  <span
                    className={`statusPill ${
                      order.status === "รออนุมัติ" ? "pending" : "approved"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>

              <div className="totalDueBanner">
                <span className="dueLabel">ยอดที่ต้องชำระสุทธิ</span>
                <span className="dueAmount">
                  ฿
                  {totalCost.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* คอลัมน์ขวา: เลือกช่องทางและดำเนินการชำระเงิน */}
        <div className="paymentActionPanel">
          <div className="panelCard">
            <div className="panelHead">
              <CreditCard size={20} className="textEmerald" />
              <h3>เลือกช่องทางการชำระเงิน</h3>
            </div>

            {/* แถบเลือกช่องทางชำระเงิน */}
            <div className="paymentMethodTabs">
              <button
                type="button"
                className={`methodTab ${paymentMethod === "promptpay" ? "active" : ""}`}
                onClick={() => setPaymentMethod("promptpay")}
              >
                <QrCode size={18} />
                <span>QR PromptPay</span>
              </button>

              <button
                type="button"
                className={`methodTab ${paymentMethod === "bank" ? "active" : ""}`}
                onClick={() => setPaymentMethod("bank")}
              >
                <Building size={18} />
                <span>โอนผ่านธนาคาร</span>
              </button>

              <button
                type="button"
                className={`methodTab ${paymentMethod === "cash" ? "active" : ""}`}
                onClick={() => setPaymentMethod("cash")}
              >
                <DollarSign size={18} />
                <span>เงินสด (Cash)</span>
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="paymentForm">
              {/* ช่องทาง 1: QR PromptPay */}
              {paymentMethod === "promptpay" && (
                <div className="methodContent qrContent">
                  <div className="qrWrapper">
                    {/* SVG PromptPay QR Code จำลองสวยงาม */}
                    <div className="qrFrame">
                      <div className="qrHeaderLogo">
                        <span>Thai QR Payment</span>
                        <small>พร้อมเพย์ PromptPay</small>
                      </div>
                      <div className="qrCanvasPlaceholder">
                        <svg viewBox="0 0 100 100" width="160" height="160">
                          {/* Corner Squares */}
                          <rect x="5" y="5" width="26" height="26" fill="#003b70" rx="3" />
                          <rect x="9" y="9" width="18" height="18" fill="#ffffff" rx="2" />
                          <rect x="13" y="13" width="10" height="10" fill="#003b70" />

                          <rect x="69" y="5" width="26" height="26" fill="#003b70" rx="3" />
                          <rect x="73" y="9" width="18" height="18" fill="#ffffff" rx="2" />
                          <rect x="77" y="13" width="10" height="10" fill="#003b70" />

                          <rect x="5" y="69" width="26" height="26" fill="#003b70" rx="3" />
                          <rect x="9" y="73" width="18" height="18" fill="#ffffff" rx="2" />
                          <rect x="13" y="77" width="10" height="10" fill="#003b70" />

                          {/* Pattern Blocks */}
                          <rect x="36" y="8" width="6" height="6" fill="#003b70" />
                          <rect x="46" y="8" width="6" height="6" fill="#003b70" />
                          <rect x="56" y="8" width="6" height="6" fill="#003b70" />

                          <rect x="36" y="20" width="10" height="6" fill="#003b70" />
                          <rect x="50" y="20" width="12" height="6" fill="#003b70" />

                          <rect x="8" y="36" width="12" height="6" fill="#003b70" />
                          <rect x="24" y="36" width="6" height="10" fill="#003b70" />
                          <rect x="36" y="36" width="28" height="28" fill="#003b70" rx="4" />
                          <rect x="42" y="42" width="16" height="16" fill="#ffffff" rx="2" />
                          <rect x="46" y="46" width="8" height="8" fill="#003b70" />

                          <rect x="69" y="36" width="10" height="8" fill="#003b70" />
                          <rect x="83" y="36" width="12" height="6" fill="#003b70" />

                          <rect x="8" y="50" width="8" height="12" fill="#003b70" />
                          <rect x="20" y="50" width="10" height="6" fill="#003b70" />
                          <rect x="72" y="50" width="8" height="14" fill="#003b70" />
                          <rect x="84" y="50" width="11" height="8" fill="#003b70" />

                          <rect x="36" y="69" width="10" height="10" fill="#003b70" />
                          <rect x="50" y="69" width="6" height="16" fill="#003b70" />
                          <rect x="60" y="69" width="10" height="6" fill="#003b70" />

                          <rect x="36" y="83" width="8" height="12" fill="#003b70" />
                          <rect x="69" y="80" width="12" height="6" fill="#003b70" />
                          <rect x="85" y="80" width="10" height="15" fill="#003b70" />
                        </svg>
                      </div>
                      <div className="qrFooterAmount">
                        <span>ยอดชำระ:</span>
                        <strong>฿{totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                      </div>
                    </div>
                  </div>
                  <p className="qrHelpText">
                    เปิดแอปพลิเคชันธนาคารบนมือถือ แล้วสแกน QR Code นี้เพื่อชำระเงิน
                  </p>
                </div>
              )}

              {/* ช่องทาง 2: โอนผ่านธนาคาร */}
              {paymentMethod === "bank" && (
                <div className="methodContent bankContent">
                  <div className="bankAccountCard">
                    <div className="bankLogo kbank">KBANK</div>
                    <div className="bankDetails">
                      <span className="bankName">ธนาคารกสิกรไทย (Kasikornbank)</span>
                      <strong className="accountNumber">089-1-23456-7</strong>
                      <span className="accountHolder">ชื่อบัญชี: บจก. ซัพพลายเออร์ สยาม (จัดซื้อ)</span>
                    </div>
                  </div>

                  <div className="bankAccountCard">
                    <div className="bankLogo scb">SCB</div>
                    <div className="bankDetails">
                      <span className="bankName">ธนาคารไทยพาณิชย์ (Siam Commercial Bank)</span>
                      <strong className="accountNumber">456-7-89012-3</strong>
                      <span className="accountHolder">ชื่อบัญชี: บจก. ซัพพลายเออร์ สยาม (จัดซื้อ)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ช่องทาง 3: เงินสด */}
              {paymentMethod === "cash" && (
                <div className="methodContent cashContent">
                  <div className="cashInputGroup">
                    <label>จำนวนเงินสดที่ชำระ (บาท) *</label>
                    <div className="cashInputWrap">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={paymentForm.cashPaid}
                        onChange={(e) =>
                          setPaymentForm({ ...paymentForm, cashPaid: e.target.value })
                        }
                        className="cashNumberInput"
                        required
                      />
                      <button
                        type="button"
                        className="btnExactCash"
                        onClick={() =>
                          setPaymentForm({ ...paymentForm, cashPaid: String(totalCost) })
                        }
                      >
                        พอดี
                      </button>
                    </div>
                  </div>

                  <div className="cashChangeBox">
                    <div className="changeLine">
                      <span>ยอดที่ต้องชำระ:</span>
                      <strong>฿{totalCost.toLocaleString()}</strong>
                    </div>
                    <div className="changeLine">
                      <span>รับเงินสดมา:</span>
                      <span>฿{cashGiven.toLocaleString()}</span>
                    </div>
                    <div className="changeLine totalChange">
                      <span>เงินทอน:</span>
                      <strong className={isCashSufficient ? "changeOk" : "changeShort"}>
                        ฿{changeAmount.toLocaleString()}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* ฟิลด์เพิ่มเติม: เลขอ้างอิง & หมายเหตุ */}
              <div className="extraFieldsGrid">
                <div className="formField">
                  <label>เลขที่อ้างอิง / สลิปโอนเงิน</label>
                  <input
                    type="text"
                    value={paymentForm.paymentRef}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, paymentRef: e.target.value })
                    }
                    placeholder="เช่น SLIP20261029-01"
                  />
                </div>

                <div className="formField">
                  <label>หมายเหตุการชำระเงิน</label>
                  <input
                    type="text"
                    value={paymentForm.paymentNote}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, paymentNote: e.target.value })
                    }
                    placeholder="เช่น ชำระค่าสินค้าครบถ้วน พร้อมรับเข้าคลัง"
                  />
                </div>
              </div>

              {/* ปุ่มยืนยันชำระเงิน */}
              <div className="formFooterActions">
                <button
                  type="button"
                  className="btnCancelPay"
                  onClick={() => navigate("/products/order")}
                >
                  ยกเลิก
                </button>

                <button
                  type="submit"
                  className="btnConfirmPayment"
                  disabled={isSubmitting || !isCashSufficient}
                >
                  <CheckCircle2 size={18} />
                  <span>
                    {isSubmitting
                      ? "กำลังบันทึกการชำระเงิน..."
                      : `ยืนยันการชำระเงิน ฿${totalCost.toLocaleString()} และรับเข้าสต็อก`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* ===================== MODAL ใบเสร็จรับเงินสำเร็จ ===================== */}
      {receiptData && (
        <div className="receiptModalOverlay">
          <div className="receiptCard">
            <div className="receiptIconWrap">
              <CheckCircle2 size={54} color="#16a34a" />
            </div>

            <h2>ชำระเงินค่าสินค้าสำเร็จ!</h2>
            <p className="receiptSub">
              ระบบได้ปรับปรุงสถานะเป็น <strong>"ชำระเงินแล้ว"</strong> และนำสินค้าเข้าสต็อกเรียบร้อยแล้ว
            </p>

            <div className="receiptPaper">
              <div className="paperRow">
                <span>เลขที่ใบเสนอสั่งซื้อ:</span>
                <strong>{receiptData.order_no}</strong>
              </div>
              <div className="paperRow">
                <span>สินค้า:</span>
                <strong>
                  {receiptData.product_name} ({receiptData.product_id})
                </strong>
              </div>
              <div className="paperRow">
                <span>จำนวนรับเข้าคลัง:</span>
                <span className="qtyHighlight">+{receiptData.quantity} ชิ้น</span>
              </div>
              <div className="paperRow">
                <span>สต็อกคงเหลือใหม่:</span>
                <span className="stockHighlight">{receiptData.new_stock} ชิ้น</span>
              </div>
              <div className="paperRow">
                <span>ช่องทางชำระเงิน:</span>
                <strong>{receiptData.payment_method || "PromptPay"}</strong>
              </div>
              <div className="paperRow">
                <span>ยอดเงินที่ชำระ:</span>
                <strong className="textSuccess">
                  ฿{parseFloat(receiptData.paid_amount || totalCost).toLocaleString()} บาท
                </strong>
              </div>
              <div className="paperRow">
                <span>เลขที่อ้างอิง:</span>
                <span>{receiptData.payment_ref || "-"}</span>
              </div>
              <div className="paperRow">
                <span>วันที่-เวลาชำระ:</span>
                <span>{new Date().toLocaleString("th-TH")}</span>
              </div>
            </div>

            <div className="receiptActions">
              <button
                type="button"
                className="btnPrintReceipt"
                onClick={() => window.print()}
              >
                <Printer size={16} />
                <span>พิมพ์ใบเสร็จ</span>
              </button>
              <button
                type="button"
                className="btnGoOrderHistory"
                onClick={() => navigate("/products/order")}
              >
                กลับหน้ารายการเสนอสั่งซื้อ
              </button>
              <button
                type="button"
                className="btnGoProductList"
                onClick={() => navigate("/products")}
              >
                ดูรายการสินค้าในคลัง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
