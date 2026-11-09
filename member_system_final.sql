-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 02, 2026 at 09:28 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `member_system`
--

-- --------------------------------------------------------

--
-- Table structure for table `customer_order`
--

CREATE TABLE `customer_order` (
  `order_id` int(11) NOT NULL,
  `order_no` varchar(50) NOT NULL,
  `customer_id` varchar(50) DEFAULT NULL,
  `customer_username` varchar(100) DEFAULT NULL,
  `customer_name` varchar(150) NOT NULL,
  `customer_phone` varchar(50) DEFAULT NULL,
  `shipping_address` text NOT NULL,
  `payment_method` varchar(50) NOT NULL DEFAULT 'พร้อมเพย์ / PromptPay',
  `subtotal` decimal(10,2) NOT NULL DEFAULT 0.00,
  `shipping_fee` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `status` varchar(50) NOT NULL DEFAULT 'รอดำเนินการ',
  `note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `customer_order`
--

INSERT INTO `customer_order` (`order_id`, `order_no`, `customer_id`, `customer_username`, `customer_name`, `customer_phone`, `shipping_address`, `payment_method`, `subtotal`, `shipping_fee`, `total_amount`, `status`, `note`, `created_at`) VALUES
(1, 'ORD-20261102-17280', '3439525608', 'll', 'lll', '11', 'asd', 'พร้อมเพย์ / PromptPay', 90.00, 35.00, 125.00, 'รอดำเนินการ', NULL, '2026-11-02 07:53:37'),
(2, 'ORD-20261102-48739', '1516724376', 'admin1', 'เจ้าของกิจการ', '11', '11', 'พร้อมเพย์ / PromptPay', 45.00, 35.00, 80.00, 'รอดำเนินการ', NULL, '2026-11-02 08:14:08'),
(3, 'ORD-20261102-23139', '3511380040', 'f', 'ff', 'a', 'a', 'พร้อมเพย์ / PromptPay', 189.00, 35.00, 224.00, 'รอดำเนินการ', NULL, '2026-11-02 08:15:23');

-- --------------------------------------------------------

--
-- Table structure for table `customer_order_item`
--

CREATE TABLE `customer_order_item` (
  `item_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `product_id` varchar(50) NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `qty` int(11) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `customer_order_item`
--

INSERT INTO `customer_order_item` (`item_id`, `order_id`, `product_id`, `product_name`, `price`, `qty`, `subtotal`) VALUES
(1, 1, 'P001', 'ปากกาลูกลื่น', 15.00, 6, 90.00),
(2, 2, 'P001', 'ปากกาลูกลื่น', 15.00, 3, 45.00),
(3, 3, 'P004', 'ร่มพับ', 189.00, 1, 189.00);

-- --------------------------------------------------------

--
-- Table structure for table `finance_transaction`
--

CREATE TABLE `finance_transaction` (
  `transaction_id` int(11) NOT NULL,
  `transaction_no` varchar(50) NOT NULL,
  `type` varchar(20) NOT NULL,
  `category` varchar(100) NOT NULL,
  `title` varchar(255) NOT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `note` text DEFAULT NULL,
  `recorded_by` varchar(100) DEFAULT NULL,
  `transaction_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `finance_transaction`
--

INSERT INTO `finance_transaction` (`transaction_id`, `transaction_no`, `type`, `category`, `title`, `amount`, `note`, `recorded_by`, `transaction_date`, `created_at`) VALUES
(1, 'TXN-06017309', 'income', 'คำสั่งซื้อออนไลน์ (ลูกค้า)', 'คำสั่งซื้อออนไลน์ #ORD-20261102-17280 (lll)', 125.00, 'วิธีชำระ: พร้อมเพย์ / PromptPay, ที่อยู่: asd', 'lll', '2026-11-02', '2026-11-02 07:53:37'),
(2, 'TXN-07248748', 'income', 'คำสั่งซื้อออนไลน์ (ลูกค้า)', 'คำสั่งซื้อออนไลน์ #ORD-20261102-48739 (เจ้าของกิจการ)', 80.00, 'วิธีชำระ: พร้อมเพย์ / PromptPay, ที่อยู่: 11', 'เจ้าของกิจการ', '2026-11-02', '2026-11-02 08:14:08'),
(3, 'TXN-07323143', 'income', 'คำสั่งซื้อออนไลน์ (ลูกค้า)', 'คำสั่งซื้อออนไลน์ #ORD-20261102-23139 (ff)', 224.00, 'วิธีชำระ: พร้อมเพย์ / PromptPay, ที่อยู่: a', 'ff', '2026-11-02', '2026-11-02 08:15:23');

-- --------------------------------------------------------

--
-- Table structure for table `nisit`
--

CREATE TABLE `nisit` (
  `nisit_id` varchar(20) NOT NULL,
  `name` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'ใช้งาน'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `nisit`
--

INSERT INTO `nisit` (`nisit_id`, `name`, `username`, `password`, `phone`, `status`) VALUES
('1516724374', 'พนักงานขาย', 'admin2', 'test1234', '0123456789', 'ใช้งาน'),
('1516724375', 'พนักงานสต็อก', 'admin3', 'test1234', '0123456789', 'ใช้งาน'),
('1516724376', 'เจ้าของกิจการ', 'admin1', 'test1234', '0123456789', 'ใช้งาน'),
('1516724377', 'ผู้จัดการ', 'admin4', 'test1234', '0123456789', 'ใช้งาน'),
('3438057854', 'ลูกค้าtest101', 'length', '1421', '0021213', 'ใช้งาน'),
('3439525608', 'lll', 'll', '1111', NULL, 'ใช้งาน'),
('3511380040', 'ff', 'f', '1234', NULL, 'ใช้งาน');

-- --------------------------------------------------------

--
-- Table structure for table `product`
--

CREATE TABLE `product` (
  `product_id` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL,
  `price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `status` varchar(50) DEFAULT 'มีสินค้า',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `stock_quantity` int(240) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `product`
--

INSERT INTO `product` (`product_id`, `name`, `category`, `price`, `status`, `created_at`, `stock_quantity`) VALUES
('P001', 'ปากกาลูกลื่น', 'เครื่องเขียน', 15.00, 'มีสินค้า', '2026-10-09 04:33:44', 114),
('P002', 'สมุดโน้ต A5', 'เครื่องเขียน', 35.00, 'มีสินค้า', '2026-10-09 04:33:44', 45),
('P003', 'แก้วน้ำสแตนเลส', 'ของใช้', 250.00, 'มีสินค้า', '2026-10-09 04:33:44', 44),
('P004', 'ร่มพับ', 'ของใช้', 189.00, 'มีสินค้า', '2026-10-09 04:33:44', 63),
('p90', 'ยางบวก', 'อาหาร', 10.00, 'มีสินค้า', '2026-10-09 04:50:37', 45),
('p91', 'ยางลบ', 'เครื่องเขียน', 10.00, 'มีสินค้า', '2026-10-09 04:52:49', 87);

-- --------------------------------------------------------

--
-- Table structure for table `purchase_order`
--

CREATE TABLE `purchase_order` (
  `order_id` int(11) NOT NULL,
  `order_no` varchar(50) NOT NULL,
  `product_id` varchar(50) NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `quantity` int(11) NOT NULL,
  `cost_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_cost` decimal(10,2) NOT NULL DEFAULT 0.00,
  `supplier` varchar(150) DEFAULT NULL,
  `ordered_by` varchar(100) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `status` varchar(50) DEFAULT 'สำเร็จ',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `purchase_order`
--

INSERT INTO `purchase_order` (`order_id`, `order_no`, `product_id`, `product_name`, `category`, `quantity`, `cost_price`, `total_cost`, `supplier`, `ordered_by`, `note`, `status`, `created_at`) VALUES
(1, 'PO20261029-573346', 'P001', 'ปากกาลูกลื่น', 'เครื่องเขียน', 10, 10.00, 100.00, '?????? ????? ?????', 'ผู้ดูแลระบบ', '????????????', 'สำเร็จ', '2026-10-29 12:22:53'),
(2, 'PO20261029-365358', 'P001', 'ปากกาลูกลื่น', 'เครื่องเขียน', 20, 10.50, 210.00, 'บริษัท ซัพพลายเออร์ สยาม จำกัด', 'เจ้าของกิจการ', 'สั่งซื้อเติมสต็อกสินค้า', 'สำเร็จ', '2026-10-29 12:36:05'),
(3, 'PO20261029-630615', 'P001', 'ปากกาลูกลื่น', 'เครื่องเขียน', 20, 10.50, 210.00, 'บริษัท ซัพพลายเออร์ สยาม จำกัด', 'เจ้าของกิจการ', 'สั่งซื้อเติมสต็อกสินค้า', 'สำเร็จ', '2026-10-29 12:40:30'),
(4, 'PR20261029-887368', 'P001', 'ปากกาลูกลื่น', 'เครื่องเขียน', 20, 10.50, 210.00, 'บริษัท ซัพพลายเออร์ สยาม จำกัด', 'เจ้าของกิจการ', 'สั่งซื้อเติมสต็อกสินค้า', 'รออนุมัติ', '2026-10-29 12:44:47'),
(5, 'PR20261029-948681', 'P001', 'ปากกาลูกลื่น', 'เครื่องเขียน', 20, 10.50, 210.00, 'บริษัท ซัพพลายเออร์ สยาม จำกัด', 'เจ้าของกิจการ', 'เสนอสั่งซื้อเติมสต็อกสินค้า', 'รออนุมัติ', '2026-10-29 12:45:48'),
(6, 'PR20261029-013774', 'P002', 'สมุดโน้ต A5', 'เครื่องเขียน', 25, 20.00, 500.00, '?????? ???????? ?????', '???????????', '???????????????????? A5 ?????????', 'อนุมัติแล้ว', '2026-10-29 12:46:53'),
(7, 'PR20261029-007344', 'P001', 'ปากกาลูกลื่น', 'เครื่องเขียน', 30, 12.00, 360.00, '?????? ????? ?????', '??????', '?????????????????????? [ชำระเงิน: QR Code PromptPay อ้างอิง SLIP-998877]', 'ชำระเงินแล้ว', '2026-10-29 13:03:27'),
(8, 'PR20261029-460642', 'P001', 'ปากกาลูกลื่น', 'เครื่องเขียน', 20, 10.50, 210.00, 'บริษัท ซัพพลายเออร์ สยาม จำกัด', 'เจ้าของกิจการ', 'เสนอสั่งซื้อเติมสต็อกสินค้า', 'รออนุมัติ', '2026-10-29 13:11:00'),
(9, 'PR20261029-243003', 'P001', 'ปากกาลูกลื่น', 'เครื่องเขียน', 20, 10.50, 210.00, 'บริษัท ซัพพลายเออร์ สยาม จำกัด', 'เจ้าของกิจการ', 'เสนอสั่งซื้อเติมสต็อกสินค้า [ชำระเงิน: QR Code PromptPay อ้างอิง PAY-690362]', 'ชำระเงินแล้ว', '2026-10-29 13:24:03'),
(10, 'PR20261029-212343', 'P001', 'ปากกาลูกลื่น', 'เครื่องเขียน', 20, 10.50, 210.00, 'บริษัท ซัพพลายเออร์ สยาม จำกัด', 'ผู้จัดการ', 'เสนอสั่งซื้อเติมสต็อกสินค้า [ชำระเงิน: QR Code PromptPay อ้างอิง PAY-240926]', 'ชำระเงินแล้ว', '2026-10-29 13:40:12');

-- --------------------------------------------------------

--
-- Table structure for table `sale`
--

CREATE TABLE `sale` (
  `sale_id` int(11) NOT NULL,
  `sale_no` varchar(30) NOT NULL,
  `nisit_id` varchar(20) DEFAULT NULL,
  `seller_name` varchar(100) DEFAULT NULL,
  `total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `cash` decimal(10,2) NOT NULL DEFAULT 0.00,
  `change_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sale`
--

INSERT INTO `sale` (`sale_id`, `sale_no`, `nisit_id`, `seller_name`, `total`, `cash`, `change_amount`, `created_at`) VALUES
(14, 'S20261031-586920', '1516724376', 'เจ้าของกิจการ', 15.00, 15.00, 0.00, '2026-10-31 09:06:26'),
(15, 'S20261101-410874', '3511380040', 'ff', 150.00, 150.00, 0.00, '2026-11-01 05:36:50');

-- --------------------------------------------------------

--
-- Table structure for table `sale_item`
--

CREATE TABLE `sale_item` (
  `item_id` int(11) NOT NULL,
  `sale_id` int(11) NOT NULL,
  `product_id` varchar(50) NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `qty` int(11) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sale_item`
--

INSERT INTO `sale_item` (`item_id`, `sale_id`, `product_id`, `product_name`, `price`, `qty`, `subtotal`) VALUES
(14, 14, 'P001', 'ปากกาลูกลื่น', 15.00, 1, 15.00),
(15, 15, 'P001', 'ปากกาลูกลื่น', 15.00, 10, 150.00);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `customer_order`
--
ALTER TABLE `customer_order`
  ADD PRIMARY KEY (`order_id`),
  ADD UNIQUE KEY `order_no` (`order_no`);

--
-- Indexes for table `customer_order_item`
--
ALTER TABLE `customer_order_item`
  ADD PRIMARY KEY (`item_id`),
  ADD KEY `order_id` (`order_id`);

--
-- Indexes for table `finance_transaction`
--
ALTER TABLE `finance_transaction`
  ADD PRIMARY KEY (`transaction_id`),
  ADD UNIQUE KEY `transaction_no` (`transaction_no`);

--
-- Indexes for table `nisit`
--
ALTER TABLE `nisit`
  ADD PRIMARY KEY (`nisit_id`),
  ADD UNIQUE KEY `nisit_id` (`nisit_id`),
  ADD UNIQUE KEY `nisit_id_2` (`nisit_id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `product`
--
ALTER TABLE `product`
  ADD PRIMARY KEY (`product_id`);

--
-- Indexes for table `purchase_order`
--
ALTER TABLE `purchase_order`
  ADD PRIMARY KEY (`order_id`),
  ADD UNIQUE KEY `order_no` (`order_no`);

--
-- Indexes for table `sale`
--
ALTER TABLE `sale`
  ADD PRIMARY KEY (`sale_id`),
  ADD UNIQUE KEY `sale_no` (`sale_no`);

--
-- Indexes for table `sale_item`
--
ALTER TABLE `sale_item`
  ADD PRIMARY KEY (`item_id`),
  ADD KEY `sale_id` (`sale_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `customer_order`
--
ALTER TABLE `customer_order`
  MODIFY `order_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `customer_order_item`
--
ALTER TABLE `customer_order_item`
  MODIFY `item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `finance_transaction`
--
ALTER TABLE `finance_transaction`
  MODIFY `transaction_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `purchase_order`
--
ALTER TABLE `purchase_order`
  MODIFY `order_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `sale`
--
ALTER TABLE `sale`
  MODIFY `sale_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `sale_item`
--
ALTER TABLE `sale_item`
  MODIFY `item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `customer_order_item`
--
ALTER TABLE `customer_order_item`
  ADD CONSTRAINT `customer_order_item_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `customer_order` (`order_id`) ON DELETE CASCADE;

--
-- Constraints for table `sale_item`
--
ALTER TABLE `sale_item`
  ADD CONSTRAINT `sale_item_ibfk_1` FOREIGN KEY (`sale_id`) REFERENCES `sale` (`sale_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
