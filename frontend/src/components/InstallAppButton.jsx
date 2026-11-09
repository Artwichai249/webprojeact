// src/components/InstallAppButton.jsx
import { useState, useEffect } from "react";
import { Smartphone, Download, X, CheckCircle2 } from "lucide-react";

export default function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  useEffect(() => {
    // ตรวจสอบว่าเปิดในโหมดแอปอยู่แล้วหรือไม่ (Standalone)
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    ) {
      setIsInstalled(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      console.log("PWA App was installed successfully!");
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } else {
      // หากเบราว์เซอร์ยังไม่เปิด auto-prompt (เช่น Safari บน iOS หรือ Chrome Desktop) ให้แสดงคำแนะนำ
      setShowGuideModal(true);
    }
  };

  if (isInstalled) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontSize: 11,
          fontWeight: 700,
          background: "#ecfdf5",
          color: "#059669",
          padding: "3px 8px",
          borderRadius: 999,
          border: "1px solid #a7f3d0",
        }}
        title="กำลังใช้งานในโหมดแอปพลิเคชัน"
      >
        <CheckCircle2 size={12} />
        App Mode
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 12px",
          borderRadius: 8,
          border: "1px solid #3b82f6",
          background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
          color: "#ffffff",
          fontSize: 12,
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: "0 2px 6px rgba(37, 99, 235, 0.25)",
          transition: "all 0.15s ease",
        }}
        title="ติดตั้งแอปพลิเคชันลงในมือถือหรือคอมพิวเตอร์ของคุณ"
      >
        <Smartphone size={14} />
        <span>ติดตั้งแอป</span>
      </button>

      {/* Modal คำแนะนำการติดตั้งบนมือถือ */}
      {showGuideModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            padding: 16,
          }}
          onClick={() => setShowGuideModal(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 16,
              padding: "24px",
              maxWidth: "460px",
              width: "100%",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Smartphone size={22} color="#2563eb" />
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#1e293b" }}>
                  วิธีติดตั้งแอปพลิเคชันลงในมือถือ
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ fontSize: 13.5, color: "#475569", lineHeight: 1.6 }}>
              <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: 10, border: "1px solid #e2e8f0", marginBottom: 14 }}>
                <strong style={{ color: "#0f172a", display: "block", marginBottom: 4 }}>
                  📱 สำหรับ Android (Google Chrome):
                </strong>
                <span>1. กดปุ่มเมนู <strong>จุดสามจุด (⋮)</strong> มุมบนขวาของเบราว์เซอร์</span>
                <br />
                <span>2. เลือก <strong>"ติดตั้งแอป" (Install app)</strong> หรือ <strong>"เพิ่มลงในหน้าจอหลัก"</strong></span>
              </div>

              <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: 10, border: "1px solid #e2e8f0", marginBottom: 14 }}>
                <strong style={{ color: "#0f172a", display: "block", marginBottom: 4 }}>
                  🍎 สำหรับ iPhone / iPad (Safari):
                </strong>
                <span>1. กดปุ่ม <strong>แชร์ (Share Icon)</strong> ด้านล่างจอ</span>
                <br />
                <span>2. เลื่อนลงมาเลือก <strong>"เพิ่มไปยังหน้าจอหลัก" (Add to Home Screen)</strong></span>
              </div>

              <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                <strong style={{ color: "#0f172a", display: "block", marginBottom: 4 }}>
                  💻 สำหรับคอมพิวเตอร์ (Chrome / Edge):
                </strong>
                <span>กดไอคอนรูป <strong>คอมพิวเตอร์พร้อมลูกศรลง (Install)</strong> ที่อยู่ขวาสุดของช่อง URL ด้านบน</span>
              </div>
            </div>

            <div style={{ marginTop: 20, textAlign: "right" }}>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                style={{
                  padding: "9px 20px",
                  borderRadius: 8,
                  border: "none",
                  background: "#2563eb",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                เข้าใจแล้ว
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
