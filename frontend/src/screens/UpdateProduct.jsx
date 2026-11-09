// src/screens/UpdateProduct.jsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Edit3, Save, X } from "lucide-react";
import { getProductById, updateProduct } from "../api/productApi";
import "./UpdateProduct.css";

export default function UpdateProduct() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    product_id: "",
    name: "",
    category: "",
    price: "",
    status: "มีสินค้า",
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadProductData(id);
    }
  }, [id]);

  async function loadProductData(productId) {
    setIsLoading(true);
    const data = await getProductById(productId);
    if (data && !data.error) {
      setFormData({
        product_id: data.product_id || productId,
        name: data.name || "",
        category: data.category || "",
        price: data.price !== undefined ? data.price : "",
        status: data.status === "active" ? "มีสินค้า" : data.status === "inactive" ? "หมด" : (data.status || "มีสินค้า"),
      });
    } else {
      alert("ไม่พบข้อมูลสินค้าที่ต้องการแก้ไข");
      navigate("/products");
    }
    setIsLoading(false);
  }

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!id) return;

    const res = await updateProduct(id, formData);
    if (res && !res.error) {
      alert("แก้ไขข้อมูลสินค้าสำเร็จ!");
      navigate("/products");
    } else {
      alert(`เกิดข้อผิดพลาดในการแก้ไข: ${res?.error || "ไม่สามารถแก้ไขข้อมูลได้"}`);
    }
  }

  if (isLoading) {
    return (
      <div className="updateProductPage">
        <div className="updateProductCard" style={{ textAlign: "center", padding: "48px" }}>
          <p style={{ color: "#64748b" }}>กำลังโหลดข้อมูลสินค้า...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="updateProductPage">
      <div className="updateProductCard">
        <h2>
          <Edit3 size={22} color="#2563eb" />
          แก้ไขข้อมูลสินค้า
        </h2>

        <form onSubmit={handleSubmit} className="updateProductForm">
          <label>รหัสสินค้า (ไม่สามารถเปลี่ยนได้)</label>
          <input
            type="text"
            name="product_id"
            value={formData.product_id}
            disabled
          />

          <label>ชื่อสินค้า *</label>
          <input
            type="text"
            name="name"
            placeholder="ชื่อสินค้า"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <label>หมวดหมู่ *</label>
          <input
            type="text"
            name="category"
            placeholder="หมวดหมู่"
            value={formData.category}
            onChange={handleChange}
            required
          />

          <label>ราคา (บาท) *</label>
          <input
            type="number"
            step="0.01"
            name="price"
            placeholder="ราคา"
            value={formData.price}
            onChange={handleChange}
            required
          />

          <label>สถานะ *</label>
          <select name="status" value={formData.status} onChange={handleChange}>
            <option value="มีสินค้า">มีสินค้า</option>
            <option value="หมด">หมด</option>
          </select>

          <div className="updateProductButtonGroup">
            <button type="submit" className="btnSaveUpdateProduct">
              <Save size={16} />
              บันทึกการแก้ไข
            </button>
            <button
              type="button"
              className="btnCancelUpdateProduct"
              onClick={() => navigate("/products")}
            >
              <X size={16} />
              ยกเลิก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
