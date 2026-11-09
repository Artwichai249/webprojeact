import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Trash2,
  FileText,
  DollarSign,
  PieChart,
  CheckCircle2,
  X,
  Layers,
  Building2,
  Landmark,
  CreditCard,
  Edit3,
  Users,
  UserCheck,
  Coins,
  ArrowRight,
  User,
} from "lucide-react";
import {
  getFinanceSummary,
  createFinanceTransaction,
  deleteFinanceTransaction,
  getBankAccount,
  updateBankAccount,
} from "../../../api/financeApi";
import { adjustMemberWallet, topupUserWallet } from "../../../api/roleSystemApi";
import { useAuth } from "../../auth/AuthContext";
import "./FinanceSummary.css";

export default function FinanceSummary() {
  const { user, token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState({
    summary: {
      totalIncome: 0,
      totalExpense: 0,
      netProfit: 0,
      totalCount: 0,
      incomeCount: 0,
      expenseCount: 0,
      totalUserWalletBalance: 0,
      currentUserWalletBalance: 0,
      bankBalance: 50000,
      initialBalance: 50000,
    },
    userWalletList: [],
    currentUserWalletBalance: 0,
    totalUserWalletBalance: 0,
    bankAccount: {
      bank_name: "ธนาคารกสิกรไทย (KBANK)",
      account_number: "098-7-65432-1",
      account_name: "ร้านค้าครบวงจร (บัญชีหลัก)",
      initial_balance: 50000,
      current_balance: 50000,
      note: "ยอดเงินตั้งต้นในบัญชีของร้านค้า",
    },
    transactions: [],
  });

  // แท็บระบบการเงิน: รายรับ-รายจ่าย vs ยอดเงินในบัญชีของผู้ใช้งาน
  const [activeFinanceTab, setActiveFinanceTab] = useState("transactions"); // 'transactions' | 'userWallets'

  // Modal สำหรับเติมเงิน / ปรับยอดเงินในบัญชีของผู้ใช้งาน
  const [selectedUserWallet, setSelectedUserWallet] = useState(null);
  const [walletAdjustAmount, setWalletAdjustAmount] = useState("100");
  const [walletAdjustReason, setWalletAdjustReason] = useState("เติมเงินเข้าบัญชีผู้ใช้งาน");
  const [walletAdjusting, setWalletAdjusting] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");

  // ข้อมูลบัญชีธนาคารและยอดเงินในบัญชี
  const [bankAccount, setBankAccount] = useState({
    bank_name: "ธนาคารกสิกรไทย (KBANK)",
    account_number: "098-7-65432-1",
    account_name: "ร้านค้าครบวงจร (บัญชีหลัก)",
    initial_balance: 50000,
    current_balance: 50000,
    note: "ยอดเงินตั้งต้นในบัญชีของร้านค้า",
  });
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [savingBank, setSavingBank] = useState(false);
  const [bankFormData, setBankFormData] = useState({
    bank_name: "ธนาคารกสิกรไทย (KBANK)",
    account_number: "098-7-65432-1",
    account_name: "ร้านค้าครบวงจร (บัญชีหลัก)",
    initial_balance: "50000",
    note: "ยอดเงินตั้งต้นในบัญชีของร้านค้า",
  });

  // Filter States
  const [period, setPeriod] = useState("all"); // 'all' | 'today' | 'week' | 'month'
  const [typeFilter, setTypeFilter] = useState("all"); // 'all' | 'income' | 'expense'
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State for adding custom transaction
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: "expense",
    category: "ค่าสาธารณูปโภค",
    title: "",
    amount: "",
    transaction_date: new Date().toISOString().slice(0, 10),
    note: "",
  });

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    setLoading(true);
    const res = await getFinanceSummary({ period: period === "all" ? "" : period }, token);
    if (res && !res.error) {
      setSummaryData(res);
      if (res.bankAccount) {
        setBankAccount(res.bankAccount);
      }
    }
    setLoading(false);
  };

  const handleOpenUserWalletModal = (userItem = null) => {
    if (userItem) {
      setSelectedUserWallet(userItem);
    } else {
      setSelectedUserWallet({
        username: user?.username || "admin1",
        member_name: user?.name || user?.username,
        wallet_balance: summaryData.currentUserWalletBalance || 0,
      });
    }
    setWalletAdjustAmount("100");
    setWalletAdjustReason("เติมเงินเข้าบัญชีผู้ใช้งาน");
  };

  const handleSaveUserWallet = async (e) => {
    e.preventDefault();
    if (!selectedUserWallet || !walletAdjustAmount) {
      alert("กรุณาระบุจำนวนเงิน");
      return;
    }
    const amt = parseFloat(walletAdjustAmount);
    if (isNaN(amt) || amt === 0) {
      alert("กรุณาระบุจำนวนเงินที่ถูกต้อง");
      return;
    }
    setWalletAdjusting(true);
    const res = await adjustMemberWallet(
      selectedUserWallet.username,
      { amount_change: amt, reason: walletAdjustReason },
      token
    );
    setWalletAdjusting(false);
    if (res && !res.error) {
      alert(res.message || "ปรับยอดเงินในบัญชีผู้ใช้งานสำเร็จ!");
      setSelectedUserWallet(null);
      loadData();
    } else {
      alert(res?.error || "ไม่สามารถปรับยอดเงินได้");
    }
  };

  const handleOpenBankModal = () => {
    setBankFormData({
      bank_name: bankAccount.bank_name || "ธนาคารกสิกรไทย (KBANK)",
      account_number: bankAccount.account_number || "098-7-65432-1",
      account_name: bankAccount.account_name || "ร้านค้าครบวงจร (บัญชีหลัก)",
      initial_balance: String(bankAccount.initial_balance ?? 50000),
      note: bankAccount.note || "",
    });
    setIsBankModalOpen(true);
  };

  const handleSaveBankAccount = async (e) => {
    e.preventDefault();
    setSavingBank(true);
    const res = await updateBankAccount(bankFormData, token);
    setSavingBank(false);

    if (res && !res.error) {
      alert("บันทึกข้อมูลและปรับปรุงยอดเงินในบัญชีสำเร็จ!");
      setIsBankModalOpen(false);
      loadData();
    } else {
      alert(`เกิดข้อผิดพลาด: ${res?.error || "ไม่สามารถบันทึกข้อมูลได้"}`);
    }
  };

  const handleOpenModal = (defaultType = "expense") => {
    setFormData({
      type: defaultType,
      category: defaultType === "income" ? "รายได้อื่น ๆ" : "ค่าสาธารณูปโภค",
      title: "",
      amount: "",
      transaction_date: new Date().toISOString().slice(0, 10),
      note: "",
    });
    setIsModalOpen(true);
  };

  const handleCreateTransaction = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.amount) {
      alert("กรุณากรอกชื่อรายการและจำนวนเงิน");
      return;
    }
    setSubmitting(true);
    const res = await createFinanceTransaction(formData, token);
    setSubmitting(false);

    if (res && !res.error) {
      alert("บันทึกรายการสำเร็จ!");
      setIsModalOpen(false);
      loadData();
    } else {
      alert(`เกิดข้อผิดพลาด: ${res?.error || "ไม่สามารถบันทึกรายการได้"}`);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`คุณต้องการลบรายการ "${title}" ใช่หรือไม่?`)) return;
    const res = await deleteFinanceTransaction(id, token);
    if (res && !res.error) {
      loadData();
    } else {
      alert(`ไม่สามารถลบได้: ${res?.error || "เกิดข้อผิดพลาด"}`);
    }
  };

  const formatMoney = (amount) => {
    return Number(amount || 0).toLocaleString("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // กรองตามประเภทและการค้นหา
  const filteredTransactions = (summaryData.transactions || []).filter((t) => {
    const matchesType = typeFilter === "all" || t.type === typeFilter;
    const matchesSearch =
      (t.title && t.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.reference_no && t.reference_no.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.category && t.category.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  // กรองรายชื่อผู้ใช้งานและยอดเงินในบัญชี
  const filteredUserWallets = (summaryData.userWalletList || []).filter((u) => {
    if (!userSearchQuery.trim()) return true;
    const q = userSearchQuery.trim().toLowerCase();
    return (
      (u.member_name && u.member_name.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.nisit_id && String(u.nisit_id).toLowerCase().includes(q)) ||
      (u.phone && String(u.phone).includes(q))
    );
  });

  const { totalIncome, totalExpense, netProfit, incomeCount, expenseCount, totalCount } =
    summaryData.summary;

  const currentBankBalance =
    bankAccount?.current_balance !== undefined
      ? bankAccount.current_balance
      : (summaryData.summary?.bankBalance || 50000);

  const totalFlow = totalIncome + totalExpense;
  const incomePercent = totalFlow > 0 ? Math.round((totalIncome / totalFlow) * 100) : 50;
  const expensePercent = totalFlow > 0 ? 100 - incomePercent : 50;

  return (
    <div className="finance-container">
      {/* Header Section */}
      <div className="finance-header">
        <div className="finance-header-title">
          <div className="finance-icon-box">
            <Landmark size={26} />
          </div>
          <div>
            <div className="title-with-badge">
              <h1>สรุปภาพรวมรายรับ - รายจ่าย & บัญชีการเงิน</h1>
              <span className="badge-admin">ระบบการเงิน</span>
            </div>
            <p>
              รายงานยอดเงินในบัญชีธนาคาร กระแสเงินสด รายรับ-รายจ่าย และกำไรขาดทุนแบบ Real-time
            </p>
          </div>
        </div>

        <div className="finance-header-actions">
          <button
            type="button"
            className="btn-manage-bank"
            onClick={handleOpenBankModal}
          >
            <Building2 size={16} />
            จัดการบัญชี & ปรับยอดเงิน
          </button>
          <button
            type="button"
            className="btn-add-income"
            onClick={() => handleOpenModal("income")}
          >
            <Plus size={16} />
            บันทึกรายรับ
          </button>
          <button
            type="button"
            className="btn-add-expense"
            onClick={() => handleOpenModal("expense")}
          >
            <Plus size={16} />
            บันทึกรายจ่าย
          </button>
          <button
            type="button"
            className="btn-refresh"
            onClick={loadData}
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw size={15} className={loading ? "spin" : ""} />
            รีเฟรช
          </button>
        </div>
      </div>

      {/* บัตรข้อมูลยอดเงินในบัญชีของลูกค้า & กระเป๋าเงินลูกค้า */}
      <div className="bank-details-banner">
        <div className="bank-details-left">
          <div className="bank-logo-badge" style={{ background: "linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)" }}>
            <Wallet size={26} />
          </div>
          <div className="bank-details-info">
            <h3>
              <span>ยอดเงินในบัญชีของลูกค้า (Customer Account Balance)</span>
              <span className="badge-admin" style={{ background: "#4f46e5", fontSize: "11px" }}>
                กระเป๋าเงินลูกค้า / สมาชิก
              </span>
            </h3>
            <p>
              <span>บัญชีของคุณ: <strong>@{user?.username} ({user?.name || user?.username})</strong></span>
              <span>ลูกค้าในระบบทั้งหมด: <span className="account-num">{summaryData.userWalletList?.length || 0} บัญชี</span></span>
            </p>
          </div>
        </div>

        <div className="bank-details-right">
          <div className="bank-balance-box">
            <span className="balance-title">ยอดเงินในบัญชีของคุณ</span>
            <span className="balance-amount" style={{ color: "#38bdf8" }}>
              ฿{formatMoney(summaryData.currentUserWalletBalance || 0)} บาท
            </span>
            <span className="initial-note">
              (ยอดรวมเงินในบัญชีลูกค้าทั้งระบบ: ฿{formatMoney(summaryData.totalUserWalletBalance || 0)} บาท)
            </span>
          </div>
          <button
            type="button"
            className="btn-bank-action"
            style={{ background: "linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)" }}
            onClick={() => handleOpenUserWalletModal()}
          >
            <Plus size={15} />
            เติมเงินเข้าบัญชี
          </button>
        </div>
      </div>

      {/* KPI Cards (4 Cards) */}
      <div className="kpi-grid">
        {/* Card 1: ยอดเงินในบัญชีของลูกค้า (Customer Account Balance) */}
        <div className="kpi-card bank-card">
          <div className="kpi-icon bank-icon" style={{ background: "#e0e7ff", color: "#3730a3" }}>
            <Wallet size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">ยอดเงินในบัญชีของลูกค้า (Customer Balance)</span>
            <div className="kpi-value" style={{ color: "#3730a3" }}>
              ฿{formatMoney(summaryData.currentUserWalletBalance || 0)} <span className="kpi-unit">บาท</span>
            </div>
            <span className="kpi-subtext">
              บัญชีของคุณ • รวมในบัญชีลูกค้าทั้งหมด: ฿{formatMoney(summaryData.totalUserWalletBalance || 0)}
            </span>
            <button
              type="button"
              className="btn-edit-inline"
              onClick={() => handleOpenUserWalletModal()}
            >
              <Plus size={12} />
              เติมเงิน / ปรับยอดเงินลูกค้า
            </button>
          </div>
        </div>

        {/* Card 2: รายรับรวม */}
        <div className="kpi-card income-card">
          <div className="kpi-icon income-icon">
            <ArrowUpRight size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">รายรับรวม (Total Income)</span>
            <div className="kpi-value text-emerald-600">
              +{formatMoney(totalIncome)} <span className="kpi-unit">บาท</span>
            </div>
            <span className="kpi-subtext">
              จากทั้งหมด <strong>{incomeCount}</strong> รายการ (ยอดขาย POS + อื่น ๆ)
            </span>
          </div>
        </div>

        {/* Card 3: รายจ่ายรวม */}
        <div className="kpi-card expense-card">
          <div className="kpi-icon expense-icon">
            <ArrowDownRight size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">รายจ่ายรวม (Total Expense)</span>
            <div className="kpi-value text-rose-600">
              -{formatMoney(totalExpense)} <span className="kpi-unit">บาท</span>
            </div>
            <span className="kpi-subtext">
              จากทั้งหมด <strong>{expenseCount}</strong> รายการ (สั่งซื้อสินค้า + ค่าใช้จ่าย)
            </span>
          </div>
        </div>

        {/* Card 4: กำไรสุทธิ */}
        <div className={`kpi-card ${netProfit >= 0 ? "profit-card" : "loss-card"}`}>
          <div className={`kpi-icon ${netProfit >= 0 ? "profit-icon" : "loss-icon"}`}>
            <Wallet size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">กำไร / คงเหลือสุทธิ (Net Balance)</span>
            <div className={`kpi-value ${netProfit >= 0 ? "text-indigo-600" : "text-rose-600"}`}>
              {netProfit >= 0 ? `+${formatMoney(netProfit)}` : formatMoney(netProfit)}{" "}
              <span className="kpi-unit">บาท</span>
            </div>
            <span className="kpi-subtext">
              {netProfit >= 0 ? "ผลประกอบการกำไรเป็นบวก" : "ผลประกอบการรายจ่ายมากกว่ารายรับ"}
            </span>
          </div>
        </div>
      </div>

      {/* Cashflow Proportion Bar */}
      <div className="cashflow-bar-container">
        <div className="cashflow-bar-header">
          <div className="cashflow-label">
            <PieChart size={16} />
            <span>สัดส่วนกระแสเงินสด (Cash Flow Proportion)</span>
          </div>
          <div className="cashflow-percentages">
            <span className="text-emerald-700 font-semibold">รายรับ {incomePercent}%</span>
            <span className="text-slate-400">vs</span>
            <span className="text-rose-700 font-semibold">รายจ่าย {expensePercent}%</span>
          </div>
        </div>
        <div className="cashflow-track">
          <div
            className="cashflow-segment income-segment"
            style={{ width: `${incomePercent}%` }}
            title={`รายรับ: ${formatMoney(totalIncome)} บาท (${incomePercent}%)`}
          />
          <div
            className="cashflow-segment expense-segment"
            style={{ width: `${expensePercent}%` }}
            title={`รายจ่าย: ${formatMoney(totalExpense)} บาท (${expensePercent}%)`}
          />
        </div>
      </div>

      {/* แถบสลับเมนู: รายการรายรับ-รายจ่าย vs ยอดเงินในบัญชีผู้ใช้งาน */}
      <div style={{ display: "flex", gap: "10px", marginTop: "4px", marginBottom: "4px" }}>
        <button
          type="button"
          onClick={() => setActiveFinanceTab("transactions")}
          style={{
            padding: "10px 22px",
            borderRadius: "10px",
            border: "none",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: "13px",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: activeFinanceTab === "transactions" ? "#0f172a" : "#f1f5f9",
            color: activeFinanceTab === "transactions" ? "#ffffff" : "#475569",
            boxShadow: activeFinanceTab === "transactions" ? "0 4px 10px rgba(15,23,42,0.2)" : "none",
            transition: "all 0.2s",
          }}
        >
          <FileText size={16} />
          ประวัติรายรับ - รายจ่าย ({filteredTransactions.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveFinanceTab("userWallets")}
          style={{
            padding: "10px 22px",
            borderRadius: "10px",
            border: "none",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: "13px",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: activeFinanceTab === "userWallets" ? "#2563eb" : "#f1f5f9",
            color: activeFinanceTab === "userWallets" ? "#ffffff" : "#475569",
            boxShadow: activeFinanceTab === "userWallets" ? "0 4px 10px rgba(37,99,235,0.25)" : "none",
            transition: "all 0.2s",
          }}
        >
          <Users size={16} />
          ยอดเงินในบัญชีของลูกค้า ({summaryData.userWalletList?.length || 0} คน)
        </button>
      </div>

      {activeFinanceTab === "transactions" ? (
        <>
          {/* Filter Toolbar */}
          <div className="toolbar-section">
        {/* Period Buttons */}
        <div className="period-tabs">
          <span className="toolbar-label">ช่วงเวลา:</span>
          <button
            type="button"
            className={`period-btn ${period === "all" ? "active" : ""}`}
            onClick={() => setPeriod("all")}
          >
            ทั้งหมด
          </button>
          <button
            type="button"
            className={`period-btn ${period === "today" ? "active" : ""}`}
            onClick={() => setPeriod("today")}
          >
            วันนี้
          </button>
          <button
            type="button"
            className={`period-btn ${period === "week" ? "active" : ""}`}
            onClick={() => setPeriod("week")}
          >
            7 วันล่าสุด
          </button>
          <button
            type="button"
            className={`period-btn ${period === "month" ? "active" : ""}`}
            onClick={() => setPeriod("month")}
          >
            เดือนนี้
          </button>
        </div>

        {/* Type Filter & Search Bar */}
        <div className="filter-controls">
          <div className="type-toggle">
            <button
              type="button"
              className={`type-btn ${typeFilter === "all" ? "active" : ""}`}
              onClick={() => setTypeFilter("all")}
            >
              ทั้งหมด ({summaryData.transactions.length})
            </button>
            <button
              type="button"
              className={`type-btn income ${typeFilter === "income" ? "active" : ""}`}
              onClick={() => setTypeFilter("income")}
            >
              เฉพาะรายรับ ({incomeCount})
            </button>
            <button
              type="button"
              className={`type-btn expense ${typeFilter === "expense" ? "active" : ""}`}
              onClick={() => setTypeFilter("expense")}
            >
              เฉพาะรายจ่าย ({expenseCount})
            </button>
          </div>

          <div className="search-box">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="ค้นหาชื่อรายการ, หมวดหมู่, เลขที่..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search"
                onClick={() => setSearchQuery("")}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Transactions Table Section */}
      <div className="table-card">
        <div className="table-header-bar">
          <div className="table-title">
            <FileText size={18} />
            <span>ประวัติรายการทางการเงิน ({filteredTransactions.length} รายการ)</span>
          </div>
          <span className="table-note">
            ดึงข้อมูลอัตโนมัติจากระบบ POS + ระบบสต็อก + รายการที่บันทึก
          </span>
        </div>

        <div className="table-responsive">
          <table className="finance-table">
            <thead>
              <tr>
                <th style={{ width: "50px", textAlign: "center" }}>#</th>
                <th style={{ width: "130px" }}>วันที่ / เวลา</th>
                <th style={{ width: "140px" }}>เลขที่อ้างอิง</th>
                <th style={{ width: "110px", textAlign: "center" }}>ประเภท</th>
                <th style={{ width: "160px" }}>หมวดหมู่</th>
                <th>รายละเอียดรายการ</th>
                <th style={{ width: "130px" }}>ผู้บันทึก</th>
                <th style={{ width: "140px", textAlign: "right" }}>จำนวนเงิน (บาท)</th>
                <th style={{ width: "70px", textAlign: "center" }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-10 text-slate-400">
                    กำลังคำนวณและโหลดข้อมูลการเงิน...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-10 text-slate-400">
                    ไม่พบรายการธุรกรรมในช่วงเวลาและเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((item, index) => {
                  const isIncome = item.type === "income";
                  const dateStr = item.created_at
                    ? new Date(item.created_at).toLocaleDateString("th-TH", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : item.transaction_date;

                  return (
                    <tr
                      key={item.reference_no || index}
                      className={isIncome ? "row-income" : "row-expense"}
                    >
                      <td className="text-center text-slate-400 font-mono text-xs">
                        {index + 1}
                      </td>
                      <td className="font-mono text-xs text-slate-600">{dateStr}</td>
                      <td>
                        <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {item.reference_no}
                        </span>
                      </td>
                      <td className="text-center">
                        {isIncome ? (
                          <span className="pill-type income">
                            <ArrowUpRight size={12} /> รายรับ
                          </span>
                        ) : (
                          <span className="pill-type expense">
                            <ArrowDownRight size={12} /> รายจ่าย
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="category-tag">{item.category}</span>
                      </td>
                      <td>
                        <div className="font-medium text-slate-800">{item.title}</div>
                        {item.note && (
                          <div className="text-xs text-slate-400 mt-0.5">{item.note}</div>
                        )}
                      </td>
                      <td className="text-xs text-slate-600">{item.recorded_by || "-"}</td>
                      <td
                        className={`text-right font-mono font-bold text-sm ${
                          isIncome ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {isIncome ? "+" : "-"}
                        {formatMoney(item.amount)}
                      </td>
                      <td className="text-center">
                        {item.source === "custom" ? (
                          <button
                            type="button"
                            className="btn-delete-row"
                            onClick={() => handleDelete(item.id, item.title)}
                            title="ลบรายการนี้"
                          >
                            <Trash2 size={14} />
                          </button>
                        ) : (
                          <span
                            className="text-[11px] text-slate-300 select-none"
                            title="รายการอัตโนมัติจากระบบ ไม่สามารถลบโดยตรงได้"
                          >
                            Auto
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      ) : (
        /* ตารางแสดงรายชื่อและยอดเงินในบัญชีของผู้ใช้งานแต่ละคน */
        <div className="table-card">
          <div className="table-header-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div className="table-title">
              <Users size={18} color="#2563eb" />
              <span>รายชื่อและยอดเงินคงเหลือในบัญชีของลูกค้าทั้งหมด ({filteredUserWallets.length} บัญชี)</span>
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
              <div className="search-box" style={{ maxWidth: "300px" }}>
                <Search size={15} className="search-icon" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ, username หรือเบอร์โทร..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="btn-add-income"
                style={{ background: "#2563eb" }}
                onClick={() => handleOpenUserWalletModal()}
              >
                <Plus size={15} />
                เติมเงินให้ลูกค้า
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="finance-table">
              <thead>
                <tr>
                  <th style={{ width: "50px", textAlign: "center" }}>#</th>
                  <th>รหัสสมาชิก</th>
                  <th>ชื่อ - นามสกุล</th>
                  <th>Username</th>
                  <th>เบอร์โทรศัพท์</th>
                  <th style={{ textAlign: "right" }}>ยอดเงินในบัญชีคงเหลือ</th>
                  <th style={{ textAlign: "center" }}>แต้มสะสม</th>
                  <th style={{ textAlign: "center", width: "160px" }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredUserWallets.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                      ไม่พบข้อมูลผู้ใช้งานที่ตรงกับเงื่อนไข
                    </td>
                  </tr>
                ) : (
                  filteredUserWallets.map((uItem, idx) => {
                    const isMe = (user?.username || "").toLowerCase() === (uItem.username || "").toLowerCase();
                    return (
                      <tr key={uItem.username || idx} style={isMe ? { background: "#eff6ff" } : {}}>
                        <td style={{ textAlign: "center", color: "#64748b", fontWeight: 700 }}>{idx + 1}</td>
                        <td style={{ fontFamily: "monospace", fontWeight: 700 }}>{uItem.nisit_id || "-"}</td>
                        <td>
                          <div style={{ fontWeight: 600, color: "#1e293b", display: "flex", alignItems: "center", gap: "6px" }}>
                            {uItem.member_name || uItem.username}
                            {isMe && (
                              <span style={{ fontSize: "10px", background: "#dbeafe", color: "#1d4ed8", padding: "1px 6px", borderRadius: "4px", fontWeight: 700 }}>
                                คุณ
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ fontFamily: "monospace", color: "#475569" }}>@{uItem.username}</td>
                        <td style={{ color: "#64748b" }}>{uItem.phone || "-"}</td>
                        <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: "15px", fontWeight: 700, color: "#1d4ed8" }}>
                          ฿{formatMoney(uItem.wallet_balance)}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span style={{ fontSize: "12px", background: "#fef3c7", color: "#b45309", padding: "2px 8px", borderRadius: "6px", fontWeight: 600 }}>
                            {Number(uItem.points || 0).toLocaleString()} แต้ม
                          </span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            type="button"
                            onClick={() => handleOpenUserWalletModal(uItem)}
                            style={{
                              padding: "5px 12px",
                              borderRadius: "6px",
                              border: "none",
                              background: "#2563eb",
                              color: "white",
                              fontSize: "12px",
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <Plus size={12} />
                            เติมเงิน / ปรับยอด
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: เพิ่มรายการรายรับ/รายจ่ายเพิ่มเติม */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-title-wrap">
                <DollarSign size={20} className={formData.type === "income" ? "text-emerald-600" : "text-rose-600"} />
                <h3>บันทึก{formData.type === "income" ? "รายรับ" : "รายจ่าย"}เพิ่มเติม</h3>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setIsModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTransaction} className="modal-form">
              {/* Type Switcher */}
              <div className="form-group">
                <label>ประเภทรายการ</label>
                <div className="type-selector">
                  <button
                    type="button"
                    className={`type-select-btn income ${formData.type === "income" ? "active" : ""}`}
                    onClick={() =>
                      setFormData({
                        ...formData,
                        type: "income",
                        category: "รายได้อื่น ๆ",
                      })
                    }
                  >
                    <ArrowUpRight size={16} />
                    <span>รายรับ (Income)</span>
                  </button>
                  <button
                    type="button"
                    className={`type-select-btn expense ${formData.type === "expense" ? "active" : ""}`}
                    onClick={() =>
                      setFormData({
                        ...formData,
                        type: "expense",
                        category: "ค่าสาธารณูปโภค",
                      })
                    }
                  >
                    <ArrowDownRight size={16} />
                    <span>รายจ่าย (Expense)</span>
                  </button>
                </div>
              </div>

              {/* Category */}
              <div className="form-group">
                <label>หมวดหมู่</label>
                {formData.type === "income" ? (
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="รายได้อื่น ๆ">รายได้อื่น ๆ</option>
                    <option value="ค่าบริการ">ค่าบริการ</option>
                    <option value="เงินคืน/ส่วนลด">เงินคืน / ส่วนลด</option>
                    <option value="ดอกเบี้ยรับ">ดอกเบี้ยรับ</option>
                    <option value="เงินสนับสนุน">เงินสนับสนุน</option>
                  </select>
                ) : (
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="ค่าสาธารณูปโภค">ค่าสาธารณูปโภค (ค่าน้ำ/ค่าไฟ/เน็ต)</option>
                    <option value="ค่าเช่าสถานที่">ค่าเช่าสถานที่ / ร้านค้า</option>
                    <option value="ค่าขนส่ง">ค่าขนส่ง / ค่าพัสดุ</option>
                    <option value="ค่าจ้าง/ค่าแรง">ค่าจ้าง / เงินเดือน / ค่าแรง</option>
                    <option value="ค่าอุปกรณ์และของใช้">ค่าอุปกรณ์และของใช้ในร้าน</option>
                    <option value="ค่าการตลาด">ค่าการตลาดและโฆษณา</option>
                    <option value="รายจ่ายเบ็ดเตล็ด">รายจ่ายเบ็ดเตล็ด</option>
                  </select>
                )}
              </div>

              {/* Title */}
              <div className="form-group">
                <label>ชื่อรายการ / คำอธิบาย <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  placeholder="เช่น ค่าไฟฟ้าร้านประจำเดือน, ค่าขนส่งพัสดุด่วน"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              {/* Amount & Date */}
              <div className="form-row">
                <div className="form-group">
                  <label>จำนวนเงิน (บาท) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>วันที่ทำรายการ</label>
                  <input
                    type="date"
                    value={formData.transaction_date}
                    onChange={(e) =>
                      setFormData({ ...formData, transaction_date: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              {/* Note */}
              <div className="form-group">
                <label>หมายเหตุเพิ่มเติม (ถ้ามี)</label>
                <textarea
                  rows="2"
                  placeholder="เช่น เลขที่บิล, ผู้รับเงิน..."
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsModalOpen(false)}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className={`btn-save ${formData.type === "income" ? "save-income" : "save-expense"}`}
                  disabled={submitting}
                >
                  {submitting ? "กำลังบันทึก..." : "บันทึกรายการ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal จัดการข้อมูลบัญชีธนาคาร & ปรับยอดเงินในบัญชี */}
      {isBankModalOpen && (
        <div className="modal-overlay" onClick={() => setIsBankModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Building2 size={20} color="#2563eb" />
                <h3>จัดการข้อมูลบัญชีธนาคาร & ปรับยอดเงินในบัญชี</h3>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={() => setIsBankModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveBankAccount} className="modal-form">
              {/* Bank Name */}
              <div className="form-group">
                <label>ชื่อธนาคาร / ช่องทางบัญชี <span className="text-rose-500">*</span></label>
                <select
                  value={bankFormData.bank_name}
                  onChange={(e) => setBankFormData({ ...bankFormData, bank_name: e.target.value })}
                  required
                >
                  <option value="ธนาคารกสิกรไทย (KBANK)">ธนาคารกสิกรไทย (KBANK)</option>
                  <option value="ธนาคารไทยพาณิชย์ (SCB)">ธนาคารไทยพาณิชย์ (SCB)</option>
                  <option value="ธนาคารกรุงเทพ (BBL)">ธนาคารกรุงเทพ (BBL)</option>
                  <option value="ธนาคารกรุงไทย (KTB)">ธนาคารกรุงไทย (KTB)</option>
                  <option value="ธนาคารกรุงศรีอยุธยา (BAY)">ธนาคารกรุงศรีอยุธยา (BAY)</option>
                  <option value="ธนาคารทหารไทยธนชาต (TTB)">ธนาคารทหารไทยธนชาต (TTB)</option>
                  <option value="ธนาคารออมสิน (GSB)">ธนาคารออมสิน (GSB)</option>
                  <option value="พร้อมเพย์ / PromptPay (ร้านค้า)">พร้อมเพย์ / PromptPay (ร้านค้า)</option>
                  <option value="บัญชีเงินสดหน้าร้าน (Cash Drawer)">บัญชีเงินสดหน้าร้าน (Cash Drawer)</option>
                </select>
              </div>

              {/* Account Number & Name */}
              <div className="form-row">
                <div className="form-group">
                  <label>เลขที่บัญชี <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    placeholder="เช่น 098-7-65432-1"
                    value={bankFormData.account_number}
                    onChange={(e) => setBankFormData({ ...bankFormData, account_number: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>ชื่อบัญชี <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    placeholder="เช่น ร้านค้าครบวงจร (บัญชีหลัก)"
                    value={bankFormData.account_name}
                    onChange={(e) => setBankFormData({ ...bankFormData, account_name: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Initial Balance */}
              <div className="form-group">
                <label>
                  ยอดเงินเริ่มต้นในบัญชี (บาท) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="เช่น 50000.00"
                  value={bankFormData.initial_balance}
                  onChange={(e) => setBankFormData({ ...bankFormData, initial_balance: e.target.value })}
                  required
                />
                <small style={{ color: "#64748b", marginTop: "4px", display: "block" }}>
                  💡 <strong>ยอดเงินในบัญชีปัจจุบัน</strong> จะคำนวณจาก: ยอดเริ่มต้น + (รายรับรวม - รายจ่ายรวม)
                </small>
              </div>

              {/* Note */}
              <div className="form-group">
                <label>หมายเหตุ / รายละเอียดเพิ่มเติม</label>
                <textarea
                  rows="2"
                  placeholder="เช่น บัญชีรับโอนเงิน POS และพร้อมเพย์ร้านค้า..."
                  value={bankFormData.note}
                  onChange={(e) => setBankFormData({ ...bankFormData, note: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsBankModalOpen(false)}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="btn-save"
                  style={{ background: "#2563eb" }}
                  disabled={savingBank}
                >
                  {savingBank ? "กำลังบันทึก..." : "บันทึกข้อมูลบัญชี & ยอดเงิน"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: เติมเงิน / ปรับยอดเงินในบัญชีผู้ใช้งาน */}
      {selectedUserWallet && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: "520px" }}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <Wallet size={20} className="text-indigo-600" />
                <h3>เติมเงิน / ปรับยอดเงินในบัญชีผู้ใช้งาน</h3>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setSelectedUserWallet(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveUserWallet} className="modal-form">
              <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>ผู้ใช้งาน:</span>
                  <strong style={{ fontSize: "14px", color: "#1e293b" }}>{selectedUserWallet.member_name || selectedUserWallet.username} (@{selectedUserWallet.username})</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>ยอดเงินปัจจุบัน:</span>
                  <strong style={{ fontSize: "16px", color: "#2563eb", fontFamily: "monospace" }}>฿{formatMoney(selectedUserWallet.wallet_balance || 0)}</strong>
                </div>
              </div>

              <div className="form-group">
                <label>จำนวนเงินที่ต้องการปรับ (บาท) <span className="text-rose-500">*</span></label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="เช่น 100, 500 หรือ -50 (ถ้าต้องการหัก)"
                  value={walletAdjustAmount}
                  onChange={(e) => setWalletAdjustAmount(e.target.value)}
                  required
                />
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "8px" }}>
                  {[100, 200, 300, 500, 1000, 2000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setWalletAdjustAmount(String(amt))}
                      style={{
                        padding: "4px 10px",
                        fontSize: "12px",
                        fontWeight: 600,
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        background: walletAdjustAmount === String(amt) ? "#2563eb" : "#f1f5f9",
                        color: walletAdjustAmount === String(amt) ? "#fff" : "#334155",
                        cursor: "pointer",
                      }}
                    >
                      +{amt} ฿
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>เหตุผล / บันทึกการทำรายการ</label>
                <input
                  type="text"
                  placeholder="เช่น เติมเงินผ่านพร้อมเพย์, คืนเงินค่าสินค้า, ปรับยอดผิด ฯลฯ"
                  value={walletAdjustReason}
                  onChange={(e) => setWalletAdjustReason(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setSelectedUserWallet(null)}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="btn-save"
                  style={{ background: "#2563eb" }}
                  disabled={walletAdjusting}
                >
                  {walletAdjusting ? "กำลังบันทึก..." : "ยืนยันการเติมเงิน / ปรับยอด"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
