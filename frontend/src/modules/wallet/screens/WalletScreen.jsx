// src/modules/wallet/screens/WalletScreen.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  RefreshCw,
  QrCode,
  CreditCard,
  Building2,
  CheckCircle2,
  Clock,
  History,
  ShieldCheck,
  ShoppingBag,
  User,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import {
  topupUserWallet,
  getUserWalletHistory,
} from "../../../api/roleSystemApi";

export default function WalletScreen() {
  const { user, token, updateCurrentUser } = useAuth();

  const [balance, setBalance] = useState(parseFloat(user?.wallet_balance || 0));
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // ฟอร์มเติมเงิน
  const [topupAmount, setTopupAmount] = useState("300");
  const [paymentChannel, setPaymentChannel] = useState("พร้อมเพย์ / PromptPay");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    loadWalletData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadWalletData = async () => {
    setLoading(true);
    const res = await getUserWalletHistory(token);
    if (res && !res.error) {
      if (res.wallet_balance !== undefined) {
        setBalance(parseFloat(res.wallet_balance));
        if (updateCurrentUser) {
          updateCurrentUser({ wallet_balance: parseFloat(res.wallet_balance) });
        }
      }
      setHistory(res.history || []);
    }
    setLoading(false);
  };

  const handleTopup = async (e) => {
    e.preventDefault();
    const amt = parseFloat(topupAmount);
    if (isNaN(amt) || amt <= 0) {
      alert("กรุณาระบุจำนวนเงินที่ต้องการเติมให้ถูกต้อง (ต้องมากกว่า 0 บาท)");
      return;
    }

    setSubmitting(true);
    setSuccessMessage("");
    const res = await topupUserWallet(
      { amount: amt, payment_channel: paymentChannel },
      token
    );
    setSubmitting(false);

    if (res && !res.error) {
      const newBal = parseFloat(res.wallet_balance || balance + amt);
      setBalance(newBal);
      if (updateCurrentUser) {
        updateCurrentUser({ wallet_balance: newBal });
      }
      setSuccessMessage(
        res.message || `เติมเงินสำเร็จ ฿${amt.toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท!`
      );
      // โหลดประวัติใหม่
      loadWalletData();
    } else {
      alert(res?.error || "เกิดข้อผิดพลาดในการเติมเงิน");
    }
  };

  const formatMoney = (num) => {
    return Number(num || 0).toLocaleString("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div style={{ maxWidth: 1140, margin: "0 auto", padding: "24px 16px 60px" }}>
      {/* Top Banner / Hero */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
          borderRadius: 20,
          color: "#ffffff",
          padding: "28px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 20,
          boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.3)",
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: 16,
              background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 16px rgba(59, 130, 246, 0.4)",
            }}
          >
            <Wallet size={30} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>
                กระเป๋าเงิน & ยอดเงินคงเหลือ
              </h1>
              <span
                style={{
                  fontSize: 11,
                  background: "#2563eb",
                  color: "#ffffff",
                  padding: "2px 8px",
                  borderRadius: 999,
                  fontWeight: 700,
                }}
              >
                My Wallet
              </span>
            </div>
            <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: 13.5 }}>
              ตรวจสอบยอดเงินคงเหลือ เติมเงินเข้าบัญชี และติดตามประวัติการทำรายการของคุณ
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            onClick={loadWalletData}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 16px",
              borderRadius: 10,
              border: "1px solid #334155",
              background: "rgba(30, 41, 59, 0.6)",
              color: "#e2e8f0",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            รีเฟรชข้อมูล
          </button>
          <Link
            to="/shop"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 18px",
              borderRadius: 10,
              background: "#2563eb",
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            <ShoppingBag size={14} />
            ไปซื้อสินค้า
          </Link>
        </div>
      </div>

      {/* Main Grid: Balance & Top-up Card (Left) + Details / Info (Right) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: 24,
          marginBottom: 28,
        }}
      >
        {/* Card 1: ยอดเงินคงเหลือในบัญชี */}
        <div
          style={{
            background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
            borderRadius: 20,
            padding: "28px",
            color: "#ffffff",
            boxShadow: "0 12px 24px -6px rgba(37, 99, 235, 0.35)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Background decorative circles */}
          <div
            style={{
              position: "absolute",
              right: -20,
              top: -20,
              width: 140,
              height: 140,
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.1)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 60,
              bottom: -40,
              width: 180,
              height: 180,
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.06)",
              pointerEvents: "none",
            }}
          />

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "#bfdbfe", fontWeight: 600 }}>
                ยอดเงินคงเหลือปัจจุบัน (Available Balance)
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  background: "rgba(255, 255, 255, 0.2)",
                  padding: "2px 8px",
                  borderRadius: 999,
                }}
              >
                <ShieldCheck size={12} />
                พร้อมใช้งาน
              </span>
            </div>

            <div style={{ margin: "16px 0 20px" }}>
              <div style={{ fontSize: 38, fontWeight: 900, fontFamily: "monospace", letterSpacing: "-0.5px" }}>
                ฿ {formatMoney(balance)} <span style={{ fontSize: 18, fontWeight: 600 }}>บาท</span>
              </div>
            </div>
          </div>

          <div
            style={{
              background: "rgba(0, 0, 0, 0.15)",
              borderRadius: 12,
              padding: "12px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 12.5,
            }}
          >
            <div>
              <div style={{ color: "#bfdbfe", fontSize: 11 }}>เจ้าของบัญชี</div>
              <div style={{ fontWeight: 700 }}>{user?.name || user?.username}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "#bfdbfe", fontSize: 11 }}>ชื่อผู้ใช้งาน</div>
              <div style={{ fontWeight: 700, fontFamily: "monospace" }}>@{user?.username}</div>
            </div>
          </div>
        </div>

        {/* Card 2: ฟอร์มเติมเงินเข้าบัญชี (เติมในหน้านี้ได้เลย) */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: 20,
            padding: "28px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "#ecfdf5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#059669",
              }}
            >
              <Plus size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: "#0f172a" }}>
                เติมเงินเข้าบัญชี (Top-Up)
              </h2>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>
                เลือกจำนวนเงินและช่องทางชำระเงินเพื่อเติมเข้ากระเป๋าเงินทันที
              </p>
            </div>
          </div>

          {successMessage && (
            <div
              style={{
                background: "#ecfdf5",
                color: "#065f46",
                border: "1px solid #a7f3d0",
                padding: "10px 14px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <CheckCircle2 size={16} color="#059669" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleTopup}>
            {/* Quick Amount Selector */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#475569", marginBottom: 8 }}>
                เลือกจำนวนเงินด่วน:
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {[100, 200, 300, 500, 1000, 2000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTopupAmount(String(amt))}
                    style={{
                      padding: "8px 0",
                      borderRadius: 8,
                      border: "1px solid",
                      borderColor: topupAmount === String(amt) ? "#2563eb" : "#e2e8f0",
                      background: topupAmount === String(amt) ? "#eff6ff" : "#f8fafc",
                      color: topupAmount === String(amt) ? "#1d4ed8" : "#334155",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    +{amt} ฿
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount Input */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                หรือระบุจำนวนเงินที่ต้องการเติม (บาท) <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontWeight: 700,
                    color: "#64748b",
                    fontSize: 16,
                  }}
                >
                  ฿
                </span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  placeholder="เช่น 500"
                  style={{
                    width: "100%",
                    padding: "10px 14px 10px 32px",
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    fontSize: 16,
                    fontWeight: 700,
                    boxSizing: "border-box",
                  }}
                  required
                />
              </div>
            </div>

            {/* Payment Channel Radio Options */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "#475569", marginBottom: 8 }}>
                ช่องทางชำระเงิน:
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <label
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid",
                    borderColor: paymentChannel === "พร้อมเพย์ / PromptPay" ? "#2563eb" : "#e2e8f0",
                    background: paymentChannel === "พร้อมเพย์ / PromptPay" ? "#eff6ff" : "#f8fafc",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: paymentChannel === "พร้อมเพย์ / PromptPay" ? "#1d4ed8" : "#334155",
                  }}
                >
                  <input
                    type="radio"
                    name="channel"
                    value="พร้อมเพย์ / PromptPay"
                    checked={paymentChannel === "พร้อมเพย์ / PromptPay"}
                    onChange={(e) => setPaymentChannel(e.target.value)}
                    style={{ margin: 0 }}
                  />
                  <QrCode size={16} />
                  <span>สแกน QR พร้อมเพย์</span>
                </label>

                <label
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid",
                    borderColor: paymentChannel === "โอนเงินผ่านธนาคาร" ? "#2563eb" : "#e2e8f0",
                    background: paymentChannel === "โอนเงินผ่านธนาคาร" ? "#eff6ff" : "#f8fafc",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: paymentChannel === "โอนเงินผ่านธนาคาร" ? "#1d4ed8" : "#334155",
                  }}
                >
                  <input
                    type="radio"
                    name="channel"
                    value="โอนเงินผ่านธนาคาร"
                    checked={paymentChannel === "โอนเงินผ่านธนาคาร"}
                    onChange={(e) => setPaymentChannel(e.target.value)}
                    style={{ margin: 0 }}
                  />
                  <Building2 size={16} />
                  <span>โอนผ่านธนาคาร</span>
                </label>
              </div>
            </div>

            {/* QR Simulation Preview if PromptPay is selected */}
            {paymentChannel === "พร้อมเพย์ / PromptPay" && parseFloat(topupAmount) > 0 && (
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px dashed #cbd5e1",
                  borderRadius: 12,
                  padding: "14px",
                  textAlign: "center",
                  marginBottom: 18,
                }}
              >
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>
                  📱 QR Code พร้อมเพย์สำหรับเติมเงินยอด:
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#1e293b", marginBottom: 8 }}>
                  ฿{formatMoney(topupAmount)} บาท
                </div>
                <div
                  style={{
                    width: 100,
                    height: 100,
                    margin: "0 auto 8px",
                    background: "#ffffff",
                    border: "2px solid #0f172a",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                  }}
                >
                  <QrCode size={70} color="#0f172a" />
                </div>
                <small style={{ color: "#64748b", fontSize: 11 }}>
                  กดปุ่มด้านล่างเพื่อยืนยันการเติมเงินเข้าบัญชีทันที
                </small>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 10,
                border: "none",
                background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                color: "#ffffff",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
              }}
            >
              {submitting ? (
                <span>กำลังทำรายการเติมเงิน...</span>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>ยืนยันเติมเงิน ฿{formatMoney(topupAmount)} บาท</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Transaction History Section */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 20,
          padding: "24px 28px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 18,
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "#f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#475569",
              }}
            >
              <History size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "#0f172a" }}>
                ประวัติความเคลื่อนไหวในกระเป๋าเงิน ({history.length} รายการ)
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>
                บันทึกรายการเติมเงิน การใช้จ่าย และการปรับยอดเงินย้อนหลัง
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
            กำลังโหลดประวัติการทำรายการ...
          </div>
        ) : history.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              background: "#f8fafc",
              borderRadius: 12,
              color: "#64748b",
            }}
          >
            <Wallet size={32} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
            <div style={{ fontWeight: 600 }}>ยังไม่มีประวัติการทำรายการในบัญชีของคุณ</div>
            <p style={{ fontSize: 12, margin: "4px 0 0", color: "#94a3b8" }}>
              เมื่อคุณเติมเงินหรือซื้อสินค้า รายการความเคลื่อนไหวจะปรากฏที่นี่
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
                  <th style={{ padding: "10px 14px", color: "#64748b", fontWeight: 700 }}>วันที่ / เวลา</th>
                  <th style={{ padding: "10px 14px", color: "#64748b", fontWeight: 700 }}>ประเภท</th>
                  <th style={{ padding: "10px 14px", color: "#64748b", fontWeight: 700, textAlign: "right" }}>
                    จำนวนเงิน
                  </th>
                  <th style={{ padding: "10px 14px", color: "#64748b", fontWeight: 700, textAlign: "right" }}>
                    ยอดคงเหลือหลังทำรายการ
                  </th>
                  <th style={{ padding: "10px 14px", color: "#64748b", fontWeight: 700 }}>รายละเอียด</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, idx) => {
                  const isPositive = parseFloat(h.amount) > 0;
                  return (
                    <tr
                      key={h.history_id || idx}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        transition: "background 0.1s",
                      }}
                    >
                      <td style={{ padding: "12px 14px", color: "#475569", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Clock size={13} color="#94a3b8" />
                          <span>{formatDate(h.created_at)}</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        {h.type === "topup" ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              background: "#ecfdf5",
                              color: "#059669",
                              padding: "3px 8px",
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            <ArrowUpRight size={13} />
                            เติมเงินเข้าบัญชี
                          </span>
                        ) : h.type === "payment" ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              background: "#fef2f2",
                              color: "#dc2626",
                              padding: "3px 8px",
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            <ArrowDownRight size={13} />
                            ชำระค่าสินค้า
                          </span>
                        ) : (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              background: "#eff6ff",
                              color: "#2563eb",
                              padding: "3px 8px",
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            ปรับยอดโดยผู้ดูแล
                          </span>
                        )}
                      </td>
                      <td
                        style={{
                          padding: "12px 14px",
                          textAlign: "right",
                          fontFamily: "monospace",
                          fontWeight: 800,
                          fontSize: 14,
                          color: isPositive ? "#059669" : "#dc2626",
                        }}
                      >
                        {isPositive ? "+" : ""}
                        ฿{formatMoney(Math.abs(h.amount))}
                      </td>
                      <td
                        style={{
                          padding: "12px 14px",
                          textAlign: "right",
                          fontFamily: "monospace",
                          fontWeight: 700,
                          color: "#1e293b",
                        }}
                      >
                        ฿{formatMoney(h.balance_after)}
                      </td>
                      <td style={{ padding: "12px 14px", color: "#64748b", fontSize: 13 }}>
                        {h.note || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
