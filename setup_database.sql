-- สร้างฐานข้อมูล member_system (ถ้ายังไม่มี)
CREATE DATABASE IF NOT EXISTS `member_system` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `member_system`;

-- สร้างตาราง nisit (ตามสไลด์หน้า 5 และหน้า 6)
CREATE TABLE IF NOT EXISTS `nisit` (
  `nisit_id` VARCHAR(20) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `username` VARCHAR(50) NOT NULL,
  `password` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `status` VARCHAR(20) DEFAULT 'ใช้งาน'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ใส่ข้อมูลทดสอบ (ตามสไลด์หน้า 7 และหน้า 42)
INSERT INTO `nisit` (`nisit_id`, `name`, `username`, `password`, `phone`, `status`) VALUES
('0123456789', 'วันชัย ชิดชอบ', 'u101', '1234', '0123456789', 'ปกติ'),
('0823456789', 'ศิริพร พัฒนา', 'siriporn', '1234', '0823456789', 'ใช้งาน'),
('0834567890', 'อนุชา ดีมาก', 'anucha', '1234', '0834567890', 'ไม่ใช้งาน'),
('0845678901', 'กมลวรรณ รักเรียน', 'kamonwan', '1234', '0845678901', 'ใช้งาน')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- สร้างตาราง product (ตามแบบฝึกหัด React09.pdf หน้า 25-26)
CREATE TABLE IF NOT EXISTS `product` (
  `product_id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `status` VARCHAR(50) DEFAULT 'มีสินค้า',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ข้อมูลตัวอย่างสินค้าตามสไลด์หน้า 25
INSERT INTO `product` (`product_id`, `name`, `category`, `price`, `status`) VALUES
('P001', 'ปากกาลูกลื่น', 'เครื่องเขียน', 15.00, 'มีสินค้า'),
('P002', 'สมุดโน้ต A5', 'เครื่องเขียน', 35.00, 'หมด'),
('P003', 'แก้วน้ำสแตนเลส', 'ของใช้', 250.00, 'มีสินค้า'),
('P004', 'ร่มพับ', 'ของใช้', 189.00, 'มีสินค้า')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

