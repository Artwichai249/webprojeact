// src/modules/roles/screens/ManagerTasks.jsx
import { useState, useEffect } from "react";
import {
  ClipboardList,
  Briefcase,
  Search,
  Filter,
  Plus,
  RefreshCw,
  CheckCircle2,
  Clock,
  TrendingUp,
  UserCheck,
  Calendar,
  Edit3,
  Trash2,
  X,
} from "lucide-react";
import {
  getManagerTasks,
  createManagerTask,
  updateManagerTask,
  deleteManagerTask,
} from "../../../api/roleSystemApi";
import { useAuth } from "../../auth/AuthContext";
import "./RoleSystem.css";

const STAFF_OPTIONS = [
  { username: "admin2", name: "พนักงานขาย (admin2)", role: "พนักงานขาย" },
  { username: "admin3", name: "พนักงานสต็อก/คลังสินค้า (admin3)", role: "พนักงานสต็อก/คลังสินค้า" },
  { username: "sales_team", name: "ทีมพนักงานขายหน้าร้าน", role: "พนักงานขาย" },
  { username: "stock_team", name: "ทีมเจ้าหน้าที่คลังสินค้า & QC", role: "พนักงานสต็อก/คลังสินค้า" },
];

export default function ManagerTasks() {
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    delayed: 0,
    avgProgress: 0,
  });

  // เงื่อนไขการค้นหา (3.2 ค้นหาข้อมูลตามเงื่อนไขที่ต้องการ)
  const [filters, setFilters] = useState({
    search: "",
    staff_role: "all",
    status: "all",
    priority: "all",
  });

  // Modal มอบหมายงานใหม่ / แก้ไขงาน
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assigned_to: "admin2",
    staff_name: "พนักงานขาย (admin2)",
    staff_role: "พนักงานขาย",
    priority: "สูง",
    progress: 0,
    status: "รอดำเนินการ",
    due_date: new Date().toISOString().slice(0, 10),
    remark: "",
  });

  useEffect(() => {
    loadTasks();
  }, [filters.staff_role, filters.status, filters.priority]);

  async function loadTasks(customFilters = filters) {
    setLoading(true);
    const res = await getManagerTasks(customFilters, token);
    if (res && !res.error) {
      setTasks(res.tasks || []);
      if (res.summary) setSummary(res.summary);
    }
    setLoading(false);
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadTasks(filters);
  };

  const handleResetFilters = () => {
    const reset = {
      search: "",
      staff_role: "all",
      status: "all",
      priority: "all",
    };
    setFilters(reset);
    loadTasks(reset);
  };

  const openCreateModal = () => {
    setEditingTask(null);
    setFormData({
      title: "",
      description: "",
      assigned_to: "admin2",
      staff_name: "พนักงานขาย (admin2)",
      staff_role: "พนักงานขาย",
      priority: "สูง",
      progress: 0,
      status: "รอดำเนินการ",
      due_date: new Date().toISOString().slice(0, 10),
      remark: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title || "",
      description: task.description || "",
      assigned_to: task.assigned_to || "admin2",
      staff_name: task.staff_name || "พนักงานขาย (admin2)",
      staff_role: task.staff_role || "พนักงานขาย",
      priority: task.priority || "ปานกลาง",
      progress: task.progress || 0,
      status: task.status || "รอดำเนินการ",
      due_date: task.due_date ? String(task.due_date).slice(0, 10) : new Date().toISOString().slice(0, 10),
      remark: task.remark || "",
    });
    setIsModalOpen(true);
  };

  const handleSelectStaff = (username) => {
    const found = STAFF_OPTIONS.find((s) => s.username === username);
    if (found) {
      setFormData((prev) => ({
        ...prev,
        assigned_to: found.username,
        staff_name: found.name,
        staff_role: found.role,
      }));
    } else {
      setFormData((prev) => ({ ...prev, assigned_to: username }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert("กรุณาระบุหัวข้องานที่มอบหมาย");
      return;
    }
    setSubmitting(true);
    let res;
    if (editingTask) {
      res = await updateManagerTask(editingTask.task_id, formData, token);
    } else {
      res = await createManagerTask(formData, token);
    }
    setSubmitting(false);

    if (res && !res.error) {
      alert(editingTask ? "อัปเดตงานและความก้าวหน้าสำเร็จ!" : "มอบหมายงานให้พนักงานสำเร็จ!");
      setIsModalOpen(false);
      loadTasks();
    } else {
      alert(res?.error || "เกิดข้อผิดพลาด");
    }
  };

  // ปรับ % ความก้าวหน้าแบบรวดเร็วจากตาราง
  const handleQuickProgress = async (task, newProgress) => {
    const status =
      newProgress >= 100 ? "เสร็จสิ้น" : newProgress > 0 ? "กำลังดำเนินการ" : "รอดำเนินการ";
    const res = await updateManagerTask(
      task.task_id,
      { progress: newProgress, status },
      token
    );
    if (res && !res.error) {
      loadTasks();
    } else {
      alert(res?.error || "ไม่สามารถอัปเดตความก้าวหน้าได้");
    }
  };

  const handleDelete = async (task) => {
    if (!window.confirm(`ต้องการลบงาน "${task.title}" (${task.task_no}) ใช่หรือไม่?`)) return;
    const res = await deleteManagerTask(task.task_id, token);
    if (res && !res.error) {
      loadTasks();
    } else {
      alert(res?.error || "ลบงานไม่สำเร็จ");
    }
  };

  const getStatusClass = (status) => {
    if (status === "เสร็จสิ้น") return "completed";
    if (status === "กำลังดำเนินการ") return "in-progress";
    if (status === "ล่าช้า") return "rejected";
    return "pending";
  };

  const getProgressColor = (progress) => {
    if (progress >= 100) return "#16a34a";
    if (progress >= 50) return "#2563eb";
    if (progress > 0) return "#d97706";
    return "#94a3b8";
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

  return (
    <div className="role-page">
      {/* Hero Banner */}
      <div className="role-hero manager-theme">
        <div className="role-hero-left">
          <div className="role-hero-icon">
            <Briefcase size={28} />
          </div>
          <div>
            <div className="role-hero-title">
              <h1>ระบบผู้จัดการร้าน (Store Manager)</h1>
              <span className="role-badge-tag">ผู้จัดการ</span>
            </div>
            <p className="role-hero-subtitle">
              มอบหมายงานและติดตามความก้าวหน้าการทำงานของพนักงาน พร้อมค้นหาข้อมูลตามเงื่อนไขที่ต้องการ
            </p>
          </div>
        </div>

        <div className="role-hero-actions">
          <button type="button" className="role-btn outline" onClick={() => loadTasks()}>
            <RefreshCw size={16} />
            รีเฟรชข้อมูล
          </button>
          <button
            type="button"
            className="role-btn primary"
            style={{ background: "#0f172a" }}
            onClick={openCreateModal}
          >
            <Plus size={16} />
            มอบหมายงานใหม่ให้พนักงาน
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="role-stats-grid">
        <div className="role-stat-card">
          <div className="role-stat-info">
            <span>งานที่มอบหมายทั้งหมด</span>
            <strong>{summary.total}</strong>
            <small>งานของพนักงานทุกแผนก</small>
          </div>
          <div className="role-stat-icon" style={{ background: "#dbeafe", color: "#2563eb" }}>
            <ClipboardList size={24} />
          </div>
        </div>

        <div className="role-stat-card">
          <div className="role-stat-info">
            <span>กำลังดำเนินการ</span>
            <strong style={{ color: "#2563eb" }}>{summary.inProgress}</strong>
            <small>รอดำเนินการ {summary.pending} งาน</small>
          </div>
          <div className="role-stat-icon" style={{ background: "#fef3c7", color: "#d97706" }}>
            <Clock size={24} />
          </div>
        </div>

        <div className="role-stat-card">
          <div className="role-stat-info">
            <span>ดำเนินการเสร็จสิ้น</span>
            <strong style={{ color: "#16a34a" }}>{summary.completed}</strong>
            <small>ผ่านเกณฑ์เป้าหมาย</small>
          </div>
          <div className="role-stat-icon" style={{ background: "#dcfce7", color: "#16a34a" }}>
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="role-stat-card">
          <div className="role-stat-info">
            <span>ความก้าวหน้าเฉลี่ยรวม</span>
            <strong style={{ color: "#1d4ed8" }}>{summary.avgProgress}%</strong>
            <small>ของงานทั้งหมดในระบบ</small>
          </div>
          <div className="role-stat-icon" style={{ background: "#e0e7ff", color: "#4f46e5" }}>
            <TrendingUp size={24} />
          </div>
        </div>
      </div>

      {/* ค้นหาข้อมูลตามเงื่อนไขที่ต้องการ */}
      <form className="role-filter-card" onSubmit={handleSearchSubmit}>
        <div className="role-filter-header">
          <h3>
            <Filter size={17} color="#2563eb" />
            ค้นหาและกรองงานของพนักงานตามเงื่อนไขที่ต้องการ
          </h3>
          <button type="button" className="role-btn outline sm" onClick={handleResetFilters}>
            ล้างตัวกรองทั้งหมด
          </button>
        </div>

        <div className="role-filter-grid">
          <div className="role-field">
            <label>คำค้นหา (รหัสงาน / ชื่องาน / ชื่อพนักงาน / หมายเหตุ)</label>
            <input
              type="text"
              className="role-input"
              placeholder="พิมพ์ชื่องาน, ชื่อพนักงาน, รายละเอียดงาน..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          <div className="role-field">
            <label>แผนก / ตำแหน่งพนักงาน</label>
            <select
              className="role-select"
              value={filters.staff_role}
              onChange={(e) => setFilters({ ...filters, staff_role: e.target.value })}
            >
              <option value="all">ทุกตำแหน่ง</option>
              <option value="พนักงานขาย">พนักงานขาย (3.3)</option>
              <option value="พนักงานสต็อก/คลังสินค้า">พนักงานสต็อก/คลังสินค้า (3.4)</option>
            </select>
          </div>

          <div className="role-field">
            <label>สถานะความก้าวหน้า</label>
            <select
              className="role-select"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="all">ทุกสถานะ</option>
              <option value="รอดำเนินการ">⏳ รอดำเนินการ (0%)</option>
              <option value="กำลังดำเนินการ">🔄 กำลังดำเนินการ (1-99%)</option>
              <option value="เสร็จสิ้น">✅ เสร็จสิ้น (100%)</option>
              <option value="ล่าช้า">⚠️ ล่าช้า</option>
            </select>
          </div>

          <div className="role-field">
            <label>ระดับความสำคัญ</label>
            <select
              className="role-select"
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            >
              <option value="all">ทุกระดับความสำคัญ</option>
              <option value="สูง">🔴 สูง (ด่วน)</option>
              <option value="ปานกลาง">🟡 ปานกลาง</option>
              <option value="ต่ำ">🟢 ต่ำ</option>
            </select>
          </div>

          <div className="role-field">
            <button type="submit" className="role-btn primary" style={{ width: "100%", height: "40px" }}>
              <Search size={16} />
              ค้นหางาน
            </button>
          </div>
        </div>
      </form>

      {/* ตารางติดตามความก้าวหน้าการทำงานของพนักงาน */}
      <div className="role-card">
        <div className="role-card-header">
          <h2>
            <ClipboardList size={20} color="#2563eb" />
            ตารางมอบหมายงานและติดตามความก้าวหน้าของพนักงาน ({tasks.length} งาน)
          </h2>
        </div>

        <div className="role-table-wrap">
          {loading ? (
            <p style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
              กำลังโหลดข้อมูลงานของพนักงาน...
            </p>
          ) : tasks.length === 0 ? (
            <p style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
              ไม่พบรายการงานตามเงื่อนไขที่ค้นหา
            </p>
          ) : (
            <table className="role-table">
              <thead>
                <tr>
                  <th>รหัสงาน</th>
                  <th>รายละเอียดงานที่มอบหมาย</th>
                  <th>พนักงานผู้รับผิดชอบ</th>
                  <th>ความสำคัญ / กำหนดส่ง</th>
                  <th style={{ minWidth: 220 }}>ความก้าวหน้าการทำงาน (Progress)</th>
                  <th>สถานะ</th>
                  <th style={{ textAlign: "center" }}>จัดการ / ปรับความก้าวหน้า</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t.task_id}>
                    <td>
                      <strong style={{ color: "#2563eb", fontSize: "13px" }}>{t.task_no}</strong>
                    </td>
                    <td style={{ maxWidth: 320 }}>
                      <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{t.title}</div>
                      {t.description && (
                        <div style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.4 }}>{t.description}</div>
                      )}
                      {t.remark && (
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#0f766e",
                            background: "#f0fdfa",
                            padding: "4px 8px",
                            borderRadius: 6,
                            marginTop: 6,
                            display: "inline-block",
                          }}
                        >
                          💬 รายงานผล: {t.remark}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700 }}>
                        <UserCheck size={15} color="#2563eb" />
                        {t.staff_name}
                      </div>
                      <span
                        style={{
                          display: "inline-block",
                          marginTop: 4,
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: 999,
                          background: t.staff_role === "พนักงานขาย" ? "#dcfce7" : "#e0e7ff",
                          color: t.staff_role === "พนักงานขาย" ? "#15803d" : "#4338ca",
                        }}
                      >
                        {t.staff_role}
                      </span>
                    </td>
                    <td>
                      <div>
                        <span
                          className="status-pill"
                          style={{
                            background:
                              t.priority === "สูง" ? "#fee2e2" : t.priority === "ปานกลาง" ? "#fef3c7" : "#f1f5f9",
                            color:
                              t.priority === "สูง" ? "#dc2626" : t.priority === "ปานกลาง" ? "#d97706" : "#475569",
                          }}
                        >
                          ความสำคัญ: {t.priority}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: "12px",
                          color: "#64748b",
                          marginTop: 6,
                        }}
                      >
                        <Calendar size={13} />
                        ส่ง: {formatDate(t.due_date)}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: 5 }}>
                        <span style={{ fontWeight: 700, color: getProgressColor(t.progress) }}>
                          ความก้าวหน้า {t.progress}%
                        </span>
                      </div>
                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${t.progress || 0}%`,
                            background: getProgressColor(t.progress),
                          }}
                        />
                      </div>
                      <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
                        {[0, 25, 50, 75, 100].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => handleQuickProgress(t, pct)}
                            style={{
                              padding: "2px 7px",
                              fontSize: "11px",
                              fontWeight: 700,
                              borderRadius: 6,
                              border: t.progress === pct ? "1px solid #2563eb" : "1px solid #cbd5e1",
                              background: t.progress === pct ? "#dbeafe" : "#ffffff",
                              color: t.progress === pct ? "#1d4ed8" : "#475569",
                              cursor: "pointer",
                            }}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className={`status-pill ${getStatusClass(t.status)}`}>{t.status}</span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                        <button
                          type="button"
                          className="role-btn outline sm"
                          onClick={() => openEditModal(t)}
                          title="แก้ไข / อัปเดตความก้าวหน้า"
                        >
                          <Edit3 size={14} />
                          อัปเดต
                        </button>
                        <button
                          type="button"
                          className="role-btn danger sm"
                          onClick={() => handleDelete(t)}
                          title="ลบงาน"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal มอบหมายงาน / อัปเดตความก้าวหน้า */}
      {isModalOpen && (
        <div className="role-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="role-modal" onClick={(e) => e.stopPropagation()}>
            <div className="role-modal-header">
              <h3>
                <Briefcase size={20} color="#2563eb" />
                {editingTask ? `อัปเดตความก้าวหน้างาน (${editingTask.task_no})` : "มอบหมายงานใหม่ให้พนักงาน"}
              </h3>
              <button type="button" className="role-btn outline sm" onClick={() => setIsModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <form className="role-modal-body" onSubmit={handleSubmit}>
              <div className="role-field" style={{ marginBottom: 14 }}>
                <label>หัวข้องานที่มอบหมาย *</label>
                <input
                  type="text"
                  className="role-input"
                  placeholder="เช่น ตรวจรับสินค้าเข้าคลังและคัดแยกสินค้าชำรุดประจำสัปดาห์"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="role-field" style={{ marginBottom: 14 }}>
                <label>รายละเอียดและคำสั่งงาน</label>
                <textarea
                  rows={2}
                  className="role-textarea"
                  placeholder="ระบุรายละเอียดขั้นตอนการทำงานที่ต้องการให้พนักงานปฏิบัติ..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="role-form-grid">
                <div className="role-field">
                  <label>เลือกพนักงานผู้รับผิดชอบ *</label>
                  <select
                    className="role-select"
                    value={formData.assigned_to}
                    onChange={(e) => handleSelectStaff(e.target.value)}
                  >
                    {STAFF_OPTIONS.map((s) => (
                      <option key={s.username} value={s.username}>
                        {s.name} — [{s.role}]
                      </option>
                    ))}
                  </select>
                </div>

                <div className="role-field">
                  <label>แผนก / ตำแหน่ง</label>
                  <select
                    className="role-select"
                    value={formData.staff_role}
                    onChange={(e) => setFormData({ ...formData, staff_role: e.target.value })}
                  >
                    <option value="พนักงานขาย">พนักงานขาย</option>
                    <option value="พนักงานสต็อก/คลังสินค้า">พนักงานสต็อก/คลังสินค้า</option>
                  </select>
                </div>

                <div className="role-field">
                  <label>ระดับความสำคัญ</label>
                  <select
                    className="role-select"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="สูง">สูง (ด่วน)</option>
                    <option value="ปานกลาง">ปานกลาง</option>
                    <option value="ต่ำ">ต่ำ</option>
                  </select>
                </div>

                <div className="role-field">
                  <label>กำหนดส่งงาน (Due Date)</label>
                  <input
                    type="date"
                    className="role-input"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
              </div>

              {editingTask && (
                <div className="role-form-grid" style={{ marginTop: 14 }}>
                  <div className="role-field">
                    <label>ความก้าวหน้าการทำงาน ({formData.progress}%)</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={formData.progress}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setFormData({
                          ...formData,
                          progress: val,
                          status: val >= 100 ? "เสร็จสิ้น" : val > 0 ? "กำลังดำเนินการ" : "รอดำเนินการ",
                        });
                      }}
                      style={{ width: "100%", marginTop: 8 }}
                    />
                  </div>

                  <div className="role-field">
                    <label>สถานะงาน</label>
                    <select
                      className="role-select"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="รอดำเนินการ">รอดำเนินการ</option>
                      <option value="กำลังดำเนินการ">กำลังดำเนินการ</option>
                      <option value="เสร็จสิ้น">เสร็จสิ้น</option>
                      <option value="ล่าช้า">ล่าช้า</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="role-field" style={{ marginTop: 14 }}>
                <label>หมายเหตุ / รายงานความก้าวหน้า</label>
                <input
                  type="text"
                  className="role-input"
                  placeholder="บันทึกผลการปฏิบัติงานหรือข้อเสนอแนะ..."
                  value={formData.remark}
                  onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22 }}>
                <button type="button" className="role-btn outline" onClick={() => setIsModalOpen(false)}>
                  ยกเลิก
                </button>
                <button type="submit" className="role-btn primary" disabled={submitting}>
                  <CheckCircle2 size={16} />
                  {submitting ? "กำลังบันทึก..." : editingTask ? "บันทึกการอัปเดต" : "ยืนยันมอบหมายงาน"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
