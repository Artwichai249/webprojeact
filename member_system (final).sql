-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 08, 2026 at 05:47 PM
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
(3, 'ORD-20261102-23139', '3511380040', 'f', 'ff', 'a', 'a', 'พร้อมเพย์ / PromptPay', 189.00, 35.00, 224.00, 'รอดำเนินการ', NULL, '2026-11-02 08:15:23'),
(4, 'ORD-20261108-54368', '3511380040', 'f', 'ff', '0101010101', '10', 'พร้อมเพย์ / PromptPay', 75.00, 35.00, 110.00, 'รอดำเนินการ', NULL, '2026-11-08 15:15:54'),
(5, 'ORD-20261108-65367', '3511380040', 'f', 'ff', '0121245421', '10', 'พร้อมเพย์ / PromptPay', 15.00, 35.00, 50.00, 'รอดำเนินการ', NULL, '2026-11-08 15:46:05'),
(6, 'ORD-20261108-84369', '3511380040', 'f', 'ff', '0121245421', '10', 'พร้อมเพย์ / PromptPay', 15.00, 35.00, 50.00, 'รอดำเนินการ', NULL, '2026-11-08 16:29:44');

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
(3, 3, 'P004', 'ร่มพับ', 189.00, 1, 189.00),
(4, 4, 'P001', 'ปากกาลูกลื่น', 15.00, 5, 75.00),
(5, 5, 'P001', 'ปากกาลูกลื่น', 15.00, 1, 15.00),
(6, 6, 'P001', 'ปากกาลูกลื่น', 15.00, 1, 15.00);

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
(3, 'TXN-07323143', 'income', 'คำสั่งซื้อออนไลน์ (ลูกค้า)', 'คำสั่งซื้อออนไลน์ #ORD-20261102-23139 (ff)', 224.00, 'วิธีชำระ: พร้อมเพย์ / PromptPay, ที่อยู่: a', 'ff', '2026-11-02', '2026-11-02 08:15:23'),
(4, 'TXN-50954374', 'income', 'คำสั่งซื้อออนไลน์ (ลูกค้า)', 'คำสั่งซื้อออนไลน์ #ORD-20261108-54368 (ff)', 110.00, 'วิธีชำระ: พร้อมเพย์ / PromptPay, ที่อยู่: 10', 'ff', '2026-11-08', '2026-11-08 15:15:54'),
(5, 'TXN-52765375', 'income', 'คำสั่งซื้อออนไลน์ (ลูกค้า)', 'คำสั่งซื้อออนไลน์ #ORD-20261108-65367 (ff)', 50.00, 'วิธีชำระ: พร้อมเพย์ / PromptPay, ที่อยู่: 10', 'ff', '2026-11-08', '2026-11-08 15:46:05'),
(6, 'TXN-55384373', 'income', 'คำสั่งซื้อออนไลน์ (ลูกค้า)', 'คำสั่งซื้อออนไลน์ #ORD-20261108-84369 (ff)', 50.00, 'วิธีชำระ: พร้อมเพย์ / PromptPay, ที่อยู่: 10', 'ff', '2026-11-08', '2026-11-08 16:29:44');

-- --------------------------------------------------------

--
-- Table structure for table `gift_delivery`
--

