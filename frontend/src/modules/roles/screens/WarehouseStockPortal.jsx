// src/modules/roles/screens/WarehouseStockPortal.jsx
import { useState, useEffect } from "react";
import {
  Boxes,
  Warehouse,
  ShieldCheck,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  RefreshCw,
  CheckCircle2,
  PackagePlus,
  Layers,
  X,
} from "lucide-react";
import {
  getWarehouseOverview,
  createWarehouse,
  receiveAndInspectQC,
} from "../../../api/roleSystemApi";
import { useAuth } from "../../auth/AuthContext";
import "./RoleSystem.css";

export default function WarehouseStockPortal() {
  const { token } = useAuth();

  // แท็บ: "qc" (รับสินค้าเข้าคลัง ตรวจ QC & บันทึกสินค้าชำรุด) | "warehouses" (ควบคุมโกดัง 1 หมวดหมู่ : 1 โกดัง)
  const [activeTab, setActiveTab] = useState("qc");

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalWarehouses: 0,
    totalProducts: 0,
    totalStockPieces: 0,
    totalQcLogs: 0,
    totalReceivedPieces: 0,
    totalPassedPieces: 0,
    totalDamagedPieces: 0,
  });
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [qcLogs, setQcLogs] = useState([]);

  // เงื่อนไขการค้นหาข้อมูล (3.4 ค้นหาข้อมูลตามเงื่อนไขที่ต้องการ)
  const [filters, setFilters] = useState({
    search: "",
    category: "all",
    warehouse_code: "all",
    qc_status: "all",
    only_damaged: "false",
  });

  // Modal สำหรับรับสินค้าเข้าคลังและตรวจสอบ QC (ข้อ 3)
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [qcForm, setQcForm] = useState({
    product_id: "",
    order_no: "",
    received_qty: "50",
    damaged_qty: "0",
    damage_reason: "",
    selected_warehouse_code: "auto",
  });

  // Modal สร้างโกดังใหม่ตามหมวดหมู่ (ข้อ 4: 1 หมวดหมู่ : 1 โกดัง)
  const [isAddWhOpen, setIsAddWhOpen] = useState(false);
  const [whForm, setWhForm] = useState({
    warehouse_code: "",
    warehouse_name: "",
    category: "",
    zone_detail: "",
    max_capacity: "500",
  });

  useEffect(() => {
    loadOverview();
  }, [filters.category, filters.warehouse_code, filters.qc_status, filters.only_damaged]);

  async function loadOverview(customFilters = filters) {
    setLoading(true);
    const res = await getWarehouseOverview(customFilters, token);
    if (res && !res.error) {
      if (res.summary) setSummary(res.summary);
      setWarehouses(res.warehouses || []);
      setProducts(res.products || []);
      setQcLogs(res.qcLogs || []);
      if (!qcForm.product_id && res.products?.length > 0) {
        setQcForm((prev) => ({ ...prev, product_id: res.products[0].product_id }));
      }
    }
    setLoading(false);
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadOverview(filters);
  };

  const handleResetFilters = () => {
    const reset = {
      search: "",
      category: "all",
      warehouse_code: "all",
      qc_status: "all",
      only_damaged: "false",
    };
    setFilters(reset);
    loadOverview(reset);
  };

  // สินค้าที่กำลังเลือกในฟอร์มตรวจรับ QC
  const selectedProductForQc = products.find((p) => p.product_id === qcForm.product_id);
  const recvNum = Math.max(0, parseInt(qcForm.received_qty, 10) || 0);
  const dmgNum = Math.max(0, parseInt(qcForm.damaged_qty, 10) || 0);
  const passedNum = Math.max(0, recvNum - dmgNum);

  const handleReceiveQcSubmit = async (e) => {
    e.preventDefault();
    if (!qcForm.product_id) {
      alert("กรุณาเลือกสินค้าที่รับเข้าคลัง");
      return;
    }
    if (recvNum <= 0) {
      alert("จำนวนที่รับเข้าคลังต้องมากกว่า 0 ชิ้น");
      return;
    }
    if (dmgNum > recvNum) {
      alert("จำนวนสินค้าชำรุดต้องไม่เกินจำนวนที่รับเข้าคลังทั้งหมด");
      return;
    }

    setSubmitting(true);
    const res = await receiveAndInspectQC(qcForm, token);
    setSubmitting(false);

    if (res && !res.error) {
      alert(res.message || "บันทึกการรับสินค้าเข้าคลังและตรวจสอบ QC สำเร็จ!");
      setIsReceiveOpen(false);
      setQcForm((prev) => ({
        ...prev,
        order_no: "",
        received_qty: "50",
        damaged_qty: "0",
        damage_reason: "",
        selected_warehouse_code: "auto",
      }));
      loadOverview();
    } else {
      alert(res?.error || "เกิดข้อผิดพลาดในการบันทึก QC");
    }
  };

  const handleAddWarehouseSubmit = async (e) => {
    e.preventDefault();
    if (!whForm.category.trim()) {
      alert("กรุณาระบุหมวดหมู่สินค้าสำหรับโกดังนี้");
      return;
    }
    setSubmitting(true);
    const res = await createWarehouse(whForm, token);
    setSubmitting(false);

    if (res && !res.error) {
      alert(res.message);
      setIsAddWhOpen(false);
      setWhForm({
        warehouse_code: "",
        warehouse_name: "",
        category: "",
        zone_detail: "",
        max_capacity: "500",
      });
      loadOverview();
    } else {
      alert(res?.error || "ไม่สามารถสร้างโกดังได้");
    }
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
    <div className="role-page">
      {/* Hero Banner */}
      <div className="role-hero warehouse-theme">
        <div className="role-hero-left">
          <div className="role-hero-icon">
            <Warehouse size={28} />
          </div>
          <div>
            <div className="role-hero-title">
              <h1>ระบบพนักงานสต็อก / คลังสินค้า (Warehouse & QC)</h1>
              <span className="role-badge-tag">คลังสินค้า & QC</span>
            </div>
            <p className="role-hero-subtitle">
              จัดการการรับสินค้าเข้าคลัง ตรวจสอบ QC บันทึกสินค้าชำรุด/เสียหาย และควบคุมโกดังตามหมวดหมู่ (1 หมวดหมู่ : 1 โกดัง)
            </p>
          </div>
        </div>

        <div className="role-hero-actions">
          <button type="button" className="role-btn outline" onClick={() => loadOverview()}>
            <RefreshCw size={16} />
            รีเฟรชข้อมูล
          </button>
          <button
            type="button"
            className="role-btn warning"
            onClick={() => setIsReceiveOpen(true)}
          >
            <PackagePlus size={16} />
            รับสินค้าเข้าคลัง & ตรวจ QC
          </button>
          <button
            type="button"
            className="role-btn primary"
            style={{ background: "#0f172a" }}
            onClick={() => setIsAddWhOpen(true)}
          >
            <Plus size={16} />
            เพิ่มโกดังประจำหมวดหมู่
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="role-stats-grid">
        <div className="role-stat-card">
          <div className="role-stat-info">
            <span>โกดังแยกตามหมวดหมู่</span>
            <strong>{summary.totalWarehouses} โกดัง</strong>
            <small>เงื่อนไข 1 หมวดหมู่ : 1 โกดัง</small>
          </div>
          <div className="role-stat-icon" style={{ background: "#e0e7ff", color: "#4f46e5" }}>
            <Warehouse size={24} />
          </div>
        </div>

        <div className="role-stat-card">
          <div className="role-stat-info">
            <span>สต็อกสินค้าพร้อมขายรวม</span>
            <strong style={{ color: "#2563eb" }}>{summary.totalStockPieces.toLocaleString()} ชิ้น</strong>
            <small>จากทั้งหมด {summary.totalProducts} รายการสินค้า</small>
          </div>
          <div className="role-stat-icon" style={{ background: "#dbeafe", color: "#2563eb" }}>
            <Boxes size={24} />
          </div>
        </div>

        <div className="role-stat-card">
          <div className="role-stat-info">
            <span>ผ่าน QC รับเข้าคลังสะสม</span>
            <strong style={{ color: "#16a34a" }}>{summary.totalPassedPieces.toLocaleString()} ชิ้น</strong>
            <small>จากที่รับตรวจ {summary.totalReceivedPieces} ชิ้น</small>
          </div>
          <div className="role-stat-icon" style={{ background: "#dcfce7", color: "#16a34a" }}>
            <ShieldCheck size={24} />
          </div>
        </div>

        <div className="role-stat-card">
          <div className="role-stat-info">
            <span>สินค้าชำรุด / เสียหาย (QC Reject)</span>
            <strong style={{ color: "#dc2626" }}>{summary.totalDamagedPieces.toLocaleString()} ชิ้น</strong>
            <small>คัดแยกไม่ให้นำเข้าสต็อกขาย</small>
          </div>
          <div className="role-stat-icon" style={{ background: "#fee2e2", color: "#dc2626" }}>
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="role-tabs">
        <button
          type="button"
          className={`role-tab-btn ${activeTab === "qc" ? "active" : ""}`}
          onClick={() => setActiveTab("qc")}
        >
          <ShieldCheck size={16} />
          การรับสินค้าเข้าคลัง ตรวจสอบ QC และบันทึกสินค้าชำรุด ({qcLogs.length} รายการ)
        </button>
        <button
          type="button"
          className={`role-tab-btn ${activeTab === "warehouses" ? "active" : ""}`}
          onClick={() => setActiveTab("warehouses")}
        >
          <Warehouse size={16} />
          ควบคุมการจัดเก็บสินค้าเข้าโกดัง (1 หมวดหมู่ : 1 โกดัง) ({warehouses.length} โกดัง)
        </button>
      </div>

      {/* ค้นหาข้อมูลตามเงื่อนไขที่ต้องการ */}
      <form className="role-filter-card" onSubmit={handleSearchSubmit}>
        <div className="role-filter-header">
          <h3>
            <Filter size={17} color="#4f46e5" />
            ค้นหาข้อมูลคลังสินค้า โกดัง และประวัติ QC ตามเงื่อนไขที่ต้องการ
          </h3>
          <button type="button" className="role-btn outline sm" onClick={handleResetFilters}>
            ล้างตัวกรองทั้งหมด
          </button>
        </div>

        <div className="role-filter-grid">
          <div className="role-field">
            <label>คำค้นหา (รหัสสินค้า / ชื่อสินค้า / เลขใบ QC / สาเหตุสินค้าชำรุด)</label>
            <input
              type="text"
              className="role-input"
              placeholder="พิมพ์ชื่อสินค้า, รหัสใบ QC, โกดัง, สาเหตุความเสียหาย..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          <div className="role-field">
            <label>หมวดหมู่สินค้า</label>
            <select
              className="role-select"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            >
              <option value="all">ทุกหมวดหมู่สินค้า</option>
              {warehouses.map((w) => (
                <option key={w.category} value={w.category}>
                  {w.category} ({w.warehouse_code})
                </option>
              ))}
            </select>
          </div>

          <div className="role-field">
            <label>โกดังจัดเก็บ (1 หมวดหมู่ : 1 โกดัง)</label>
            <select
              className="role-select"
              value={filters.warehouse_code}
              onChange={(e) => setFilters({ ...filters, warehouse_code: e.target.value })}
            >
              <option value="all">ทุกโกดัง</option>
              {warehouses.map((w) => (
                <option key={w.warehouse_code} value={w.warehouse_code}>
                  {w.warehouse_code} - {w.warehouse_name}
                </option>
              ))}
            </select>
          </div>

          <div className="role-field">
            <label>ผลการตรวจ QC</label>
            <select
              className="role-select"
              value={filters.qc_status}
              onChange={(e) => setFilters({ ...filters, qc_status: e.target.value })}
            >
              <option value="all">ทุกสถานะ QC</option>
              <option value="ผ่าน QC ทั้งหมด">✅ ผ่าน QC ทั้งหมด</option>
              <option value="พบสินค้าชำรุดบางส่วน">⚠️ พบสินค้าชำรุดบางส่วน</option>
              <option value="ไม่ผ่าน QC ทั้งล็อต">❌ ไม่ผ่าน QC ทั้งล็อต</option>
            </select>
          </div>

          <div className="role-field">
            <label>กรองเฉพาะสินค้าชำรุด</label>
            <select
              className="role-select"
              value={filters.only_damaged}
              onChange={(e) => setFilters({ ...filters, only_damaged: e.target.value })}
            >
              <option value="false">แสดงทุกรายการ</option>
              <option value="true">🔴 เฉพาะที่พบสินค้าชำรุด</option>
            </select>
          </div>

          <div className="role-field">
            <button type="submit" className="role-btn primary" style={{ width: "100%", height: "40px" }}>
              <Search size={16} />
              ค้นหาข้อมูล
            </button>
          </div>
        </div>
      </form>

      {activeTab === "qc" ? (
        /* แท็บ 1: ประวัติการรับสินค้าเข้าคลัง ตรวจสอบ QC และบันทึกสินค้าชำรุด */
        <div className="role-card">
          <div className="role-card-header">
            <h2>
              <ShieldCheck size={20} color="#4f46e5" />
              ทะเบียนรับสินค้าเข้าคลัง ตรวจสอบ QC และบันทึกสินค้าชำรุด/เสียหาย ({qcLogs.length} รายการ)
            </h2>
            <button type="button" className="role-btn warning sm" onClick={() => setIsReceiveOpen(true)}>
              <Plus size={14} />
              บันทึกตรวจรับสินค้าเข้าคลังใหม่
            </button>
          </div>

          <div className="role-table-wrap">
            {loading ? (
              <p style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                กำลังโหลดข้อมูลการตรวจรับสินค้า...
              </p>
            ) : qcLogs.length === 0 ? (
              <p style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                ไม่พบประวัติการตรวจรับสินค้าตามเงื่อนไขที่เลือก
              </p>
            ) : (
              <table className="role-table">
                <thead>
                  <tr>
                    <th>เลขที่ใบ QC / วันที่</th>
                    <th>สินค้า / หมวดหมู่</th>
                    <th>โกดังที่จัดเก็บ (1:1)</th>
                    <th style={{ textAlign: "center" }}>รับเข้าทั้งหมด</th>
                    <th style={{ textAlign: "center" }}>ผ่าน QC (เข้าสต็อก)</th>
                    <th style={{ textAlign: "center" }}>ชำรุด/เสียหาย</th>
                    <th>รายละเอียดสินค้าชำรุด / สาเหตุ</th>
                    <th>สถานะ QC</th>
                  </tr>
                </thead>
                <tbody>
                  {qcLogs.map((log) => (
                    <tr key={log.qc_id}>
                      <td>
                        <strong style={{ color: "#4f46e5" }}>{log.qc_no}</strong>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>{formatDate(log.inspected_at)}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: "#0f172a" }}>
                          [{log.product_id}] {log.product_name}
                        </div>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            background: "#f1f5f9",
                            color: "#475569",
                            padding: "2px 8px",
                            borderRadius: 6,
                          }}
                        >
                          หมวดหมู่: {log.category}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: "#312e81" }}>{log.warehouse_code}</div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>{log.warehouse_name}</div>
                      </td>
                      <td style={{ textAlign: "center", fontWeight: 700 }}>{log.received_qty} ชิ้น</td>
                      <td style={{ textAlign: "center" }}>
                        <span
                          style={{
                            fontWeight: 800,
                            color: "#15803d",
                            background: "#dcfce7",
                            padding: "4px 10px",
                            borderRadius: 8,
                          }}
                        >
                          +{log.passed_qty} ชิ้น
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {Number(log.damaged_qty) > 0 ? (
                          <span
                            style={{
                              fontWeight: 800,
                              color: "#dc2626",
                              background: "#fee2e2",
                              padding: "4px 10px",
                              borderRadius: 8,
                            }}
                          >
                            {log.damaged_qty} ชิ้น
                          </span>
                        ) : (
                          <span style={{ color: "#94a3b8" }}>0 ชิ้น</span>
                        )}
                      </td>
                      <td style={{ maxWidth: 260 }}>
                        <span
                          style={{
                            fontSize: "13px",
                            color: Number(log.damaged_qty) > 0 ? "#b91c1c" : "#64748b",
                            fontWeight: Number(log.damaged_qty) > 0 ? 600 : 400,
                          }}
                        >
                          {log.damage_reason || "-"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`status-pill ${
                            log.qc_status === "ผ่าน QC ทั้งหมด"
                              ? "completed"
                              : log.qc_status === "พบสินค้าชำรุดบางส่วน"
                              ? "pending"
                              : "damaged"
                          }`}
                        >
                          {log.qc_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        /* แท็บ 2: ควบคุมการจัดเก็บสินค้าเข้าโกดังตามเงื่อนไขหมวดหมู่สินค้า (1 หมวดหมู่ : 1 โกดัง) */
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 16,
              marginBottom: 24,
            }}
          >
            {warehouses.map((wh) => (
              <div key={wh.warehouse_id} className="role-card" style={{ marginBottom: 0 }}>
                <div
                  style={{
                    padding: "16px 20px",
                    background: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)",
                    borderBottom: "1px solid #c7d2fe",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        background: "#4f46e5",
                        color: "#fff",
                        padding: "3px 9px",
                        borderRadius: 999,
                      }}
                    >
                      {wh.warehouse_code} • 1 หมวดหมู่ : 1 โกดัง
                    </span>
                    <h3 style={{ margin: "6px 0 0", fontSize: 17, fontWeight: 800, color: "#1e1b4b" }}>
                      {wh.warehouse_name}
                    </h3>
                  </div>
                  <Warehouse size={26} color="#4f46e5" />
                </div>

                <div style={{ padding: "18px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 13 }}>
                    <span style={{ color: "#64748b" }}>หมวดหมู่สินค้าประจำโกดัง:</span>
                    <strong style={{ color: "#4338ca" }}>{wh.category}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 13 }}>
                    <span style={{ color: "#64748b" }}>โซนที่ตั้ง:</span>
                    <strong>{wh.zone_detail}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 13 }}>
                    <span style={{ color: "#64748b" }}>จำนวนรายการสินค้า (SKU):</span>
                    <strong>{wh.sku_count} รายการ</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
                    <span style={{ color: "#64748b" }}>จำนวนสต็อกในโกดัง / ความจุสูงสุด:</span>
                    <strong>
                      {wh.current_stock} / {wh.max_capacity} ชิ้น ({wh.usage_percent}%)
                    </strong>
                  </div>

                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${wh.usage_percent}%`,
                        background: wh.usage_percent > 85 ? "#dc2626" : "#4f46e5",
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ตารางรายการสินค้าแยกตามโกดังหมวดหมู่ */}
          <div className="role-card">
            <div className="role-card-header">
              <h2>
                <Layers size={20} color="#4f46e5" />
                ตารางควบคุมการจัดเก็บสินค้าแยกตามโกดังและหมวดหมู่ ({products.length} รายการ)
              </h2>
            </div>

            <div className="role-table-wrap">
              <table className="role-table">
                <thead>
                  <tr>
                    <th>รหัสสินค้า</th>
                    <th>ชื่อสินค้า</th>
                    <th>หมวดหมู่สินค้า</th>
                    <th>โกดังที่จัดเก็บ (1 หมวดหมู่ : 1 โกดัง)</th>
                    <th>โซนที่ตั้ง</th>
                    <th style={{ textAlign: "center" }}>คงเหลือในโกดัง</th>
                    <th style={{ textAlign: "center" }}>สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.product_id}>
                      <td>
                        <strong>{p.product_id}</strong>
                      </td>
                      <td style={{ fontWeight: 700 }}>{p.name}</td>
                      <td>
                        <span
                          style={{
                            background: "#e0e7ff",
                            color: "#3730a3",
                            padding: "4px 10px",
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          {p.category}
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: "#4f46e5" }}>{p.warehouse_code}</strong> — {p.warehouse_name}
                      </td>
                      <td style={{ fontSize: 13, color: "#64748b" }}>{p.zone_detail}</td>
                      <td style={{ textAlign: "center", fontWeight: 800 }}>
                        {p.stock_quantity || 0} ชิ้น
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span
                          className={`status-pill ${
                            p.status === "มีสินค้า"
                              ? "completed"
                              : p.status === "ใกล้หมด"
                              ? "pending"
                              : "damaged"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal: รับสินค้าเข้าคลัง ตรวจสอบ QC และบันทึกสินค้าชำรุด */}
      {isReceiveOpen && (
        <div className="role-modal-backdrop" onClick={() => setIsReceiveOpen(false)}>
          <div className="role-modal" onClick={(e) => e.stopPropagation()}>
            <div className="role-modal-header">
              <h3>
                <ShieldCheck size={20} color="#4f46e5" />
                รับสินค้าเข้าคลัง ตรวจสอบ QC และบันทึกสินค้าชำรุด/เสียหาย
              </h3>
              <button type="button" className="role-btn outline sm" onClick={() => setIsReceiveOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <form className="role-modal-body" onSubmit={handleReceiveQcSubmit}>
              <div className="role-field" style={{ marginBottom: 14 }}>
                <label>เลือกสินค้าที่รับเข้าคลัง *</label>
                <select
                  className="role-select"
                  value={qcForm.product_id}
                  onChange={(e) => setQcForm({ ...qcForm, product_id: e.target.value })}
                  required
                >
                  <option value="">-- เลือกสินค้า --</option>
                  {products.map((p) => (
                    <option key={p.product_id} value={p.product_id}>
                      [{p.product_id}] {p.name} — หมวดหมู่: {p.category} (คงเหลือ {p.stock_quantity} ชิ้น)
                    </option>
                  ))}
                </select>
              </div>

              {selectedProductForQc && (
                <div
                  style={{
                    background: "#eef2ff",
                    border: "1px solid #c7d2fe",
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 16,
                    fontSize: 13,
                  }}
                >
                  <div>
                    <strong>หมวดหมู่สินค้า:</strong> {selectedProductForQc.category}
                  </div>
                  <div style={{ marginTop: 4, color: "#312e81", fontWeight: 700 }}>
                    🏢 โกดังจัดเก็บตามเงื่อนไข (1 หมวดหมู่ : 1 โกดัง): {selectedProductForQc.warehouse_code} —{" "}
                    {selectedProductForQc.warehouse_name}
                  </div>
                </div>
              )}

              <div className="role-form-grid">
                <div className="role-field">
                  <label>เลขที่ใบสั่งซื้อ / ใบส่งของอ้างอิง (ถ้ามี)</label>
                  <input
                    type="text"
                    className="role-input"
                    placeholder="เช่น PR-2026-001"
                    value={qcForm.order_no}
                    onChange={(e) => setQcForm({ ...qcForm, order_no: e.target.value })}
                  />
                </div>

                <div className="role-field">
                  <label>เลือกโกดังปลายทาง (บังคับ 1 หมวดหมู่ : 1 โกดัง)</label>
                  <select
                    className="role-select"
                    value={qcForm.selected_warehouse_code}
                    onChange={(e) => setQcForm({ ...qcForm, selected_warehouse_code: e.target.value })}
                  >
                    <option value="auto">
                      ✅ จัดเข้าโกดังตามหมวดหมู่อัตโนมัติ ({selectedProductForQc?.warehouse_code || "Auto"})
                    </option>
                    {warehouses.map((w) => (
                      <option key={w.warehouse_code} value={w.warehouse_code}>
                        {w.warehouse_code} - {w.warehouse_name} [หมวด: {w.category}]
                      </option>
                    ))}
                  </select>
                </div>

                <div className="role-field">
                  <label>จำนวนสินค้าที่รับเข้าตรวจทั้งหมด (ชิ้น) *</label>
                  <input
                    type="number"
                    min="1"
                    className="role-input"
                    value={qcForm.received_qty}
                    onChange={(e) => setQcForm({ ...qcForm, received_qty: e.target.value })}
                    required
                  />
                </div>

                <div className="role-field">
                  <label>จำนวนสินค้าชำรุด / เสียหาย (ชิ้น) *</label>
                  <input
                    type="number"
                    min="0"
                    max={recvNum}
                    className="role-input"
                    value={qcForm.damaged_qty}
                    onChange={(e) => setQcForm({ ...qcForm, damaged_qty: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div
                style={{
                  background: dmgNum > 0 ? "#fff7ed" : "#f0fdf4",
                  border: dmgNum > 0 ? "1px solid #fed7aa" : "1px solid #bbf7d0",
                  padding: "12px 16px",
                  borderRadius: 12,
                  marginTop: 14,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 14,
                }}
              >
                <span>
                  จำนวนที่ผ่าน QC (นำไปบวกเพิ่มในสต็อกโกดังจริง):{" "}
                  <strong style={{ color: "#15803d", fontSize: 16 }}>+{passedNum} ชิ้น</strong>
                </span>
                <span style={{ color: "#dc2626", fontWeight: 700 }}>
                  คัดแยกชำรุด: {dmgNum} ชิ้น
                </span>
              </div>

              <div className="role-field" style={{ marginTop: 14 }}>
                <label>รายละเอียดผลการตรวจ QC / สาเหตุความเสียหาย (กรณีพบสินค้าชำรุด)</label>
                <textarea
                  rows={3}
                  className="role-textarea"
                  placeholder="ระบุสาเหตุสินค้าชำรุด เช่น กล่องบุบ แตกหักจากการขนส่ง สีซีดจาง หรือระบุว่าสภาพสมบูรณ์..."
                  value={qcForm.damage_reason}
                  onChange={(e) => setQcForm({ ...qcForm, damage_reason: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22 }}>
                <button type="button" className="role-btn outline" onClick={() => setIsReceiveOpen(false)}>
                  ยกเลิก
                </button>
                <button type="submit" className="role-btn primary" disabled={submitting}>
                  <CheckCircle2 size={16} />
                  {submitting ? "กำลังบันทึก..." : "ยืนยันผลตรวจ QC และนำเข้าโกดัง"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: สร้างโกดังประจำหมวดหมู่ใหม่ (1 หมวดหมู่ : 1 โกดัง) */}
      {isAddWhOpen && (
        <div className="role-modal-backdrop" onClick={() => setIsAddWhOpen(false)}>
          <div className="role-modal" onClick={(e) => e.stopPropagation()}>
            <div className="role-modal-header">
              <h3>
                <Warehouse size={20} color="#4f46e5" />
                เพิ่มโกดังประจำหมวดหมู่ใหม่ (เงื่อนไข 1 หมวดหมู่ : 1 โกดัง)
              </h3>
              <button type="button" className="role-btn outline sm" onClick={() => setIsAddWhOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <form className="role-modal-body" onSubmit={handleAddWarehouseSubmit}>
              <div className="role-form-grid">
                <div className="role-field">
                  <label>หมวดหมู่สินค้าประจำโกดังนี้ (ห้ามซ้ำโกดังอื่น) *</label>
                  <input
                    type="text"
                    className="role-input"
                    placeholder="เช่น อุปกรณ์ศิลปะ, เครื่องใช้ไฟฟ้า"
                    value={whForm.category}
                    onChange={(e) => setWhForm({ ...whForm, category: e.target.value })}
                    required
                  />
                </div>

                <div className="role-field">
                  <label>รหัสโกดัง (เว้นว่างให้สร้างอัตโนมัติได้)</label>
                  <input
                    type="text"
                    className="role-input"
                    placeholder="เช่น WH-06"
                    value={whForm.warehouse_code}
                    onChange={(e) => setWhForm({ ...whForm, warehouse_code: e.target.value })}
                  />
                </div>

                <div className="role-field">
                  <label>ชื่อโกดัง</label>
                  <input
                    type="text"
                    className="role-input"
                    placeholder="เช่น โกดัง F6 (อุปกรณ์ศิลปะ)"
                    value={whForm.warehouse_name}
                    onChange={(e) => setWhForm({ ...whForm, warehouse_name: e.target.value })}
                  />
                </div>

                <div className="role-field">
                  <label>ความจุสูงสุด (ชิ้น)</label>
                  <input
                    type="number"
                    min="50"
                    className="role-input"
                    value={whForm.max_capacity}
                    onChange={(e) => setWhForm({ ...whForm, max_capacity: e.target.value })}
                  />
                </div>
              </div>

              <div className="role-field" style={{ marginTop: 14 }}>
                <label>รายละเอียดโซนที่ตั้ง</label>
                <input
                  type="text"
                  className="role-input"
                  placeholder="เช่น อาคารคลังสินค้า โซน B-2"
                  value={whForm.zone_detail}
                  onChange={(e) => setWhForm({ ...whForm, zone_detail: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22 }}>
                <button type="button" className="role-btn outline" onClick={() => setIsAddWhOpen(false)}>
                  ยกเลิก
                </button>
                <button type="submit" className="role-btn primary" disabled={submitting}>
                  <CheckCircle2 size={16} />
                  {submitting ? "กำลังสร้าง..." : "บันทึกโกดังประจำหมวดหมู่"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
