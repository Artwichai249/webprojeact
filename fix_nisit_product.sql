USE test;

CREATE TABLE IF NOT EXISTS `nisit` (
  `nisit_id` varchar(20) NOT NULL PRIMARY KEY,
  `name` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL UNIQUE,
  `password` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'ใช้งาน'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `nisit` (`nisit_id`, `name`, `username`, `password`, `phone`, `status`) VALUES
('1516724374', 'พนักงานขาย', 'admin2', 'test1234', '0123456789', 'ใช้งาน'),
('1516724375', 'พนักงานสต็อก', 'admin3', 'test1234', '0123456789', 'ใช้งาน'),
('1516724376', 'เจ้าของกิจการ', 'admin1', 'test1234', '0123456789', 'ใช้งาน'),
('1516724377', 'ผู้จัดการ', 'admin4', 'test1234', '0123456789', 'ใช้งาน'),
('3438057854', 'ลูกค้าtest101', 'length', '1421', '0021213', 'ใช้งาน'),
('3439525608', 'lll', 'll', '1111', NULL, 'ใช้งาน'),
('3511380040', 'ff', 'f', '1234', '0121245421', 'ใช้งาน')
ON DUPLICATE KEY UPDATE name=VALUES(name);

CREATE OR REPLACE VIEW `member` AS 
SELECT nisit_id AS id, nisit_id, name, username, password, phone, status FROM `nisit`;

CREATE TABLE IF NOT EXISTS `product` (
  `product_id` varchar(50) NOT NULL PRIMARY KEY,
  `name` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL,
  `price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `status` varchar(50) DEFAULT 'มีสินค้า',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `stock_quantity` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `product` (`product_id`, `name`, `category`, `price`, `status`, `created_at`, `stock_quantity`) VALUES
('P001', 'ปากกาลูกลื่น', 'เครื่องเขียน', 15.00, 'มีสินค้า', '2026-10-09 04:33:44', 107),
('P002', 'สมุดโน้ต A5', 'เครื่องเขียน', 35.00, 'มีสินค้า', '2026-10-09 04:33:44', 45),
('P003', 'แก้วน้ำสแตนเลส', 'ของใช้', 250.00, 'มีสินค้า', '2026-10-09 04:33:44', 44),
('P004', 'ร่มพับ', 'ของใช้', 189.00, 'มีสินค้า', '2026-10-09 04:33:44', 63),
('p90', 'ยางบวก', 'อาหาร', 10.00, 'มีสินค้า', '2026-10-09 04:50:37', 45),
('p91', 'ยางลบ', 'เครื่องเขียน', 10.00, 'มีสินค้า', '2026-10-09 04:52:49', 87)
ON DUPLICATE KEY UPDATE name=VALUES(name);