CREATE TABLE `gift_delivery` (
  `gift_id` int(11) NOT NULL,
  `gift_no` varchar(50) NOT NULL,
  `nisit_id` varchar(50) DEFAULT NULL,
  `username` varchar(100) NOT NULL,
  `member_name` varchar(150) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `gift_type` varchar(50) NOT NULL DEFAULT 'เทศกาลปีใหม่',
  `gift_item` varchar(255) NOT NULL DEFAULT 'ชุดของขวัญพรีเมียมประจำปี',
  `shipping_address` text NOT NULL,
  `member_points` int(11) NOT NULL DEFAULT 0,
  `status` varchar(50) NOT NULL DEFAULT 'รออนุมัติ',
  `tracking_no` varchar(100) DEFAULT NULL,
  `approved_by` varchar(100) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `gift_delivery`
--

INSERT INTO `gift_delivery` (`gift_id`, `gift_no`, `nisit_id`, `username`, `member_name`, `phone`, `birth_date`, `gift_type`, `gift_item`, `shipping_address`, `member_points`, `status`, `tracking_no`, `approved_by`, `approved_at`, `note`, `created_at`) VALUES
(1, 'GIFT-2026-001', '1516724374', 'admin2', 'พนักงานขาย', '0123456789', '2002-01-15', 'เทศกาลปีใหม่', 'กระเช้าของขวัญพรีเมียมสวัสดีปีใหม่ 2027', '100/9 หมู่ 8 ต.ท่าโพธิ์ อ.เมือง จ.พิษณุโลก 65000', 0, 'จัดส่งสำเร็จ', 'TH-GIFT-457513', 'เจ้าของกิจการ', '2026-11-08 22:57:39', 'ลูกค้าสมาชิกแจ้งที่อยู่จัดส่งสำหรับเทศกาลปีใหม่', '2026-11-08 14:34:40'),
(2, 'GIFT-2026-002', '1516724375', 'admin3', 'พนักงานสต็อก', '0123456789', '2002-02-15', 'วันเกิด', 'เซ็ตของขวัญสุขสันต์วันเกิด (Birthday Special Box)', '101/9 หมู่ 8 ต.ท่าโพธิ์ อ.เมือง จ.พิษณุโลก 65000', 0, 'จัดส่งสำเร็จ', 'TH-GIFT-454351', 'เจ้าของกิจการ', '2026-11-08 22:57:35', 'ครบรอบเดือนเกิดของลูกค้าสมาชิก', '2026-11-08 14:34:40'),
(3, 'GIFT-2026-003', '1516724376', 'admin1', 'เจ้าของกิจการ', '0123456789', '2002-03-15', 'เทศกาลปีใหม่', 'ชุดกิฟต์เซ็ตสมุดไดอารี่และปากกาพรีเมียม ปีใหม่', '102/9 หมู่ 8 ต.ท่าโพธิ์ อ.เมือง จ.พิษณุโลก 65000', 0, 'จัดส่งสำเร็จ', 'TH-EMS-99283741', 'เจ้าของกิจการ', '2026-11-08 22:57:30', 'อนุมัติจัดส่งของขวัญปีใหม่เรียบร้อยแล้ว', '2026-11-08 14:34:40'),
(4, 'GIFT-2026-21672N', '3511380040', 'f', 'ff', '0101010101', '2002-07-14', 'เทศกาลปีใหม่', 'กระเช้าของขวัญสวัสดีปีใหม่สำหรับสมาชิก (New Year Gift Set)', '10', 10, 'จัดส่งสำเร็จ', 'TH-GIFT-441996', 'เจ้าของกิจการ', '2026-11-08 22:57:27', 'สมาชิกแจ้งวันเกิดและที่อยู่จัดส่งสำหรับรับของขวัญ (เทศกาลปีใหม่)', '2026-11-08 15:38:41'),
(5, 'GIFT-2026-21676B', '3511380040', 'f', 'ff', '0101010101', '2002-07-14', 'วันเกิด', 'เซ็ตของขวัญสุขสันต์วันเกิดสมาชิก (Birthday Gift Set)', '10', 10, 'จัดส่งสำเร็จ', 'TH-GIFT-439832', 'เจ้าของกิจการ', '2026-11-08 22:57:25', 'สมาชิกแจ้งวันเกิดและที่อยู่จัดส่งสำหรับรับของขวัญ (วันเกิด)', '2026-11-08 15:38:41');

-- --------------------------------------------------------

--
-- Table structure for table `member_profile`
--

CREATE TABLE `member_profile` (
  `profile_id` int(11) NOT NULL,
  `nisit_id` varchar(50) DEFAULT NULL,
  `username` varchar(100) NOT NULL,
  `member_name` varchar(150) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `points` int(11) NOT NULL DEFAULT 0,
  `total_spent` decimal(12,2) NOT NULL DEFAULT 0.00,
  `birth_date` date DEFAULT NULL,
  `gift_address` text DEFAULT NULL,
  `newyear_gift_opt_in` tinyint(1) NOT NULL DEFAULT 1,
  `birthday_gift_opt_in` tinyint(1) NOT NULL DEFAULT 1,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `member_profile`
--

INSERT INTO `member_profile` (`profile_id`, `nisit_id`, `username`, `member_name`, `phone`, `points`, `total_spent`, `birth_date`, `gift_address`, `newyear_gift_opt_in`, `birthday_gift_opt_in`, `updated_at`) VALUES
(1, '1516724374', 'admin2', 'พนักงานขาย', '0123456789', 0, 500.00, '2002-01-15', '100/9 หมู่ 8 ต.ท่าโพธิ์ อ.เมือง จ.พิษณุโลก 65000', 1, 1, '2026-11-08 15:17:07'),
(2, '1516724375', 'admin3', 'พนักงานสต็อก', '0123456789', 0, 500.00, '2002-02-15', '101/9 หมู่ 8 ต.ท่าโพธิ์ อ.เมือง จ.พิษณุโลก 65000', 1, 1, '2026-11-08 15:17:07'),
(3, '1516724376', 'admin1', 'เจ้าของกิจการ', '0123456789', 0, 500.00, '2002-03-15', '102/9 หมู่ 8 ต.ท่าโพธิ์ อ.เมือง จ.พิษณุโลก 65000', 1, 1, '2026-11-08 15:17:07'),
(4, '1516724377', 'admin4', 'ผู้จัดการ', '0123456789', 0, 500.00, '2002-04-15', '103/9 หมู่ 8 ต.ท่าโพธิ์ อ.เมือง จ.พิษณุโลก 65000', 1, 1, '2026-11-08 15:17:07'),
(5, '3438057854', 'length', 'ลูกค้าtest101', '0021213', 0, 1250.00, '2002-05-15', '104/9 หมู่ 8 ต.ท่าโพธิ์ อ.เมือง จ.พิษณุโลก 65000', 1, 1, '2026-11-08 15:17:07'),
(6, '3439525608', 'll', 'lll', '0891234567', 0, 1500.00, '2002-06-15', '105/9 หมู่ 8 ต.ท่าโพธิ์ อ.เมือง จ.พิษณุโลก 65000', 1, 1, '2026-11-08 15:17:07'),
(7, '3511380040', 'f', 'ff', '0121245421', 10, 1960.00, '2002-07-13', '10', 1, 1, '2026-11-08 16:29:44'),
(10, '4156031984', 'admin5', 'พนักงานขาย2', '0246502315', 0, 0.00, NULL, NULL, 1, 1, '2026-11-08 16:40:31');

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
('3511380040', 'ff', 'f', '1234', '0121245421', 'ใช้งาน');

-- --------------------------------------------------------

--
-- Table structure for table `point_history`
--

CREATE TABLE `point_history` (
  `history_id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `nisit_id` varchar(50) DEFAULT NULL,
  `member_name` varchar(150) DEFAULT NULL,
  `reference_no` varchar(60) DEFAULT NULL,
  `channel` varchar(60) NOT NULL DEFAULT 'สั่งซื้อสินค้า',
  `purchase_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `points_change` int(11) NOT NULL DEFAULT 0,
  `points_balance` int(11) NOT NULL DEFAULT 0,
  `note` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `point_history`
--

INSERT INTO `point_history` (`history_id`, `username`, `nisit_id`, `member_name`, `reference_no`, `channel`, `purchase_amount`, `points_change`, `points_balance`, `note`, `created_at`) VALUES
(1, 'f', '3511380040', 'ff', 'ORD-20261108-65367', 'สั่งซื้อออนไลน์ (ลูกค้า)', 50.00, 5, 5, 'สั่งซื้อสินค้าออนไลน์ #ORD-20261108-65367', '2026-11-08 15:46:05'),
(2, 'f', '3511380040', 'ff', 'ORD-20261108-84369', 'สั่งซื้อออนไลน์ (ลูกค้า)', 50.00, 5, 10, 'สั่งซื้อสินค้าออนไลน์ #ORD-20261108-84369', '2026-11-08 16:29:44');

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
('P001', 'ปากกาลูกลื่น', 'เครื่องเขียน', 15.00, 'มีสินค้า', '2026-10-09 04:33:44', 107),
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

-- --------------------------------------------------------

--
-- Table structure for table `staff_task`
--

CREATE TABLE `staff_task` (
  `task_id` int(11) NOT NULL,
  `task_no` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `assigned_to` varchar(100) NOT NULL,
  `staff_name` varchar(150) NOT NULL,
  `staff_role` varchar(100) NOT NULL DEFAULT 'พนักงานขาย',
  `priority` varchar(50) NOT NULL DEFAULT 'ปานกลาง',
  `progress` int(11) NOT NULL DEFAULT 0,
  `status` varchar(50) NOT NULL DEFAULT 'รอดำเนินการ',
  `due_date` date DEFAULT NULL,
  `assigned_by` varchar(100) DEFAULT 'ผู้จัดการ (admin2)',
  `remark` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `staff_task`
--

INSERT INTO `staff_task` (`task_id`, `task_no`, `title`, `description`, `assigned_to`, `staff_name`, `staff_role`, `priority`, `progress`, `status`, `due_date`, `assigned_by`, `remark`, `created_at`, `updated_at`) VALUES
(1, 'TASK-2026-001', 'ตรวจสอบแต้มสะสมของลูกค้าและเชิญชวนสมัครสมาชิกใหม่หน้าเคาน์เตอร์', 'แนะนำโปรโมชั่นซื้อครบทุก 50 บาท รับ 5 แต้ม พร้อมบันทึกข้อมูลวันเกิดและที่อยู่รับของขวัญปีใหม่ให้ลูกค้า', 'admin3', 'พนักงานขาย (admin3)', 'พนักงานขาย', 'สูง', 75, 'กำลังดำเนินการ', '2026-11-08', 'ผู้จัดการร้าน (admin2)', 'ดำเนินการสมัครสมาชิกใหม่ไปแล้ว 12 ราย', '2026-11-08 14:34:40', '2026-11-08 14:34:40'),
(2, 'TASK-2026-002', 'ตรวจรับสินค้าเข้าคลัง ตรวจสอบ QC และคัดแยกสินค้าชำรุดล็อตประจำสัปดาห์', 'ตรวจสอบคุณภาพสินค้าที่รับเข้าคลังทุกชิ้น บันทึกรายการที่ชำรุดเสียหาย และจัดเก็บเข้าโกดังตามหมวดหมู่ (1 หมวดหมู่ : 1 โกดัง)', 'admin4', 'พนักงานสต็อก/คลังสินค้า (admin4)', 'พนักงานสต็อก/คลังสินค้า', 'สูง', 100, 'เสร็จสิ้น', '2026-11-08', 'ผู้จัดการร้าน (admin2)', 'ตรวจ QC เสร็จสมบูรณ์ คัดแยกสินค้าชำรุดออกเรียบร้อย', '2026-11-08 14:34:40', '2026-11-08 14:34:40'),
(3, 'TASK-2026-003', 'จัดเรียงสต็อกสินค้าตามโกดังหมวดหมู่และตรวจสอบความจุโกดัง', 'ตรวจสอบให้แน่ใจว่าสินค้า 1 หมวดหมู่ ถูกจัดเก็บใน 1 โกดังตามเงื่อนไขที่กำหนด ไม่ปะปนกัน', 'admin4', 'พนักงานสต็อก/คลังสินค้า (admin4)', 'พนักงานสต็อก/คลังสินค้า', 'ปานกลาง', 40, 'กำลังดำเนินการ', '2026-11-08', 'ผู้จัดการร้าน (admin2)', 'จัดโซนโกดัง WH-01 และ WH-02 เสร็จแล้ว กำลังจัดโซน WH-03', '2026-11-08 14:34:40', '2026-11-08 14:34:40'),
(4, 'TASK-2026-004', 'สรุปยอดขายหน้าร้าน POS และตรวจสอบรายการของขวัญลูกค้าประจำเดือน', 'รวบรวมรายชื่อลูกค้าที่แจ้งวันเกิดในเดือนนี้ส่งให้เจ้าของร้านพิจารณาอนุมัติของขวัญ', 'admin3', 'พนักงานขาย (admin3)', 'พนักงานขาย', 'ปานกลาง', 0, 'รอดำเนินการ', '2026-11-08', 'ผู้จัดการร้าน (admin2)', 'รอสรุปข้อมูลช่วงปิดร้าน', '2026-11-08 14:34:40', '2026-11-08 14:34:40');

-- --------------------------------------------------------

--
-- Table structure for table `stock_qc_log`
--

CREATE TABLE `stock_qc_log` (
  `qc_id` int(11) NOT NULL,
  `qc_no` varchar(50) NOT NULL,
  `order_no` varchar(50) DEFAULT NULL,
  `product_id` varchar(50) NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL,
  `warehouse_code` varchar(50) NOT NULL,
  `warehouse_name` varchar(150) NOT NULL,
  `received_qty` int(11) NOT NULL DEFAULT 0,
  `passed_qty` int(11) NOT NULL DEFAULT 0,
  `damaged_qty` int(11) NOT NULL DEFAULT 0,
  `damage_reason` text DEFAULT NULL,
  `qc_status` varchar(50) NOT NULL DEFAULT 'ผ่าน QC ทั้งหมด',
  `inspector` varchar(100) DEFAULT 'พนักงานสต็อก (admin4)',
  `inspected_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stock_qc_log`
--

INSERT INTO `stock_qc_log` (`qc_id`, `qc_no`, `order_no`, `product_id`, `product_name`, `category`, `warehouse_code`, `warehouse_name`, `received_qty`, `passed_qty`, `damaged_qty`, `damage_reason`, `qc_status`, `inspector`, `inspected_at`) VALUES
(1, 'QC-2026-001', 'PR-SAMPLE-01', 'P001', 'ปากกาลูกลื่น', 'เครื่องเขียน', 'WH-01', 'โกดัง A1 (เครื่องเขียน)', 50, 48, 2, 'บรรจุภัณฑ์ฉีกขาดและตัวสินค้ามีรอยแตกจากการขนส่ง 2 ชิ้น', 'พบสินค้าชำรุดบางส่วน', 'พนักงานคลังสินค้า (admin4)', '2026-11-08 14:34:40'),
(2, 'QC-2026-002', 'PR-SAMPLE-02', 'P002', 'สมุดโน้ต A5', 'เครื่องเขียน', 'WH-01', 'โกดัง A1 (เครื่องเขียน)', 30, 30, 0, '- (สภาพสมบูรณ์ 100%)', 'ผ่าน QC ทั้งหมด', 'พนักงานคลังสินค้า (admin4)', '2026-11-08 14:34:40');

-- --------------------------------------------------------

--
-- Table structure for table `warehouse_location`
--

CREATE TABLE `warehouse_location` (
  `warehouse_id` int(11) NOT NULL,
  `warehouse_code` varchar(50) NOT NULL,
  `warehouse_name` varchar(150) NOT NULL,
  `category` varchar(100) NOT NULL,
  `zone_detail` varchar(150) DEFAULT 'โซนมาตรฐาน A',
  `max_capacity` int(11) NOT NULL DEFAULT 500,
  `manager_name` varchar(100) DEFAULT 'พนักงานคลังสินค้า (admin4)',
  `status` varchar(50) NOT NULL DEFAULT 'พร้อมใช้งาน',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `warehouse_location`
--

INSERT INTO `warehouse_location` (`warehouse_id`, `warehouse_code`, `warehouse_name`, `category`, `zone_detail`, `max_capacity`, `manager_name`, `status`, `updated_at`) VALUES
(1, 'WH-01', 'โกดัง A1 (เครื่องเขียน)', 'เครื่องเขียน', 'อาคารคลังสินค้า โซน A-1', 500, 'พนักงานสต็อก (admin4)', 'พร้อมใช้งาน', '2026-11-08 14:34:40'),
(2, 'WH-02', 'โกดัง B2 (ของใช้)', 'ของใช้', 'อาคารคลังสินค้า โซน B-2', 500, 'พนักงานสต็อก (admin4)', 'พร้อมใช้งาน', '2026-11-08 14:34:40'),
(3, 'WH-03', 'โกดัง C3 (อาหาร)', 'อาหาร', 'อาคารคลังสินค้า โซน C-3', 500, 'พนักงานสต็อก (admin4)', 'พร้อมใช้งาน', '2026-11-08 14:34:40'),
(4, 'WH-04', 'โกดัง D4 (อุปกรณ์สำนักงาน)', 'อุปกรณ์สำนักงาน', 'อาคารคลังสินค้า โซน D-4', 500, 'พนักงานสต็อก (admin4)', 'พร้อมใช้งาน', '2026-11-08 14:34:40'),
(5, 'WH-05', 'โกดัง E5 (อุปกรณ์ไอที)', 'อุปกรณ์ไอที', 'อาคารคลังสินค้า โซน E-5', 500, 'พนักงานสต็อก (admin4)', 'พร้อมใช้งาน', '2026-11-08 14:34:40'),
(6, 'WH-06', 'โกดัง F6 (กระดาษและสิ่งพิมพ์)', 'กระดาษและสิ่งพิมพ์', 'อาคารคลังสินค้า โซน F-6', 500, 'พนักงานสต็อก (admin4)', 'พร้อมใช้งาน', '2026-11-08 14:34:40'),
(7, 'WH-07', 'โกดัง G7 (ทั่วไป)', 'ทั่วไป', 'อาคารคลังสินค้า โซน G-7', 500, 'พนักงานสต็อก (admin4)', 'พร้อมใช้งาน', '2026-11-08 14:34:40');

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
-- Indexes for table `gift_delivery`
--
ALTER TABLE `gift_delivery`
  ADD PRIMARY KEY (`gift_id`),
  ADD UNIQUE KEY `gift_no` (`gift_no`);

--
-- Indexes for table `member_profile`
--
ALTER TABLE `member_profile`
  ADD PRIMARY KEY (`profile_id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `nisit`
--
ALTER TABLE `nisit`
  ADD PRIMARY KEY (`nisit_id`),
  ADD UNIQUE KEY `nisit_id` (`nisit_id`),
  ADD UNIQUE KEY `nisit_id_2` (`nisit_id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `point_history`
--
ALTER TABLE `point_history`
  ADD PRIMARY KEY (`history_id`);

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
-- Indexes for table `staff_task`
--
ALTER TABLE `staff_task`
  ADD PRIMARY KEY (`task_id`),
  ADD UNIQUE KEY `task_no` (`task_no`);

--
-- Indexes for table `stock_qc_log`
--
ALTER TABLE `stock_qc_log`
  ADD PRIMARY KEY (`qc_id`),
  ADD UNIQUE KEY `qc_no` (`qc_no`);

--
-- Indexes for table `warehouse_location`
--
ALTER TABLE `warehouse_location`
  ADD PRIMARY KEY (`warehouse_id`),
  ADD UNIQUE KEY `warehouse_code` (`warehouse_code`),
  ADD UNIQUE KEY `category` (`category`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `customer_order`
--
ALTER TABLE `customer_order`
  MODIFY `order_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `customer_order_item`
--
ALTER TABLE `customer_order_item`
  MODIFY `item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `finance_transaction`
--
ALTER TABLE `finance_transaction`
  MODIFY `transaction_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `gift_delivery`
--
ALTER TABLE `gift_delivery`
  MODIFY `gift_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `member_profile`
--
ALTER TABLE `member_profile`
  MODIFY `profile_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `point_history`
--
ALTER TABLE `point_history`
  MODIFY `history_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

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
-- AUTO_INCREMENT for table `staff_task`
--
ALTER TABLE `staff_task`
  MODIFY `task_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `stock_qc_log`
--
ALTER TABLE `stock_qc_log`
  MODIFY `qc_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `warehouse_location`
--
ALTER TABLE `warehouse_location`
  MODIFY `warehouse_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

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
