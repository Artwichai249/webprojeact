// src/screens/ProductList.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Search, Plus, PackagePlus, Pencil, Trash2 } from "lucide-react";
import { getAllProducts, deleteProduct } from "../api/productApi";
import "./ProductList.css";

export default function ProductList() {
  // 1 state ที่ใช้ในหน้านี้
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  // 2 เปิดหน้า -> โหลดข้อมูลครั้งเดียว
  useEffect(() => {
    loadProducts();
  }, []);

  // 3 ดึงข้อมูลสินค้าจาก Backend
  async function loadProducts() {
    setIsLoading(true);
    const data = await getAllProducts();
    if (Array.isArray(data)) {
      setProducts(data);
    }
    setIsLoading(false);
  }

  // 4 กรองรายชื่อสินค้าตามคำค้นหา (ค้นหาชื่อสินค้า หรือหมวดหมู่)
  const filteredProducts = products.filter((product) => {
    const keyword = searchText.toLowerCase();
    const nameMatch = (product.name || "").toLowerCase().includes(keyword);
    const categoryMatch = (product.category || "").toLowerCase().includes(keyword);
    return nameMatch || categoryMatch;
  });

  // 5 จัดการการลบสินค้า
  async function handleDelete(productId, productName) {
    if (window.confirm(`คุณต้องการลบสินค้า "${productName}" (รหัส: ${productId}) ใช่หรือไม่?`)) {
      const res = await deleteProduct(productId);
      if (res && !res.error) {
        setProducts(products.filter((p) => p.product_id !== productId));
        alert("ลบสินค้าสำเร็จ!");
      } else {
        alert(`เกิดข้อผิดพลาดในการลบ: ${res?.error || "ไม่สามารถลบสินค้าได้"}`);
      }
    }
  }

  return (
    <div className="productListContainer">
      {/* ส่วนหัว: หัวข้อ + ช่องค้นหา + ปุ่มเพิ่มสินค้า */}
      <div className="productHeaderCard">
        <div className="productHeaderTitle">
          <ShoppingBag size={28} className="productHeaderIcon" />
          <h2>รายการสินค้า</h2>
        </div>

        <div className="productHeaderActions">
          <div className="productSearchBox">
            <Search size={18} className="productSearchIcon" />
            <input
              type="text"
              placeholder="ค้นหาชื่อสินค้า หรือหมวดหมู่..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>

          <Link to="/products/order" className="productAddButton" title="เสนอการสั่งซื้อสินค้า (Purchase Requisition)">
            <PackagePlus size={16} />
            เสนอการสั่งซื้อ
          </Link>
        </div>
      </div>

      {/* ตารางแสดงรายการสินค้าตามสไลด์หน้า 25 */}
      <div className="productTableWrapper">
        {isLoading ? (
          <p className="productLoadingText">กำลังโหลดข้อมูลสินค้า...</p>
        ) : filteredProducts.length === 0 ? (
          <p className="productEmptyText">ไม่พบข้อมูลสินค้า</p>
        ) : (
          <table className="productTable">
            <thead>
              <tr>
                <th style={{ width: "70px", textAlign: "center" }}>ลำดับ</th>
                <th>รหัสสินค้า</th>
                <th>ชื่อสินค้า</th>
                <th>หมวดหมู่</th>
                <th>ราคา</th>
                <th style={{ textAlign: "center" }}>คงเหลือ (สต็อก)</th>
                <th style={{ textAlign: "center" }}>สถานะ</th>
                <th style={{ textAlign: "center", width: "160px" }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product, index) => {
                const stockQty = product.stock_quantity !== undefined && product.stock_quantity !== null
                  ? Number(product.stock_quantity)
                  : 0;

                // ตรวจสอบสถานะสินค้าจากจำนวนสต็อก:
                // 1. ถ้าสต็อก <= 0 -> "หมด" (สีแดง)
                // 2. ถ้าสต็อก < 10 (1-9 ชิ้น) -> "ใกล้หมด" (สีส้ม)
                // 3. ถ้าสต็อก >= 10 -> "มีสินค้า" (สีเขียว)
                let statusText = "มีสินค้า";
                let statusClass = "inStock";

                if (stockQty <= 0) {
                  statusText = "หมด";
                  statusClass = "outOfStock";
                } else if (stockQty < 10) {
                  statusText = "ใกล้หมด";
                  statusClass = "lowStock";
                } else {
                  statusText = "มีสินค้า";
                  statusClass = "inStock";
                }

                return (
                  <tr key={product.product_id || index}>
                    <td style={{ textAlign: "center" }}>{index + 1}</td>
                    <td style={{ fontWeight: 600 }}>{product.product_id}</td>
                    <td>{product.name}</td>
                    <td>{product.category}</td>
                    <td>{parseFloat(product.price).toLocaleString()} บาท</td>
                    <td style={{ textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "3px 10px",
                          borderRadius: "6px",
                          fontWeight: 700,
                          fontSize: "13px",
                          background: stockQty <= 0 ? "#fee2e2" : stockQty < 10 ? "#fef3c7" : "#f1f5f9",
                          color: stockQty <= 0 ? "#dc2626" : stockQty < 10 ? "#d97706" : "#0f172a",
                        }}
                      >
                        {stockQty} ชิ้น
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className={`productStatusBadge ${statusClass}`}>
                        {statusText}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div className="productActionGroup">
                        <Link
                          to={`/products/update/${product.product_id}`}
                          className="btnEditProduct"
                          title="แก้ไขข้อมูลสินค้า"
                        >
                          <Pencil size={14} />
                          แก้ไข
                        </Link>
                        <button
                          type="button"
                          className="btnDeleteProduct"
                          onClick={() => handleDelete(product.product_id, product.name)}
                          title="ลบสินค้านี้"
                        >
                          <Trash2 size={14} />
                          ลบ
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
  );
}
