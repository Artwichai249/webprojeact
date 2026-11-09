// index.js   
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const db = require("./db");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("สวัสดีค่ะ Server ทำงานแล้ว!");
});

app.get("/api/test", (req, res) => {
  res.json({ message: "API ทำงานถูกต้อง", status: "success" });
});

// Auto-create nisit, member, product tables on startup
const initNisitAndProductTables = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS nisit (
        nisit_id varchar(20) NOT NULL PRIMARY KEY,
        name varchar(100) NOT NULL,
        username varchar(50) NOT NULL UNIQUE,
        password varchar(100) NOT NULL,
        phone varchar(20) DEFAULT NULL,
        status varchar(20) DEFAULT 'ใช้งาน'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await db.query(`
      INSERT INTO nisit (nisit_id, name, username, password, phone, status) VALUES
      ('1516724376', 'เจ้าของกิจการ', 'admin1', 'test1234', '0123456789', 'ใช้งาน'),
      ('1516724374', 'พนักงานขาย', 'admin2', 'test1234', '0123456789', 'ใช้งาน'),
      ('1516724375', 'พนักงานสต็อก', 'admin3', 'test1234', '0123456789', 'ใช้งาน'),
      ('1516724377', 'ผู้จัดการ', 'admin4', 'test1234', '0123456789', 'ใช้งาน'),
      ('3438057854', 'ลูกค้าtest101', 'length', '1421', '0021213', 'ใช้งาน'),
      ('3439525608', 'lll', 'll', '1111', NULL, 'ใช้งาน'),
      ('3511380040', 'ff', 'f', '1234', '0121245421', 'ใช้งาน')
      ON DUPLICATE KEY UPDATE name=VALUES(name)
    `);

    await db.query(`
      CREATE OR REPLACE VIEW member AS 
      SELECT nisit_id AS id, nisit_id, name, username, password, phone, status FROM nisit
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS product (
        product_id varchar(50) NOT NULL PRIMARY KEY,
        name varchar(255) NOT NULL,
        category varchar(100) NOT NULL,
        price decimal(10,2) NOT NULL DEFAULT 0.00,
        status varchar(50) DEFAULT 'มีสินค้า',
        created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        stock_quantity int(11) NOT NULL DEFAULT 0
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await db.query(`
      INSERT INTO product (product_id, name, category, price, status, created_at, stock_quantity) VALUES
      ('P001', 'ปากกาลูกลื่น', 'เครื่องเขียน', 15.00, 'มีสินค้า', '2026-10-09 04:33:44', 107),
      ('P002', 'สมุดโน้ต A5', 'เครื่องเขียน', 35.00, 'มีสินค้า', '2026-10-09 04:33:44', 45),
      ('P003', 'แก้วน้ำสแตนเลส', 'ของใช้', 250.00, 'มีสินค้า', '2026-10-09 04:33:44', 44),
      ('P004', 'ร่มพับ', 'ของใช้', 189.00, 'มีสินค้า', '2026-10-09 04:33:44', 63),
      ('p90', 'ยางบวก', 'อาหาร', 10.00, 'มีสินค้า', '2026-10-09 04:50:37', 45),
      ('p91', 'ยางลบ', 'เครื่องเขียน', 10.00, 'มีสินค้า', '2026-10-09 04:52:49', 87)
      ON DUPLICATE KEY UPDATE name=VALUES(name)
    `);

    console.log("nisit and product tables auto-initialized successfully!");
  } catch (err) {
    console.warn("initNisitAndProductTables warning:", err.message);
  }
};
initNisitAndProductTables();

app.get("/api/init-db", async (req, res) => {
  await initNisitAndProductTables();
  res.json({ success: true, message: "Tables initialized!" });
});


// ============= AUTH API (Login / Logout) ================

// เก็บ session ไว้ในหน่วยความจำ: token -> { user, expiresAt }
const sessions = new Map();
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 ชั่วโมง

const getTokenFromHeader = (req) => {
  const auth = req.headers.authorization || "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : null;
};

// Middleware ตรวจสอบว่าเข้าสู่ระบบแล้วหรือยัง
const requireAuth = (req, res, next) => {
  const token = getTokenFromHeader(req);
  const session = token && sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (token) sessions.delete(token);
    return res.status(401).json({ message: "กรุณาเข้าสู่ระบบ" });
  }
  req.user = session.user;
  req.token = token;
  next();
};

// LOGIN: ตรวจสอบ username และ password
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ message: "กรุณากรอก Username และ Password" });
    }

    let rows;
    try {
      [rows] = await db.query("SELECT * FROM nisit WHERE username = ? LIMIT 1", [username]);
    } catch (e) {
      [rows] = await db.query("SELECT * FROM member WHERE username = ? LIMIT 1", [username]);
    }

    const found = rows[0];
    if (!found || String(found.password) !== String(password)) {
      return res.status(401).json({ message: "Username หรือ Password ไม่ถูกต้อง" });
    }
    if (found.status === "ไม่ใช้งาน") {
      return res.status(403).json({ message: "บัญชีนี้ถูกระงับการใช้งาน" });
    }

    const user = {
      id: found.nisit_id ?? found.id,
      name: found.name,
      username: found.username,
      status: found.status,
    };
    const token = crypto.randomBytes(32).toString("hex");
    sessions.set(token, { user, expiresAt: Date.now() + SESSION_TTL_MS });

    res.json({ message: "เข้าสู่ระบบสำเร็จ", token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SIGNUP: สมัครสมาชิกใหม่ (หน้าสาธารณะ ไม่ต้อง login)
app.post("/api/signup", async (req, res) => {
  try {
    const { name, username, password, phone } = req.body || {};
    if (!name?.trim() || !username?.trim() || !password) {
      return res.status(400).json({ message: "กรุณากรอกชื่อ, Username และ Password ให้ครบถ้วน" });
    }
    if (password.length < 4) {
      return res.status(400).json({ message: "Password ต้องมีอย่างน้อย 4 ตัวอักษร" });
    }

    let cleanPhone = null;
    if (phone) {
      cleanPhone = String(phone).replace(/\D/g, "");
      if (cleanPhone.length !== 10) {
        return res.status(400).json({ message: "เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลักเท่านั้น" });
      }
    }

    const table = await db
      .query("SELECT 1 FROM nisit LIMIT 1")
      .then(() => "nisit")
      .catch(() => "member");

    const [exists] = await db.query(`SELECT 1 FROM ${table} WHERE username = ? LIMIT 1`, [username.trim()]);
    if (exists.length > 0) {
      return res.status(409).json({ message: "Username นี้ถูกใช้งานแล้ว" });
    }

    const nisitId = Date.now().toString().slice(-10);
    await db.query(
      `INSERT INTO ${table} (nisit_id, name, username, password, phone, status) VALUES (?, ?, ?, ?, ?, ?)`,
      [nisitId, name.trim(), username.trim(), password, cleanPhone, "ใช้งาน"]
    );

    res.status(201).json({ message: "สมัครสมาชิกสำเร็จ", username: username.trim() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// รายชื่อ Username ที่เป็นผู้ดูแลระบบ (เข้าถึงได้ทุกหน้าในเว็บ)
const ADMIN_USERNAMES = ["admin1", "admin2", "admin3", "admin4"];

const isAdmin = (user) => {
  return ADMIN_USERNAMES.includes(user?.username?.trim().toLowerCase());
};

// Middleware: ตรวจสอบสิทธิ์ Admin (เฉพาะ admin1, admin2, admin3, admin4)
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "กรุณาเข้าสู่ระบบก่อน" });
  }
  if (!isAdmin(req.user)) {
    return res.status(403).json({
      message: "สิทธิ์ไม่เพียงพอ: บัญชีของคุณสามารถเข้าใช้งานได้เฉพาะหน้าขายสินค้าเท่านั้น (เฉพาะ admin1 - admin4 ที่เข้าจัดการส่วนนี้ได้)",
    });
  }
  next();
};

// ME: ตรวจสอบ token และคืนข้อมูลผู้ใช้ปัจจุบัน
app.get("/api/me", requireAuth, (req, res) => {
  res.json({
    user: {
      ...req.user,
      isAdmin: isAdmin(req.user),
    },
  });
});

// GET /api/user/profile: ดึงข้อมูลโปรไฟล์ส่วนบุคคลของผู้ใช้ปัจจุบัน
app.get("/api/user/profile", requireAuth, async (req, res) => {
  try {
    const currentUsername = (req.user?.username || "").trim();
    const currentUserId = req.user?.id !== undefined ? String(req.user.id).trim() : null;

    let userRecord = null;
    let tableName = "nisit";
    try {
      const [rows] = await db.query(
        "SELECT nisit_id, username, name, phone, status FROM nisit WHERE username = ? OR nisit_id = ? LIMIT 1",
        [currentUsername, currentUserId]
      );
      if (rows.length > 0) {
        userRecord = rows[0];
        tableName = "nisit";
      }
    } catch (e) {
      tableName = "member";
    }

    if (!userRecord) {
      try {
        const [rows] = await db.query(
          "SELECT id AS nisit_id, username, name, phone, status FROM member WHERE username = ? OR id = ? LIMIT 1",
          [currentUsername, currentUserId]
        );
        if (rows.length > 0) {
          userRecord = rows[0];
          tableName = "member";
        }
      } catch (e) {}
    }

    // ดึงข้อมูลเพิ่มเติมจาก member_profile
    let profileData = {};
    try {
      const [profRows] = await db.query(
        "SELECT * FROM member_profile WHERE username = ? LIMIT 1",
        [currentUsername]
      );
      if (profRows.length > 0) {
        profileData = profRows[0];
      }
    } catch (e) {}

    let birthDateStr = "";
    if (profileData.birth_date) {
      try {
        birthDateStr = new Date(profileData.birth_date).toISOString().slice(0, 10);
      } catch (e) {
        birthDateStr = String(profileData.birth_date);
      }
    }

    const responseData = {
      nisit_id: userRecord?.nisit_id || req.user.id || "-",
      username: userRecord?.username || req.user.username,
      name: userRecord?.name || profileData.member_name || req.user.name || "",
      phone: userRecord?.phone || profileData.phone || req.user.phone || "",
      status: userRecord?.status || "ใช้งาน",
      role: req.user.role || (isAdmin(req.user) ? "Admin" : "Member"),
      isAdmin: isAdmin(req.user),
      birth_date: birthDateStr,
      gift_address: profileData.gift_address || "",
      points: Number(profileData.points || 0),
      total_spent: Number(profileData.total_spent || 0),
      wallet_balance: parseFloat(profileData.wallet_balance || 0),
      newyear_gift_opt_in: profileData.newyear_gift_opt_in !== 0,
      birthday_gift_opt_in: profileData.birthday_gift_opt_in !== 0,
    };

    res.json(responseData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/user/profile: อัปเดตข้อมูลส่วนบุคคลของผู้ใช้ปัจจุบัน
app.put("/api/user/profile", requireAuth, async (req, res) => {
  try {
    const currentUsername = (req.user?.username || "").trim();
    const currentUserId = req.user?.id !== undefined ? String(req.user.id).trim() : null;
    const {
      name,
      phone,
      password,
      birth_date,
      gift_address,
      newyear_gift_opt_in = true,
      birthday_gift_opt_in = true,
    } = req.body || {};

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "กรุณาระบุชื่อ - นามสกุล" });
    }

    let cleanPhone = null;
    if (phone) {
      cleanPhone = String(phone).replace(/\D/g, "").slice(0, 10);
      if (cleanPhone.length !== 10) {
        return res.status(400).json({ message: "เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก" });
      }
    }

    if (password && password.trim().length > 0 && password.trim().length < 4) {
      return res.status(400).json({ message: "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร" });
    }

    // 1. อัปเดตในตาราง nisit หรือ member
    let table = "nisit";
    try {
      if (password && password.trim().length >= 4) {
        await db.query(
          "UPDATE nisit SET name = ?, phone = ?, password = ? WHERE username = ? OR nisit_id = ?",
          [name.trim(), cleanPhone, password.trim(), currentUsername, currentUserId]
        );
      } else {
        await db.query(
          "UPDATE nisit SET name = ?, phone = ? WHERE username = ? OR nisit_id = ?",
          [name.trim(), cleanPhone, currentUsername, currentUserId]
        );
      }
    } catch (e) {
      table = "member";
      if (password && password.trim().length >= 4) {
        await db.query(
          "UPDATE member SET name = ?, phone = ?, password = ? WHERE username = ? OR id = ?",
          [name.trim(), cleanPhone, password.trim(), currentUsername, currentUserId]
        );
      } else {
        await db.query(
          "UPDATE member SET name = ?, phone = ? WHERE username = ? OR id = ?",
          [name.trim(), cleanPhone, currentUsername, currentUserId]
        );
      }
    }

    // 2. อัปเดตในตาราง member_profile
    try {
      await db.query(
        `INSERT INTO member_profile 
         (nisit_id, username, member_name, phone, birth_date, gift_address, newyear_gift_opt_in, birthday_gift_opt_in)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           member_name = VALUES(member_name),
           phone = VALUES(phone),
           birth_date = VALUES(birth_date),
           gift_address = VALUES(gift_address),
           newyear_gift_opt_in = VALUES(newyear_gift_opt_in),
           birthday_gift_opt_in = VALUES(birthday_gift_opt_in)`,
        [
          currentUserId || null,
          currentUsername,
          name.trim(),
          cleanPhone,
          birth_date || null,
          gift_address ? gift_address.trim() : "",
          newyear_gift_opt_in ? 1 : 0,
          birthday_gift_opt_in ? 1 : 0,
        ]
      );
    } catch (e) {
      console.warn("ไม่สามารถอัปเดต member_profile ได้:", e.message);
    }

    // 3. อัปเดตข้อมูลใน session ผู้ใช้ปัจจุบัน
    if (req.user) {
      req.user.name = name.trim();
      req.user.phone = cleanPhone;
      const session = sessions.get(req.token);
      if (session && session.user) {
        session.user.name = name.trim();
        session.user.phone = cleanPhone;
      }
    }

    res.json({
      message: "บันทึกการตั้งค่าข้อมูลส่วนบุคคลสำเร็จ",
      user: {
        ...req.user,
        name: name.trim(),
        phone: cleanPhone,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGOUT: ลบ session ออกจากระบบ
app.post("/api/logout", (req, res) => {
  const token = getTokenFromHeader(req);
  if (token) sessions.delete(token);
  res.json({ message: "ออกจากระบบสำเร็จ" });
});

// Handler สำหรับดึงข้อมูลสมาชิก (เฉพาะ admin1 - admin4 เท่านั้นที่จะดูรายการสมาชิกได้)
const getAllMembers = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "กรุณาเข้าสู่ระบบก่อน" });
    }
    if (!isAdmin(user)) {
      return res.status(403).json({
        message: "สิทธิ์ไม่เพียงพอ: บัญชีของคุณสามารถเข้าใช้งานได้เฉพาะหน้าขายสินค้าเท่านั้น",
      });
    }
    let rows;
    try {
      [rows] = await db.query("SELECT * FROM nisit ORDER BY nisit_id ASC");
    } catch (e) {
      try {
        [rows] = await db.query("SELECT * FROM member ORDER BY id ASC");
      } catch (err) {
        rows = [];
      }
    }

    // รวมข้อมูลแต้มสะสม, ยอดซื้อ, วันเกิด และที่อยู่จัดส่งของขวัญจาก member_profile
    try {
      const [profiles] = await db.query("SELECT * FROM member_profile");
      const profileMap = new Map(profiles.map((p) => [p.username, p]));
      rows = rows.map((m) => {
        const prof = profileMap.get(m.username) || {};
        return {
          ...m,
          points: Number(prof.points || 0),
          total_spent: Number(prof.total_spent || 0),
          wallet_balance: parseFloat(prof.wallet_balance || 0),
          birth_date: prof.birth_date ? new Date(prof.birth_date).toISOString().slice(0, 10) : "",
          gift_address: prof.gift_address || "",
          newyear_gift_opt_in: Boolean(prof.newyear_gift_opt_in),
          birthday_gift_opt_in: Boolean(prof.birthday_gift_opt_in),
        };
      });
    } catch (pe) {}

    res.json(rows || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// READ: รองรับทั้ง /api/members (ตัว m) และ /api/menbers (ตัว n) โดยต้องเป็น admin เท่านั้น
app.get("/api/members", requireAuth, requireAdmin, getAllMembers);
app.get("/api/menbers", requireAuth, requireAdmin, getAllMembers);

// READ: ดึงข้อมูลสมาชิกรายบุคคลตาม ID (อนุญาตเฉพาะ Admin หรือบัญชีตนเองเท่านั้น)
app.get("/api/members/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    let rows;
    try {
      [rows] = await db.query("SELECT * FROM nisit WHERE nisit_id = ?", [id]);
    } catch (e) {
      [rows] = await db.query("SELECT * FROM member WHERE id = ? OR nisit_id = ?", [id, id]);
    }
    if (rows.length === 0) return res.status(404).json({ message: "ไม่พบข้อมูลสมาชิก" });

    const target = rows[0];
    const isOwner =
      req.user.username === target.username ||
      String(req.user.id) === String(target.nisit_id || target.id);

    if (!isAdmin(req.user) && !isOwner) {
      return res.status(403).json({
        message: "คุณไม่มีสิทธิ์ดูข้อมูลของสมาชิกท่านอื่น (บัญชีของคุณเข้าได้เฉพาะหน้าขายสินค้าเท่านั้น)",
      });
    }

    res.json(target);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/members", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { nisit_id, name, username, password, phone, status } = req.body;
    let cleanPhone = phone ? String(phone).replace(/\D/g, "") : null;
    if (cleanPhone && cleanPhone.length !== 10) {
      return res.status(400).json({ message: "เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลักเท่านั้น" });
    }
    const finalId = nisit_id || Date.now().toString().slice(-10);
    const finalStatus = status || "ใช้งาน";
    let result;
    try {
      [result] = await db.query(
        "INSERT INTO nisit (nisit_id, name, username, password, phone, status) VALUES (?, ?, ?, ?, ?, ?)",
        [finalId, name, username, password || "1234", cleanPhone, finalStatus]
      );
    } catch (e) {
      [result] = await db.query(
        "INSERT INTO member (nisit_id, name, username, password, phone, status) VALUES (?, ?, ?, ?, ?, ?)",
        [finalId, name, username, password || "1234", cleanPhone, finalStatus]
      );
    }
    res.json({ message: "เพิ่มสมาชิกสำเร็จ", result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE: แก้ไขข้อมูลสมาชิก (Admin1-4 แก้ไขได้ทุกคน, สมาชิกทั่วไปแก้ไขได้เฉพาะบัญชีตนเอง)
app.put("/api/members/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, username, password, phone, status } = req.body;

    // ค้นหาสมาชิกเป้าหมาย
    let target = null;
    let tableName = "nisit";
    try {
      const [rows] = await db.query("SELECT * FROM nisit WHERE nisit_id = ?", [id]);
      if (rows.length > 0) {
        target = rows[0];
        tableName = "nisit";
      }
    } catch (e) {
      tableName = "member";
    }

    if (!target) {
      try {
        const [rows] = await db.query("SELECT * FROM member WHERE nisit_id = ? OR id = ?", [id, id]);
        if (rows.length > 0) {
          target = rows[0];
          tableName = "member";
        }
      } catch (e) { }
    }

    if (!target) {
      return res.status(404).json({ message: "ไม่พบข้อมูลสมาชิก" });
    }

    // ตรวจสอบสิทธิ์: ผู้ดูแลระบบ (admin1-4) หรือเจ้าของบัญชีเท่านั้น
    const isOwner =
      (req.user.username && req.user.username === target.username) ||
      (req.user.id && String(req.user.id) === String(target.nisit_id || target.id));
    const canEdit = isAdmin(req.user) || isOwner;

    if (!canEdit) {
      return res.status(403).json({
        message: "คุณไม่มีสิทธิ์แก้ไขข้อมูลสมาชิกนี้ (แก้ไขได้เฉพาะบัญชีตนเอง หรือโดย Admin)",
      });
    }

    // ถ้ามีการเปลี่ยน username ให้ตรวจสอบว่าไม่ซ้ำกับผู้อื่น
    const newUsername = username ? username.trim() : target.username;
    if (newUsername !== target.username) {
      const targetId = target.nisit_id || target.id;
      const [dup] = await db.query(
        `SELECT 1 FROM ${tableName} WHERE username = ? AND (nisit_id != ? AND id != ?) LIMIT 1`,
        [newUsername, targetId, targetId]
      ).catch(async () => {
        return await db.query(
          `SELECT 1 FROM ${tableName} WHERE username = ? AND nisit_id != ? LIMIT 1`,
          [newUsername, targetId]
        );
      });
      if (dup && dup.length > 0) {
        return res.status(409).json({ message: "Username นี้มีผู้อื่นใช้งานแล้ว" });
      }
    }

    const newName = name !== undefined ? name : target.name;
    let newPhone = phone !== undefined ? phone : target.phone;
    if (newPhone) {
      newPhone = String(newPhone).replace(/\D/g, "");
      if (newPhone.length !== 10) {
        return res.status(400).json({ message: "เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลักเท่านั้น" });
      }
    }
    const newStatus = status !== undefined ? status : target.status;
    const targetKeyCol = target.nisit_id ? "nisit_id" : "id";
    const targetKeyValue = target.nisit_id || target.id || id;

    if (password && password !== "••••••••") {
      await db.query(
        `UPDATE ${tableName} SET name = ?, username = ?, password = ?, phone = ?, status = ? WHERE ${targetKeyCol} = ?`,
        [newName, newUsername, password, newPhone, newStatus, targetKeyValue]
      );
    } else {
      await db.query(
        `UPDATE ${tableName} SET name = ?, username = ?, phone = ?, status = ? WHERE ${targetKeyCol} = ?`,
        [newName, newUsername, newPhone, newStatus, targetKeyValue]
      );
    }

    // อัปเดตข้อมูลผู้ใช้ในหน่วยความจำ Session ทันที
    if (req.token && sessions.has(req.token)) {
      const sess = sessions.get(req.token);
      sess.user.name = newName;
      sess.user.username = newUsername;
      sess.user.status = newStatus;
      sessions.set(req.token, sess);
    }

    res.json({
      message: "แก้ไขข้อมูลสำเร็จ",
      user: { id: targetKeyValue, name: newName, username: newUsername, status: newStatus },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE: ลบข้อมูลสมาชิก (อนุญาตให้ลบได้เฉพาะบัญชีของตนเองเท่านั้น)
app.delete("/api/members/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    let target = null;
    let tableName = "nisit";
    try {
      const [rows] = await db.query("SELECT * FROM nisit WHERE nisit_id = ?", [id]);
      if (rows.length > 0) {
        target = rows[0];
        tableName = "nisit";
      }
    } catch (e) {
      tableName = "member";
    }

    if (!target) {
      try {
        const [rows] = await db.query("SELECT * FROM member WHERE nisit_id = ? OR id = ?", [id, id]);
        if (rows.length > 0) {
          target = rows[0];
          tableName = "member";
        }
      } catch (e) { }
    }

    if (!target) {
      return res.status(404).json({ message: "ไม่พบข้อมูลสมาชิก" });
    }

    // ตรวจสอบสิทธิ์: ผู้ดูแลระบบ (admin1-4) หรือเจ้าของบัญชีเท่านั้น
    const isOwner =
      (req.user.username && req.user.username === target.username) ||
      (req.user.id && String(req.user.id) === String(target.nisit_id || target.id));
    const canDelete = isAdmin(req.user) || isOwner;

    if (!canDelete) {
      return res.status(403).json({ message: "คุณไม่มีสิทธิ์ลบข้อมูลสมาชิกนี้ (ลบได้เฉพาะบัญชีตนเอง หรือโดย Admin)" });
    }

    const targetKeyCol = target.nisit_id ? "nisit_id" : "id";
    const targetKeyValue = target.nisit_id || target.id || id;
    await db.query(`DELETE FROM ${tableName} WHERE ${targetKeyCol} = ?`, [targetKeyValue]);

    res.json({ message: "ลบสมาชิกสำเร็จ" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ============= PRODUCT API ================


// READ: ดึงข้อมูลสินค้าทั้งหมด
app.get("/api/products", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM product ORDER BY product_id ASC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ: ดึงข้อมูลสินค้ารายชิ้น
app.get("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query("SELECT * FROM product WHERE product_id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ message: "ไม่พบข้อมูลสินค้า" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE: เพิ่มสินค้าใหม่ (เฉพาะ admin1 - admin4 เท่านั้น)
app.post("/api/products", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { product_id, name, category, price, status, stock_quantity } = req.body;

    // หากไม่ระบุ product_id ให้คำนวณรหัสให้อัตโนมัติ เช่น P005
    let finalId = product_id ? product_id.trim() : "";
    if (!finalId) {
      const [countRows] = await db.query("SELECT COUNT(*) AS total FROM product");
      finalId = `P${String((countRows[0].total || 0) + 1).padStart(3, "0")}`;
    }

    const finalStatus = status || "มีสินค้า";
    const finalPrice = parseFloat(price) || 0.00;
    const finalStock = parseInt(stock_quantity, 10) || 0;

    const [result] = await db.query(
      "INSERT INTO product (product_id, name, category, price, status, stock_quantity) VALUES (?, ?, ?, ?, ?, ?)",
      [finalId, name, category, finalPrice, finalStatus, finalStock]
    );

    res.json({ message: "เพิ่มสินค้าสำเร็จ", product_id: finalId, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE: แก้ไขข้อมูลสินค้า (เฉพาะ admin1 - admin4 เท่านั้น)
app.put("/api/products/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, price, status, stock_quantity } = req.body;
    const finalStock = parseInt(stock_quantity, 10);

    await db.query(
      "UPDATE product SET name = ?, category = ?, price = ?, status = ?, stock_quantity = ? WHERE product_id = ?",
      [
        name,
        category,
        parseFloat(price) || 0.00,
        status || "มีสินค้า",
        isNaN(finalStock) ? 0 : finalStock,
        id,
      ]
    );
    res.json({ message: "แก้ไขข้อมูลสินค้าสำเร็จ" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE: ลบสินค้า (เฉพาะ admin1 - admin4 เท่านั้น)
app.delete("/api/products/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM product WHERE product_id = ?", [id]);
    res.json({ message: "ลบสินค้าสำเร็จ" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============= PURCHASE ORDER API (ระบบสั่งซื้อสินค้า / เติมสต็อก) ================

const initPurchaseOrderTables = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS purchase_order (
        order_id INT AUTO_INCREMENT PRIMARY KEY,
        order_no VARCHAR(50) NOT NULL UNIQUE,
        product_id VARCHAR(50) NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        category VARCHAR(100) DEFAULT NULL,
        quantity INT NOT NULL,
        cost_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        total_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        supplier VARCHAR(150) DEFAULT NULL,
        ordered_by VARCHAR(100) DEFAULT NULL,
        note TEXT DEFAULT NULL,
        status VARCHAR(50) DEFAULT 'สำเร็จ',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  } catch (err) {
    console.error("สร้างตาราง purchase_order ไม่สำเร็จ:", err.message);
  }
};
initPurchaseOrderTables();

// READ: ดึงประวัติการเสนอสั่งซื้อสินค้าทั้งหมด
const getPurchaseOrders = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM purchase_order ORDER BY order_id DESC LIMIT 100"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
app.get("/api/purchase-orders", getPurchaseOrders);
app.get("/api/orders", getPurchaseOrders);
app.get("/api/purchase-proposals", getPurchaseOrders);

// READ: ดึงใบเสนอการสั่งซื้อรายใบตาม ID
const getPurchaseOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      "SELECT * FROM purchase_order WHERE order_id = ? OR order_no = ? LIMIT 1",
      [id, id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบใบเสนอการสั่งซื้อนี้" });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
app.get("/api/purchase-orders/:id", getPurchaseOrderById);
app.get("/api/orders/:id", getPurchaseOrderById);
app.get("/api/purchase-proposals/:id", getPurchaseOrderById);

// CREATE: บันทึกใบเสนอการสั่งซื้อสินค้า
const createPurchaseOrder = async (req, res) => {
  const {
    order_type, // 'existing' | 'new'
    product_id,
    name,
    category,
    price,
    quantity,
    cost_price,
    supplier,
    ordered_by,
    note,
    status, // 'รออนุมัติ' | 'อนุมัติแล้ว'
    auto_approve, // boolean
  } = req.body || {};

  const qty = parseInt(quantity, 10);
  if (isNaN(qty) || qty <= 0) {
    return res.status(400).json({ message: "กรุณาระบุจำนวนสินค้าที่เสนอสั่งซื้อให้ถูกต้อง (ต้องมากกว่า 0)" });
  }

  const cost = parseFloat(cost_price) || 0.0;
  const totalCost = cost * qty;

  // ตรวจสอบบทบาท: ถ้าเป็นพนักงานสต็อก ทำได้แค่ "รออนุมัติ" เท่านั้น (อนุมัติทันทีไม่ได้)
  const userUname = (req.user?.username || "").trim().toLowerCase();
  const userName = (req.user?.name || "").trim().toLowerCase();
  const userRole = (req.user?.role || "").trim().toLowerCase();
  const orderedByName = (ordered_by || "").trim().toLowerCase();

  const isStockStaff =
    userUname === "admin3" ||
    userName.includes("สต็อก") ||
    userName.includes("สต๊อก") ||
    userName.includes("คลัง") ||
    userRole.includes("สต็อก") ||
    userRole.includes("สต๊อก") ||
    userRole.includes("stock") ||
    userRole.includes("warehouse") ||
    orderedByName.includes("สต็อก") ||
    orderedByName.includes("สต๊อก") ||
    orderedByName.includes("คลัง");

  let isApproved = status === "อนุมัติแล้ว" || auto_approve === true;
  if (isStockStaff && isApproved) {
    isApproved = false; // บังคับเป็นรออนุมัติสำหรับพนักงานสต็อก
  }
  const finalStatus = isApproved ? "อนุมัติแล้ว" : "รออนุมัติ";

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    let targetProductId = product_id ? product_id.trim() : "";
    let targetProductName = name ? name.trim() : "";
    let targetCategory = category ? category.trim() : "";
    let newStock = 0;

    if (order_type === "new") {
      if (!targetProductName) {
        await conn.rollback();
        return res.status(400).json({ message: "กรุณาระบุชื่อสินค้าใหม่" });
      }

      // ถ้าไม่ระบุรหัสสินค้า ให้สร้างอัตโนมัติ
      if (!targetProductId) {
        const [countRows] = await conn.query("SELECT COUNT(*) AS total FROM product");
        targetProductId = `P${String((countRows[0].total || 0) + 1).padStart(3, "0")}`;
      } else {
        // เช็คว่ามีสินค้ารหัสนี้อยู่แล้วหรือไม่
        const [exists] = await conn.query("SELECT 1 FROM product WHERE product_id = ? LIMIT 1", [targetProductId]);
        if (exists.length > 0) {
          await conn.rollback();
          return res.status(400).json({ message: `รหัสสินค้า "${targetProductId}" มีอยู่ในระบบแล้ว กรุณาเลือกเสนอสั่งซื้อจากสินค้าเดิมหรือเปลี่ยนรหัส` });
        }
      }

      newStock = isApproved ? qty : 0;
      const newStatus = newStock <= 0 ? "หมด" : newStock < 10 ? "ใกล้หมด" : "มีสินค้า";
      const sellPrice = parseFloat(price) || (cost > 0 ? cost * 1.3 : 0.0);

      await conn.query(
        "INSERT INTO product (product_id, name, category, price, status, stock_quantity) VALUES (?, ?, ?, ?, ?, ?)",
        [targetProductId, targetProductName, targetCategory || "ทั่วไป", sellPrice, newStatus, newStock]
      );
    } else {
      // สินค้าเดิมที่มีอยู่แล้วในระบบ
      if (!targetProductId) {
        await conn.rollback();
        return res.status(400).json({ message: "กรุณาเลือกสินค้าที่ต้องการเสนอสั่งซื้อ" });
      }

      const [pRows] = await conn.query("SELECT * FROM product WHERE product_id = ? LIMIT 1", [targetProductId]);
      if (pRows.length === 0) {
        await conn.rollback();
        return res.status(404).json({ message: `ไม่พบสินค้ารหัส ${targetProductId}` });
      }

      const currentProduct = pRows[0];
      targetProductName = currentProduct.name;
      targetCategory = currentProduct.category;

      const currentStock = parseInt(currentProduct.stock_quantity, 10) || 0;
      newStock = isApproved ? currentStock + qty : currentStock;

      if (isApproved) {
        const newStatus = newStock <= 0 ? "หมด" : newStock < 10 ? "ใกล้หมด" : "มีสินค้า";
        await conn.query(
          "UPDATE product SET stock_quantity = ?, status = ? WHERE product_id = ?",
          [newStock, newStatus, targetProductId]
        );
      }
    }

    // สร้างเลขที่ใบเสนอสั่งซื้อ PR (Purchase Requisition เช่น PR20261029-123456)
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const orderNo = `PR${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${Date.now().toString().slice(-6)}`;

    const [orderResult] = await conn.query(
      `INSERT INTO purchase_order 
       (order_no, product_id, product_name, category, quantity, cost_price, total_cost, supplier, ordered_by, note, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderNo,
        targetProductId,
        targetProductName,
        targetCategory,
        qty,
        cost,
        totalCost,
        supplier || "ทั่วไป",
        ordered_by || "ผู้เสนอสั่งซื้อ",
        note || "",
        finalStatus,
      ]
    );

    await conn.commit();

    res.status(201).json({
      message: isApproved ? "บันทึกและอนุมัติการสั่งซื้อสำเร็จ" : "บันทึกใบเสนอการสั่งซื้อสำเร็จ",
      order: {
        order_id: orderResult.insertId,
        order_no: orderNo,
        product_id: targetProductId,
        product_name: targetProductName,
        quantity: qty,
        cost_price: cost,
        total_cost: totalCost,
        supplier: supplier || "ทั่วไป",
        ordered_by: ordered_by || "ผู้เสนอสั่งซื้อ",
        status: finalStatus,
        new_stock: newStock,
        created_at: now,
      },
    });
  } catch (err) {
    await conn.rollback().catch(() => { });
    console.error("Error creating purchase proposal:", err);
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
};
app.post("/api/purchase-orders", createPurchaseOrder);
app.post("/api/orders", createPurchaseOrder);
app.post("/api/purchase-proposals", createPurchaseOrder);

// APPROVE: อนุมัติใบเสนอการสั่งซื้อและรับเข้าสต็อก
const approvePurchaseOrder = async (req, res) => {
  const { id } = req.params;

  // ตรวจสอบสิทธิ์: พนักงานสต็อกไม่มีสิทธิ์อนุมัติ ต้องรอการอนุมัติจากเจ้าของร้านหรือผู้จัดการ
  const userUname = (req.user?.username || "").trim().toLowerCase();
  const userName = (req.user?.name || "").trim().toLowerCase();
  const userRole = (req.user?.role || "").trim().toLowerCase();

  const isStockStaff =
    userUname === "admin3" ||
    userName.includes("สต็อก") ||
    userName.includes("สต๊อก") ||
    userName.includes("คลัง") ||
    userRole.includes("สต็อก") ||
    userRole.includes("สต๊อก") ||
    userRole.includes("stock") ||
    userRole.includes("warehouse");

  if (isStockStaff) {
    return res.status(403).json({
      message: "พนักงานสต็อกทำได้เฉพาะ 'รออนุมัติ' เท่านั้น (ไม่มีสิทธิ์อนุมัติ ต้องรอการอนุมัติจากเจ้าของร้านหรือผู้จัดการ)",
    });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query(
      "SELECT * FROM purchase_order WHERE order_id = ? OR order_no = ? LIMIT 1",
      [id, id]
    );
    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: "ไม่พบใบเสนอการสั่งซื้อนี้" });
    }

    const order = rows[0];
    if (order.status === "อนุมัติแล้ว") {
      await conn.rollback();
      return res.status(400).json({ message: "ใบเสนอการสั่งซื้อนี้ได้รับการอนุมัติแล้ว" });
    }

    // เพิ่มสต็อกสินค้า
    const [pRows] = await conn.query("SELECT * FROM product WHERE product_id = ? LIMIT 1", [order.product_id]);
    let newStock = 0;
    if (pRows.length > 0) {
      const currentStock = parseInt(pRows[0].stock_quantity, 10) || 0;
      newStock = currentStock + parseInt(order.quantity, 10);
      const newStatus = newStock <= 0 ? "หมด" : newStock < 10 ? "ใกล้หมด" : "มีสินค้า";
      await conn.query(
        "UPDATE product SET stock_quantity = ?, status = ? WHERE product_id = ?",
        [newStock, newStatus, order.product_id]
      );
    }

    // อัปเดตสถานะใบเสนอสั่งซื้อเป็น อนุมัติแล้ว
    await conn.query("UPDATE purchase_order SET status = 'อนุมัติแล้ว' WHERE order_id = ?", [order.order_id]);

    await conn.commit();
    res.json({ message: "อนุมัติใบเสนอสั่งซื้อและรับสินค้าเข้าสต็อกสำเร็จ", order_id: order.order_id, new_stock: newStock });
  } catch (err) {
    await conn.rollback().catch(() => { });
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
};
app.put("/api/purchase-orders/:id/approve", approvePurchaseOrder);
app.put("/api/orders/:id/approve", approvePurchaseOrder);
app.put("/api/purchase-proposals/:id/approve", approvePurchaseOrder);

// PAY: บันทึกการชำระเงินค่าสินค้าและอนุมัติรับเข้าสต็อก
const payPurchaseOrder = async (req, res) => {
  const { id } = req.params;
  const { payment_method, paid_amount, payment_ref, payment_note } = req.body || {};

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query(
      "SELECT * FROM purchase_order WHERE order_id = ? OR order_no = ? LIMIT 1",
      [id, id]
    );
    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: "ไม่พบใบเสนอการสั่งซื้อนี้" });
    }

    const order = rows[0];
    const isAlreadyApproved = order.status === "อนุมัติแล้ว" || order.status === "ชำระเงินแล้ว";

    let newStock = 0;
    // หากยังไม่ได้รับการอนุมัติ ให้เพิ่มสต็อกสินค้า
    if (!isAlreadyApproved) {
      const [pRows] = await conn.query("SELECT * FROM product WHERE product_id = ? LIMIT 1", [order.product_id]);
      if (pRows.length > 0) {
        const currentStock = parseInt(pRows[0].stock_quantity, 10) || 0;
        newStock = currentStock + parseInt(order.quantity, 10);
        const newStatus = newStock <= 0 ? "หมด" : newStock < 10 ? "ใกล้หมด" : "มีสินค้า";
        await conn.query(
          "UPDATE product SET stock_quantity = ?, status = ? WHERE product_id = ?",
          [newStock, newStatus, order.product_id]
        );
      }
    } else {
      const [pRows] = await conn.query("SELECT stock_quantity FROM product WHERE product_id = ? LIMIT 1", [order.product_id]);
      if (pRows.length > 0) {
        newStock = pRows[0].stock_quantity;
      }
    }

    const finalStatus = "ชำระเงินแล้ว";
    const payDetail = `[ชำระเงิน: ${payment_method || "เงินสด"}${payment_ref ? ` อ้างอิง ${payment_ref}` : ""}]`;
    const noteWithPay = order.note ? `${order.note} ${payDetail}` : payDetail;

    await conn.query(
      `UPDATE purchase_order 
       SET status = ?, note = ?
       WHERE order_id = ?`,
      [finalStatus, noteWithPay, order.order_id]
    );

    await conn.commit();

    res.json({
      message: "ชำระเงินและรับสินค้าเข้าสต็อกสำเร็จ",
      order: {
        ...order,
        status: finalStatus,
        payment_method: payment_method || "เงินสด",
        paid_amount: paid_amount || order.total_cost,
        payment_ref: payment_ref || "-",
        new_stock: newStock,
        paid_at: new Date(),
      },
    });
  } catch (err) {
    await conn.rollback().catch(() => { });
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
};
app.post("/api/purchase-orders/:id/pay", payPurchaseOrder);
app.put("/api/purchase-orders/:id/pay", payPurchaseOrder);
app.post("/api/orders/:id/pay", payPurchaseOrder);
app.put("/api/orders/:id/pay", payPurchaseOrder);
app.post("/api/purchase-proposals/:id/pay", payPurchaseOrder);
app.put("/api/purchase-proposals/:id/pay", payPurchaseOrder);

// DELETE: ลบใบเสนอการสั่งซื้อ
const deletePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM purchase_order WHERE order_id = ? OR order_no = ?", [id, id]);
    res.json({ message: "ลบใบเสนอการสั่งซื้อสำเร็จ" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
app.delete("/api/purchase-orders/:id", deletePurchaseOrder);
app.delete("/api/orders/:id", deletePurchaseOrder);
app.delete("/api/purchase-proposals/:id", deletePurchaseOrder);

// ============= SALES API (ระบบขายสินค้า) ================

// สร้างตารางการขายอัตโนมัติ (ถ้ายังไม่มี)
const initSalesTables = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS sale (
        sale_id INT AUTO_INCREMENT PRIMARY KEY,
        sale_no VARCHAR(30) NOT NULL UNIQUE,
        nisit_id VARCHAR(20) DEFAULT NULL,
        seller_name VARCHAR(100) DEFAULT NULL,
        total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        cash DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        change_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    await db.query(`
      CREATE TABLE IF NOT EXISTS sale_item (
        item_id INT AUTO_INCREMENT PRIMARY KEY,
        sale_id INT NOT NULL,
        product_id VARCHAR(50) NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        qty INT NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (sale_id) REFERENCES sale(sale_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  } catch (err) {
    console.error("สร้างตารางการขายไม่สำเร็จ:", err.message);
  }
};
initSalesTables();

// CREATE: บันทึกการขาย (ต้อง login) + สะสมแต้มสมาชิก (ซื้อ 50 บาท ได้รับ 5 แต้ม)
app.post("/api/sales", requireAuth, async (req, res) => {
  const { items, cash, member_username, member_id } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "ไม่มีสินค้าในตะกร้า" });
  }

  const conn = await db.getConnection();
  try {
    // ดึงราคาจากฐานข้อมูลจริง (ไม่เชื่อราคาที่ส่งมาจากหน้าเว็บ)
    const ids = items.map((i) => i.product_id);
    const [products] = await conn.query("SELECT * FROM product WHERE product_id IN (?)", [ids]);
    const productMap = new Map(products.map((p) => [p.product_id, p]));

    const lines = [];
    for (const item of items) {
      const p = productMap.get(item.product_id);
      const qty = parseInt(item.qty, 10);
      if (!p) return res.status(400).json({ message: `ไม่พบสินค้า ${item.product_id}` });
      const currentStock = p.stock_quantity !== undefined && p.stock_quantity !== null ? Number(p.stock_quantity) : 0;
      if (currentStock <= 0 || p.status === "หมด") {
        return res.status(400).json({ message: `สินค้า "${p.name}" สินค้าหมดแล้ว` });
      }
      if (!qty || qty < 1) return res.status(400).json({ message: `จำนวนสินค้า "${p.name}" ไม่ถูกต้อง` });
      if (currentStock < qty) {
        return res.status(400).json({
          message: `สินค้า "${p.name}" มีสต็อกไม่พอ (คงเหลือ ${currentStock} ชิ้น แต่เลือกซื้อ ${qty} ชิ้น)`,
        });
      }
      const price = parseFloat(p.price);
      lines.push({ product_id: p.product_id, name: p.name, price, qty, subtotal: price * qty, currentStock });
    }

    const total = lines.reduce((s, l) => s + l.subtotal, 0);
    const cashPaid = cash === undefined || cash === "" ? total : parseFloat(cash);
    if (isNaN(cashPaid) || cashPaid < total) {
      return res.status(400).json({ message: "จำนวนเงินที่รับมาไม่พอ" });
    }

    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const saleNo = `S${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${Date.now().toString().slice(-6)}`;

    await conn.beginTransaction();
    const [result] = await conn.query(
      "INSERT INTO sale (sale_no, nisit_id, seller_name, total, cash, change_amount) VALUES (?, ?, ?, ?, ?, ?)",
      [saleNo, req.user.id, req.user.name, total, cashPaid, cashPaid - total]
    );
    const saleId = result.insertId;
    await conn.query(
      "INSERT INTO sale_item (sale_id, product_id, product_name, price, qty, subtotal) VALUES ?",
      [lines.map((l) => [saleId, l.product_id, l.name, l.price, l.qty, l.subtotal])]
    );

    // ตัดสต็อกสินค้าใน MySQL: <= 0 เป็น 'หมด', < 10 เป็น 'ใกล้หมด', >= 10 เป็น 'มีสินค้า'
    for (const l of lines) {
      const newStock = Math.max(0, l.currentStock - l.qty);
      const newStatus = newStock <= 0 ? "หมด" : newStock < 10 ? "ใกล้หมด" : "มีสินค้า";
      await conn.query(
        "UPDATE product SET stock_quantity = ?, status = ? WHERE product_id = ?",
        [newStock, newStatus, l.product_id]
      );
    }

    // 3.5 คำนวณแต้มสะสมให้สมาชิก (ซื้อทุกๆ 50 บาท ได้รับ 5 แต้ม)
    const earnedPoints = Math.floor(total / 50) * 5;
    let memberPointsInfo = null;
    if (member_username || member_id) {
      try {
        memberPointsInfo = await awardMemberPoints(conn, {
          username: member_username,
          nisit_id: member_id,
          purchaseAmount: total,
          pointsEarned: earnedPoints,
          referenceNo: saleNo,
          channel: "หน้าร้าน (POS)",
          note: `ซื้อสินค้าหน้าร้าน บิล #${saleNo}`,
        });
      } catch (ptErr) {
        console.warn("ไม่สามารถบันทึกแต้มสะสม POS:", ptErr.message);
      }
    }

    await conn.commit();

    res.status(201).json({
      message: "บันทึกการขายสำเร็จ",
      sale: {
        sale_id: saleId,
        sale_no: saleNo,
        seller_name: req.user.name,
        total,
        cash: cashPaid,
        change_amount: cashPaid - total,
        created_at: now,
        items: lines,
        earned_points: memberPointsInfo ? memberPointsInfo.earned_points : earnedPoints,
        member_points_balance: memberPointsInfo ? memberPointsInfo.points_balance : null,
        member_name: memberPointsInfo ? memberPointsInfo.member_name : null,
        member_username: memberPointsInfo ? memberPointsInfo.username : (member_username || null),
      },
    });
  } catch (err) {
    await conn.rollback().catch(() => { });
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// READ: ประวัติการขาย พร้อมรายการสินค้า (รวมทั้งยอดขายหน้าร้าน POS และคำสั่งซื้อจากลูกค้าออนไลน์)
app.get("/api/sales", requireAuth, async (req, res) => {
  try {
    // 1. ดึงข้อมูลยอดขายหน้าร้าน (sale + sale_item)
    const [sales] = await db.query("SELECT * FROM sale ORDER BY sale_id DESC LIMIT 100");
    let posItems = [];
    if (sales.length > 0) {
      const saleIds = sales.map((s) => s.sale_id);
      const [rows] = await db.query(
        "SELECT * FROM sale_item WHERE sale_id IN (?)",
        [saleIds]
      );
      posItems = rows;
    }

    const posSales = sales.map((s) => ({
      id: `pos_${s.sale_id}`,
      sale_id: s.sale_id,
      sale_no: s.sale_no,
      order_type: "pos",
      channel_label: "หน้าร้าน (POS)",
      seller_name: s.seller_name || "พนักงาน POS",
      customer_name: "-",
      total: parseFloat(s.total) || 0,
      cash: parseFloat(s.cash) || 0,
      change_amount: parseFloat(s.change_amount) || 0,
      payment_method: "เงินสด (Cash)",
      status: "สำเร็จ",
      created_at: s.created_at,
      items: posItems
        .filter((i) => i.sale_id === s.sale_id)
        .map((i) => ({
          item_id: i.item_id,
          sale_id: i.sale_id,
          product_id: i.product_id,
          name: i.product_name,
          product_name: i.product_name,
          price: parseFloat(i.price) || 0,
          qty: parseInt(i.qty, 10) || 1,
          subtotal: parseFloat(i.subtotal) || 0,
        })),
    }));

    // 2. ดึงคำสั่งซื้อจากลูกค้าออนไลน์ (customer_order + customer_order_item)
    let onlineOrders = [];
    try {
      const [custOrders] = await db.query(
        "SELECT * FROM customer_order ORDER BY order_id DESC LIMIT 100"
      );
      if (custOrders.length > 0) {
        const orderIds = custOrders.map((o) => o.order_id);
        const [cItems] = await db.query(
          "SELECT * FROM customer_order_item WHERE order_id IN (?)",
          [orderIds]
        );
        onlineOrders = custOrders.map((o) => ({
          id: `online_${o.order_id}`,
          sale_id: o.order_id,
          sale_no: o.order_no,
          order_type: "online",
          channel_label: "สั่งซื้อออนไลน์ (ลูกค้า)",
          seller_name: o.customer_name || o.customer_username || "ลูกค้าออนไลน์",
          customer_name: o.customer_name ? `${o.customer_name} (@${o.customer_username})` : `@${o.customer_username}`,
          customer_phone: o.customer_phone || "-",
          shipping_address: o.shipping_address || "-",
          total: parseFloat(o.total_amount) || 0,
          cash: parseFloat(o.total_amount) || 0,
          change_amount: 0,
          payment_method: o.payment_method || "พร้อมเพย์ / PromptPay",
          status: o.status || "รอดำเนินการ",
          created_at: o.created_at,
          items: cItems
            .filter((ci) => ci.order_id === o.order_id)
            .map((ci) => ({
              item_id: ci.item_id,
              sale_id: ci.order_id,
              product_id: ci.product_id,
              name: ci.product_name,
              product_name: ci.product_name,
              price: parseFloat(ci.price) || 0,
              qty: parseInt(ci.qty, 10) || 1,
              subtotal: parseFloat(ci.subtotal) || 0,
            })),
        }));
      }
    } catch (orderErr) {
      console.warn("ไม่สามารถดึง customer_order ได้:", orderErr.message);
    }

    // 3. รวมทั้งสองประวัติการขาย และเรียงลำดับจากล่าสุดไปเก่าสุด
    const combinedSales = [...posSales, ...onlineOrders].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    res.json(combinedSales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ============= FINANCE (สรุปรายรับ - รายจ่าย) API ================

const initFinancialTables = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS finance_transaction (
        transaction_id INT AUTO_INCREMENT PRIMARY KEY,
        transaction_no VARCHAR(50) NOT NULL UNIQUE,
        type VARCHAR(20) NOT NULL,
        category VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        note TEXT DEFAULT NULL,
        recorded_by VARCHAR(100) DEFAULT NULL,
        transaction_date DATE NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // ตารางข้อมูลบัญชีธนาคารและยอดเงินในบัญชีของร้านค้า
    await db.query(`
      CREATE TABLE IF NOT EXISTS store_bank_account (
        account_id INT AUTO_INCREMENT PRIMARY KEY,
        bank_name VARCHAR(100) NOT NULL DEFAULT 'ธนาคารกสิกรไทย (KBANK)',
        account_number VARCHAR(50) NOT NULL DEFAULT '098-7-65432-1',
        account_name VARCHAR(150) NOT NULL DEFAULT 'ร้านค้าครบวงจร (บัญชีหลัก)',
        initial_balance DECIMAL(12,2) NOT NULL DEFAULT 50000.00,
        note TEXT DEFAULT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // สร้างข้อมูลบัญชีธนาคารเริ่มต้นถ้ายังไม่มี
    const [accCount] = await db.query("SELECT COUNT(*) AS cnt FROM store_bank_account");
    if ((accCount[0]?.cnt || 0) === 0) {
      await db.query(`
        INSERT INTO store_bank_account (bank_name, account_number, account_name, initial_balance, note)
        VALUES ('ธนาคารกสิกรไทย (KBANK)', '098-7-65432-1', 'ร้านค้าครบวงจร (บัญชีหลัก)', 50000.00, 'ยอดเงินตั้งต้นในบัญชีของร้านค้า')
      `);
    }
  } catch (err) {
    console.error("สร้างตารางระบบการเงินไม่สำเร็จ:", err.message);
  }
};
initFinancialTables();

// READ: สรุปข้อมูลรายรับ-รายจ่ายทั้งหมด
app.get("/api/finance/summary", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, period } = req.query;

    // 1. ดึงข้อมูลรายรับจากการขายสินค้า (sale)
    let sales = [];
    try {
      const [rows] = await db.query(
        `SELECT 
          sale_id AS id,
          sale_no AS reference_no,
          'income' AS type,
          'ขายสินค้า (POS)' AS category,
          CONCAT('ยอดขายสินค้า (#', sale_no, ')') AS title,
          CAST(total AS DECIMAL(10,2)) AS amount,
          seller_name AS recorded_by,
          created_at,
          DATE(created_at) AS transaction_date,
          'sale' AS source
        FROM sale ORDER BY sale_id DESC`
      );
      sales = rows;
    } catch (e) {
      sales = [];
    }

    // 2. ดึงข้อมูลรายจ่ายจากการสั่งซื้อสินค้าเข้าสต็อก (purchase_order)
    let purchases = [];
    try {
      const [rows] = await db.query(
        `SELECT 
          order_id AS id,
          order_no AS reference_no,
          'expense' AS type,
          'สั่งซื้อสินค้าเข้าสต็อก' AS category,
          CONCAT('สั่งซื้อ ', product_name, ' (จำนวน ', quantity, ' ชิ้น)') AS title,
          CAST(total_cost AS DECIMAL(10,2)) AS amount,
          ordered_by AS recorded_by,
          created_at,
          DATE(created_at) AS transaction_date,
          'purchase' AS source
        FROM purchase_order ORDER BY order_id DESC`
      );
      purchases = rows;
    } catch (e) {
      purchases = [];
    }

    // 3. ดึงข้อมูลรายรับ-รายจ่ายอื่น ๆ ที่บันทึกเพิ่มเติม (finance_transaction)
    let customTxns = [];
    try {
      const [rows] = await db.query(
        `SELECT 
          transaction_id AS id,
          transaction_no AS reference_no,
          type,
          category,
          title,
          CAST(amount AS DECIMAL(10,2)) AS amount,
          recorded_by,
          created_at,
          transaction_date,
          note,
          'custom' AS source
        FROM finance_transaction ORDER BY transaction_id DESC`
      );
      customTxns = rows;
    } catch (e) {
      customTxns = [];
    }

    // รวมรายการธุรกรรมทั้งหมด
    let allTransactions = [...sales, ...purchases, ...customTxns];

    // กรองตามช่วงวันที่ (หากมีการส่งมา)
    if (startDate && endDate) {
      allTransactions = allTransactions.filter((t) => {
        const d = new Date(t.transaction_date).toISOString().slice(0, 10);
        return d >= startDate && d <= endDate;
      });
    } else if (period) {
      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);

      if (period === "today") {
        allTransactions = allTransactions.filter((t) => {
          const d = new Date(t.transaction_date).toISOString().slice(0, 10);
          return d === todayStr;
        });
      } else if (period === "week") {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        allTransactions = allTransactions.filter((t) => {
          const d = new Date(t.transaction_date).toISOString().slice(0, 10);
          return d >= sevenDaysAgo && d <= todayStr;
        });
      } else if (period === "month") {
        const currentMonthStr = todayStr.slice(0, 7); // 'YYYY-MM'
        allTransactions = allTransactions.filter((t) => {
          const d = new Date(t.transaction_date).toISOString().slice(0, 7);
          return d === currentMonthStr;
        });
      }
    }

    // เรียงตามเวลาล่าสุดก่อน
    allTransactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // คำนวณผลรวม
    const totalIncome = allTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    const totalExpense = allTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    const netProfit = totalIncome - totalExpense;

    // 4. ดึงข้อมูลบัญชีธนาคารและคำนวณยอดเงินในบัญชีปัจจุบัน (ยอดตั้งต้น + กำไรสุทธิ)
    let bankAccount = {
      bank_name: "ธนาคารกสิกรไทย (KBANK)",
      account_number: "098-7-65432-1",
      account_name: "ร้านค้าครบวงจร (บัญชีหลัก)",
      initial_balance: 50000.00,
      current_balance: 50000.00 + netProfit,
      note: "ยอดเงินตั้งต้นในบัญชีของร้านค้า",
    };
    try {
      const [accRows] = await db.query("SELECT * FROM store_bank_account ORDER BY account_id ASC LIMIT 1");
      if (accRows.length > 0) {
        const acc = accRows[0];
        const initBal = parseFloat(acc.initial_balance || 0);
        bankAccount = {
          account_id: acc.account_id,
          bank_name: acc.bank_name,
          account_number: acc.account_number,
          account_name: acc.account_name,
          initial_balance: initBal,
          current_balance: initBal + netProfit,
          note: acc.note,
          updated_at: acc.updated_at,
        };
      }
    } catch (e) {
      console.warn("fetch store_bank_account warning:", e.message);
    }

    // 5. ดึงข้อมูลยอดเงินในบัญชีของผู้ใช้งาน (Member Wallet Balances)
    let totalUserWallet = 0;
    let userWalletList = [];
    try {
      const [walletSum] = await db.query("SELECT COALESCE(SUM(wallet_balance), 0) AS total FROM member_profile");
      totalUserWallet = parseFloat(walletSum[0]?.total || 0);

      const [uRows] = await db.query(`
        SELECT 
          p.username,
          p.member_name,
          p.nisit_id,
          p.phone,
          p.points,
          CAST(COALESCE(p.wallet_balance, 0) AS DECIMAL(10,2)) AS wallet_balance,
          CAST(COALESCE(p.total_spent, 0) AS DECIMAL(10,2)) AS total_spent
        FROM member_profile p
        ORDER BY p.wallet_balance DESC, p.profile_id ASC
        LIMIT 50
      `);
      userWalletList = uRows;
    } catch (we) {
      console.warn("fetch member wallet warning:", we.message);
    }

    const currentUserUname = (req.user?.username || "").trim();
    const currentUserRecord = userWalletList.find((u) => u.username.toLowerCase() === currentUserUname.toLowerCase());
    const currentUserWalletBalance = currentUserRecord ? parseFloat(currentUserRecord.wallet_balance || 0) : 0;

    res.json({
      summary: {
        totalIncome,
        totalExpense,
        netProfit,
        totalCount: allTransactions.length,
        incomeCount: allTransactions.filter((t) => t.type === "income").length,
        expenseCount: allTransactions.filter((t) => t.type === "expense").length,
        totalUserWalletBalance: totalUserWallet,
        currentUserWalletBalance,
        bankBalance: bankAccount.current_balance,
        initialBalance: bankAccount.initial_balance,
      },
      userWalletList,
      currentUserWalletBalance,
      totalUserWalletBalance: totalUserWallet,
      bankAccount,
      transactions: allTransactions,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE: บันทึกรายการรายรับ-รายจ่ายเพิ่มเติม
app.post("/api/finance/transactions", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { type, category, title, amount, note, transaction_date } = req.body || {};
    if (!type || !title || !amount) {
      return res.status(400).json({ message: "กรุณาระบุประเภท, ชื่อรายการ และจำนวนเงิน" });
    }

    const txnNo = `TXN-${Date.now().toString().slice(-8)}`;
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ message: "จำนวนเงินต้องเป็นตัวเลขที่มากกว่า 0" });
    }

    const tDate = transaction_date || new Date().toISOString().slice(0, 10);
    const recordedBy = req.user.name || req.user.username;

    await db.query(
      `INSERT INTO finance_transaction (transaction_no, type, category, title, amount, note, recorded_by, transaction_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [txnNo, type, category || "อื่น ๆ", title.trim(), numAmount, note || null, recordedBy, tDate]
    );

    res.status(201).json({ message: "บันทึกรายการสำเร็จ", transaction_no: txnNo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE: ลบรายการรายรับ-รายจ่ายเพิ่มเติม
app.delete("/api/finance/transactions/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM finance_transaction WHERE transaction_id = ? OR transaction_no = ?", [id, id]);
    res.json({ message: "ลบรายการสำเร็จ" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ: ข้อมูลบัญชีธนาคารและยอดเงินในบัญชี
app.get("/api/finance/bank-account", requireAuth, requireAdmin, async (req, res) => {
  try {
    let bankAccount = {
      bank_name: "ธนาคารกสิกรไทย (KBANK)",
      account_number: "098-7-65432-1",
      account_name: "ร้านค้าครบวงจร (บัญชีหลัก)",
      initial_balance: 50000.00,
      current_balance: 50000.00,
      note: "ยอดเงินตั้งต้นในบัญชีของร้านค้า",
    };

    const [accRows] = await db.query("SELECT * FROM store_bank_account ORDER BY account_id ASC LIMIT 1");
    if (accRows.length > 0) {
      const acc = accRows[0];
      const initBal = parseFloat(acc.initial_balance || 0);

      // คำนวณรายรับและรายจ่ายทั้งหมด
      let allIncome = 0;
      let allExpense = 0;
      try {
        const [saleRows] = await db.query("SELECT COALESCE(SUM(total), 0) AS total FROM sale");
        const [poRows] = await db.query("SELECT COALESCE(SUM(total_cost), 0) AS total FROM purchase_order");
        const [fnIncome] = await db.query("SELECT COALESCE(SUM(amount), 0) AS total FROM finance_transaction WHERE type = 'income'");
        const [fnExpense] = await db.query("SELECT COALESCE(SUM(amount), 0) AS total FROM finance_transaction WHERE type = 'expense'");

        allIncome = parseFloat(saleRows[0]?.total || 0) + parseFloat(fnIncome[0]?.total || 0);
        allExpense = parseFloat(poRows[0]?.total || 0) + parseFloat(fnExpense[0]?.total || 0);
      } catch (e) {}

      const net = allIncome - allExpense;
      bankAccount = {
        account_id: acc.account_id,
        bank_name: acc.bank_name,
        account_number: acc.account_number,
        account_name: acc.account_name,
        initial_balance: initBal,
        current_balance: initBal + net,
        total_income: allIncome,
        total_expense: allExpense,
        net_profit: net,
        note: acc.note,
        updated_at: acc.updated_at,
      };
    }

    res.json(bankAccount);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE: ปรับปรุงข้อมูลบัญชีธนาคารและยอดเงินในบัญชี
app.post("/api/finance/bank-account", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { bank_name, account_number, account_name, initial_balance, note } = req.body || {};
    const initBal = parseFloat(initial_balance);

    const [existing] = await db.query("SELECT account_id FROM store_bank_account LIMIT 1");
    if (existing.length > 0) {
      await db.query(
        `UPDATE store_bank_account
         SET bank_name = COALESCE(?, bank_name),
             account_number = COALESCE(?, account_number),
             account_name = COALESCE(?, account_name),
             initial_balance = CASE WHEN ? IS NOT NULL AND NOT ISNAN(?) THEN ? ELSE initial_balance END,
             note = COALESCE(?, note)
         WHERE account_id = ?`,
        [
          bank_name || null,
          account_number || null,
          account_name || null,
          isNaN(initBal) ? null : initBal,
          isNaN(initBal) ? null : initBal,
          isNaN(initBal) ? null : initBal,
          note || null,
          existing[0].account_id
        ]
      );
    } else {
      await db.query(
        `INSERT INTO store_bank_account (bank_name, account_number, account_name, initial_balance, note)
         VALUES (?, ?, ?, ?, ?)`,
        [
          bank_name || "ธนาคารกสิกรไทย (KBANK)",
          account_number || "098-7-65432-1",
          account_name || "ร้านค้าครบวงจร (บัญชีหลัก)",
          isNaN(initBal) ? 50000.00 : initBal,
          note || "ยอดเงินตั้งต้นในบัญชีของร้านค้า",
        ]
      );
    }

    res.json({ message: "อัปเดตข้อมูลบัญชีธนาคารและยอดเงินเรียบร้อยแล้ว" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ============= CUSTOMER ORDER (ระบบสั่งซื้อสินค้าสำหรับลูกค้า) API ================

const initCustomerOrderTables = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS customer_order (
        order_id INT AUTO_INCREMENT PRIMARY KEY,
        order_no VARCHAR(50) NOT NULL UNIQUE,
        customer_id VARCHAR(50) DEFAULT NULL,
        customer_username VARCHAR(100) DEFAULT NULL,
        customer_name VARCHAR(150) NOT NULL,
        customer_phone VARCHAR(50) DEFAULT NULL,
        shipping_address TEXT NOT NULL,
        payment_method VARCHAR(50) NOT NULL DEFAULT 'พร้อมเพย์ / PromptPay',
        subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        shipping_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        status VARCHAR(50) NOT NULL DEFAULT 'รอดำเนินการ',
        note TEXT DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS customer_order_item (
        item_id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id VARCHAR(50) NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        qty INT NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES customer_order(order_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  } catch (err) {
    console.error("สร้างตาราง customer_order ไม่สำเร็จ:", err.message);
  }
};
initCustomerOrderTables();

// CREATE: ลูกค้าสั่งซื้อสินค้า (บันทึกออเดอร์, ตัดสต็อก, บันทึกการเงิน)
app.post("/api/customer-orders", requireAuth, async (req, res) => {
  const {
    items,
    customer_name,
    customer_phone,
    shipping_address,
    payment_method,
    shipping_fee = 0,
    note = "",
  } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "กรุณาเลือกสินค้าอย่างน้อย 1 รายการ" });
  }

  if (!shipping_address?.trim()) {
    return res.status(400).json({ message: "กรุณาระบุที่อยู่สำหรับจัดส่งสินค้า" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // ดึงข้อมูลสินค้าจริงจากฐานข้อมูลเพื่อตรวจสอบราคาและสต็อกคงเหลือ
    const ids = items.map((i) => i.product_id);
    const [products] = await conn.query(
      "SELECT * FROM product WHERE product_id IN (?)",
      [ids]
    );
    const productMap = new Map(products.map((p) => [p.product_id, p]));

    const lines = [];
    for (const item of items) {
      const p = productMap.get(item.product_id);
      const qty = parseInt(item.qty, 10);
      if (!p) {
        await conn.rollback();
        return res.status(400).json({ message: `ไม่พบสินค้า ${item.product_id}` });
      }
      const currentStock =
        p.stock_quantity !== undefined && p.stock_quantity !== null
          ? Number(p.stock_quantity)
          : 0;

      if (currentStock <= 0 || p.status === "หมด") {
        await conn.rollback();
        return res.status(400).json({
          message: `สินค้า "${p.name}" สินค้าหมดสต็อกแล้ว`,
        });
      }
      if (!qty || qty < 1) {
        await conn.rollback();
        return res.status(400).json({
          message: `จำนวนสินค้า "${p.name}" ไม่ถูกต้อง`,
        });
      }
      if (currentStock < qty) {
        await conn.rollback();
        return res.status(400).json({
          message: `สินค้า "${p.name}" มีสต็อกไม่เพียงพอ (คงเหลือ ${currentStock} ชิ้น แต่ต้องการสั่งซื้อ ${qty} ชิ้น)`,
        });
      }

      const price = parseFloat(p.price);
      lines.push({
        product_id: p.product_id,
        name: p.name,
        price,
        qty,
        subtotal: price * qty,
        currentStock,
      });
    }

    const subtotal = lines.reduce((sum, l) => sum + l.subtotal, 0);
    const shipFee = parseFloat(shipping_fee) || 0.00;
    const totalAmount = subtotal + shipFee;

    const pad = (n) => String(n).padStart(2, "0");
    const now = new Date();
    const datePrefix = `ORD-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
    const orderNo = `${datePrefix}-${Date.now().toString().slice(-5)}`;

    const custName = (customer_name || req.user.name || req.user.username || "ลูกค้า").trim();
    const rawPhone = (customer_phone || req.user.phone || "").toString();
    const custPhone = rawPhone.replace(/\D/g, "");
    if (!/^\d{10}$/.test(custPhone)) {
      return res.status(400).json({ message: "เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลักเท่านั้น" });
    }
    const payMethod = payment_method || "พร้อมเพย์ / PromptPay";
    const isWalletPayment = payMethod.includes("ยอดเงินในบัญชี") || payMethod.includes("กระเป๋าเงิน");

    if (isWalletPayment) {
      // ตรวจสอบยอดเงินในบัญชีของลูกค้า
      const [userProf] = await conn.query(
        "SELECT wallet_balance FROM member_profile WHERE username = ? LIMIT 1",
        [req.user.username]
      );
      const currentBal = parseFloat(userProf[0]?.wallet_balance || 0);
      if (currentBal < totalAmount) {
        await conn.rollback();
        return res.status(400).json({
          message: `ยอดเงินในบัญชีของคุณไม่เพียงพอ (คงเหลือ ฿${currentBal.toFixed(2)} แต่ต้องชำระ ฿${totalAmount.toFixed(2)}) กรุณาเติมเงินเข้าบัญชีก่อนทำรายการ`,
        });
      }
      // ตัดยอดเงินในบัญชีลูกค้า
      const newBal = currentBal - totalAmount;
      await conn.query("UPDATE member_profile SET wallet_balance = ? WHERE username = ?", [newBal, req.user.username]);
      // บันทึกลง wallet_history
      try {
        await conn.query(
          `INSERT INTO wallet_history (username, type, amount, balance_after, reason, recorded_by)
           VALUES (?, 'payment', ?, ?, ?, ?)`,
          [
            req.user.username,
            -totalAmount,
            newBal,
            `ชำระค่าสินค้าคำสั่งซื้อออนไลน์ #${orderNo}`,
            req.user.name || req.user.username,
          ]
        );
      } catch (e) {}
    }

    // 1. บันทึกหัวบิล customer_order
    const [orderResult] = await conn.query(
      `INSERT INTO customer_order 
       (order_no, customer_id, customer_username, customer_name, customer_phone, shipping_address, payment_method, subtotal, shipping_fee, total_amount, status, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'รอดำเนินการ', ?)`,
      [
        orderNo,
        req.user.id || null,
        req.user.username || null,
        custName,
        custPhone,
        shipping_address.trim(),
        payMethod,
        subtotal,
        shipFee,
        totalAmount,
        note?.trim() || null,
      ]
    );

    const orderId = orderResult.insertId;

    // 2. บันทึกรายการสินค้า customer_order_item
    await conn.query(
      "INSERT INTO customer_order_item (order_id, product_id, product_name, price, qty, subtotal) VALUES ?",
      [lines.map((l) => [orderId, l.product_id, l.name, l.price, l.qty, l.subtotal])]
    );

    // 3. ตัดสต็อกสินค้าในตาราง product
    for (const l of lines) {
      const newStock = Math.max(0, l.currentStock - l.qty);
      const newStatus = newStock <= 0 ? "หมด" : newStock < 10 ? "ใกล้หมด" : "มีสินค้า";
      await conn.query(
        "UPDATE product SET stock_quantity = ?, status = ? WHERE product_id = ?",
        [newStock, newStatus, l.product_id]
      );
    }

    // 4. บันทึกรายรับลงในตารางการเงิน finance_transaction โดยอัตโนมัติ
    try {
      const txnNo = `TXN-${Date.now().toString().slice(-8)}`;
      await conn.query(
        `INSERT INTO finance_transaction 
         (transaction_no, type, category, title, amount, note, recorded_by, transaction_date)
         VALUES (?, 'income', 'คำสั่งซื้อออนไลน์ (ลูกค้า)', ?, ?, ?, ?, ?)`,
        [
          txnNo,
          `คำสั่งซื้อออนไลน์ #${orderNo} (${custName})`,
          totalAmount,
          `วิธีชำระ: ${payMethod}, ที่อยู่: ${shipping_address.trim()}`,
          req.user.name || req.user.username,
          now.toISOString().slice(0, 10),
        ]
      );
    } catch (e) {
      console.warn("ไม่สามารถบันทึกรายการลง finance_transaction ได้:", e.message);
    }

    // 5. คำนวณและสะสมแต้มสมาชิก (ซื้อครบทุก 50 บาท ได้รับ 5 แต้ม)
    const earnedPoints = Math.floor(totalAmount / 50) * 5;
    let memberPointsInfo = null;
    try {
      memberPointsInfo = await awardMemberPoints(conn, {
        username: req.user.username,
        nisit_id: req.user.id,
        memberName: custName,
        phone: custPhone,
        shippingAddress: shipping_address.trim(),
        purchaseAmount: totalAmount,
        pointsEarned: earnedPoints,
        referenceNo: orderNo,
        channel: "สั่งซื้อออนไลน์ (ลูกค้า)",
        note: `สั่งซื้อสินค้าออนไลน์ #${orderNo}`,
      });
    } catch (ptErr) {
      console.warn("ไม่สามารถบันทึกแต้มสะสมจากคำสั่งซื้อออนไลน์ได้:", ptErr.message);
    }

    await conn.commit();

    res.status(201).json({
      message: "สั่งซื้อสินค้าสำเร็จ เรียบร้อยแล้ว",
      order: {
        order_id: orderId,
        order_no: orderNo,
        customer_name: custName,
        customer_phone: custPhone,
        shipping_address,
        payment_method: payMethod,
        subtotal,
        shipping_fee: shipFee,
        total_amount: totalAmount,
        status: "รอดำเนินการ",
        created_at: now,
        items: lines,
        earned_points: earnedPoints,
        points_balance: memberPointsInfo ? memberPointsInfo.points_balance : earnedPoints,
      },
    });
  } catch (err) {
    await conn.rollback().catch(() => {});
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// READ: ดึงประวัติคำสั่งซื้อของฉัน (แสดงเฉพาะคำสั่งซื้อของบัญชีที่เข้าสู่ระบบอยู่เท่านั้น)
app.get("/api/customer-orders", requireAuth, async (req, res) => {
  try {
    const currentUsername = (req.user?.username || "").trim();
    const currentUserId = req.user?.id !== undefined ? String(req.user.id).trim() : null;

    const isSalesOrAdmin =
      isAdmin(req.user) ||
      req.user?.username === "admin2" ||
      (req.user?.role && (req.user.role.includes("sales") || req.user.role.includes("ขาย")));

    // หากส่ง ?all=true และเป็นพนักงานขายหรือ Admin ให้ดึงคำสั่งซื้อทั้งหมด
    const showAll = req.query.all === "true" && isSalesOrAdmin;

    let orders;
    if (showAll) {
      [orders] = await db.query(
        "SELECT * FROM customer_order ORDER BY order_id DESC LIMIT 200"
      );
    } else {
      // ดึงเฉพาะคำสั่งซื้อของบัญชีที่กำลังเข้าสู่ระบบอยู่เท่านั้น
      [orders] = await db.query(
        `SELECT * FROM customer_order 
         WHERE LOWER(TRIM(customer_username)) = LOWER(?) 
            OR (customer_id IS NOT NULL AND customer_id = ?)
         ORDER BY order_id DESC LIMIT 100`,
        [currentUsername, currentUserId]
      );
    }

    if (orders.length === 0) return res.json([]);

    const orderIds = orders.map((o) => o.order_id);
    const [items] = await db.query(
      "SELECT * FROM customer_order_item WHERE order_id IN (?)",
      [orderIds]
    );

    const fullOrders = orders.map((o) => ({
      ...o,
      items: items.filter((i) => i.order_id === o.order_id),
    }));

    res.json(fullOrders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ: รายการเบอร์โทรศัพท์ของตนเองที่มีอยู่ในระบบสำหรับเลือกกรอกสั่งซื้อ (เฉพาะบัญชีที่เข้าสู่ระบบ)
app.get("/api/customer-orders/existing-phones", requireAuth, async (req, res) => {
  try {
    const currentUsername = (req.user?.username || "").trim();
    const currentUserId = req.user?.id !== undefined ? String(req.user.id).trim() : null;

    // 1. ดึงข้อมูลเบอร์โทรของตนเองจากตาราง nisit และ member_profile
    const [myProfiles] = await db.query(
      `SELECT 
        n.nisit_id,
        n.username,
        n.name,
        COALESCE(NULLIF(n.phone, ''), p.phone) AS phone,
        p.gift_address,
        p.points
      FROM nisit n
      LEFT JOIN member_profile p ON n.username = p.username
      WHERE (n.username IS NOT NULL AND LOWER(TRIM(n.username)) = LOWER(?))
         OR (n.nisit_id IS NOT NULL AND n.nisit_id = ?)
      LIMIT 1`,
      [currentUsername, currentUserId]
    );

    // 2. ดึงประวัติเบอร์โทรและที่อยู่ที่ตนเองเคยใช้สั่งซื้อใน customer_order
    let pastOrders = [];
    try {
      const [orderRows] = await db.query(
        `SELECT DISTINCT customer_name, customer_phone, shipping_address
        FROM customer_order
        WHERE (LOWER(TRIM(customer_username)) = LOWER(?) OR customer_id = ?)
          AND customer_phone IS NOT NULL AND customer_phone != ''
        ORDER BY order_id DESC LIMIT 10`,
        [currentUsername, currentUserId]
      );
      pastOrders = orderRows;
    } catch (e) {
      // ignore
    }

    const phoneMap = new Map();

    // เพิ่มเบอร์หลักของตนเอง
    myProfiles.forEach((m) => {
      const cleanPhone = (m.phone || "").replace(/\D/g, "");
      if (cleanPhone) {
        phoneMap.set(cleanPhone, {
          phone: cleanPhone,
          name: m.name || m.username || "",
          username: m.username || "",
          address: m.gift_address || "",
          points: m.points || 0,
          source: "เบอร์หลักในโปรไฟล์ของฉัน",
        });
      }
    });

    // หากใน token/session มี phone เพิ่มเติม
    const userPhoneClean = (req.user?.phone || "").replace(/\D/g, "");
    if (userPhoneClean && !phoneMap.has(userPhoneClean)) {
      phoneMap.set(userPhoneClean, {
        phone: userPhoneClean,
        name: req.user.name || req.user.username || "",
        username: currentUsername,
        address: "",
        points: 0,
        source: "เบอร์ของฉัน",
      });
    }

    // เพิ่มเบอร์ที่ตนเองเคยใช้สั่งซื้อในออเดอร์ก่อนหน้า
    pastOrders.forEach((o) => {
      const cleanPhone = (o.customer_phone || "").replace(/\D/g, "");
      if (cleanPhone && !phoneMap.has(cleanPhone)) {
        phoneMap.set(cleanPhone, {
          phone: cleanPhone,
          name: o.customer_name || req.user.name || "",
          username: currentUsername,
          address: o.shipping_address || "",
          points: 0,
          source: "เบอร์ที่เคยใช้สั่งซื้อ",
        });
      }
    });

    res.json(Array.from(phoneMap.values()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ: ดึงข้อมูลคำสั่งซื้อรายออเดอร์
app.get("/api/customer-orders/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const [orders] = await db.query(
      "SELECT * FROM customer_order WHERE order_id = ? OR order_no = ? LIMIT 1",
      [id, id]
    );
    if (orders.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลคำสั่งซื้อนี้" });
    }
    const order = orders[0];

    // ตรวจสอบสิทธิ์
    if (
      !isAdmin(req.user) &&
      req.user.username !== order.customer_username &&
      String(req.user.id) !== String(order.customer_id)
    ) {
      return res.status(403).json({ message: "คุณไม่มีสิทธิ์เข้าถึงคำสั่งซื้อนี้" });
    }

    const [items] = await db.query(
      "SELECT * FROM customer_order_item WHERE order_id = ?",
      [order.order_id]
    );
    res.json({ ...order, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE: อัปเดตสถานะคำสั่งซื้อ (พนักงานขาย / Admin อนุมัติ ยืนยันสินค้า หรือยกเลิก)
app.put("/api/customer-orders/:id/status", requireAuth, async (req, res) => {
  try {
    const isSalesOrAdmin =
      isAdmin(req.user) ||
      req.user?.username === "admin2" ||
      (req.user?.role && (req.user.role.includes("sales") || req.user.role.includes("ขาย")));

    if (!isSalesOrAdmin) {
      return res.status(403).json({
        message: "เฉพาะพนักงานขายหรือผู้ดูแลระบบเท่านั้นที่สามารถอนุมัติคำสั่งซื้อได้",
      });
    }

    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: "กรุณาระบุสถานะ" });

    await db.query(
      "UPDATE customer_order SET status = ? WHERE order_id = ? OR order_no = ?",
      [status, id, id]
    );
    res.json({ message: "อัปเดตสถานะสำเร็จ", status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ============================================================================
// ระบบส่วนขยายตามบทบาท 3.1 - 3.5
// 3.1 เจ้าของร้าน: อนุมัติจัดส่งของขวัญเทศกาลปีใหม่และวันเกิด + ค้นหาตามเงื่อนไข
// 3.2 ผู้จัดการ: มอบหมายงานและติดตามความก้าวหน้าการทำงานของพนักงาน + ค้นหาตามเงื่อนไข
// 3.3 พนักงานขาย: ค้นหาข้อมูลสมาชิก ตรวจสอบแต้มสะสม และบันทึกสมัครสมาชิกใหม่
// 3.4 พนักงานสต็อก/คลังสินค้า: รับสินค้าเข้าคลัง ตรวจสอบ QC บันทึกสินค้าชำรุด + ควบคุมโกดัง (1 หมวดหมู่ : 1 โกดัง)
// 3.5 ลูกค้า/สมาชิก: สะสมแต้ม (ซื้อ 50 บาท ได้ 5 แต้ม), แจ้งวันเกิดและที่อยู่รับของขวัญ, ตรวจสอบแต้มสะสมคงเหลือ
// ============================================================================

const getActiveMemberTable = async (connOrDb = db) => {
  try {
    await connOrDb.query("SELECT 1 FROM nisit LIMIT 1");
    return "nisit";
  } catch (e) {
    return "member";
  }
};

const initRoleSystemTables = async () => {
  try {
    // 1. ตารางข้อมูลเสริมของสมาชิก (แต้มสะสม, ยอดซื้อสะสม, ยอดเงินในบัญชีผู้ใช้งาน, วันเกิด, ที่อยู่จัดส่งของขวัญ)
    await db.query(`
      CREATE TABLE IF NOT EXISTS member_profile (
        profile_id INT AUTO_INCREMENT PRIMARY KEY,
        nisit_id VARCHAR(50) DEFAULT NULL,
        username VARCHAR(100) NOT NULL UNIQUE,
        member_name VARCHAR(150) DEFAULT NULL,
        phone VARCHAR(30) DEFAULT NULL,
        points INT NOT NULL DEFAULT 0,
        total_spent DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        wallet_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        birth_date DATE DEFAULT NULL,
        gift_address TEXT DEFAULT NULL,
        newyear_gift_opt_in TINYINT(1) NOT NULL DEFAULT 1,
        birthday_gift_opt_in TINYINT(1) NOT NULL DEFAULT 1,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // ตรวจสอบคอลัมน์ wallet_balance สำหรับตารางที่มีอยู่แล้ว
    try {
      await db.query("ALTER TABLE member_profile ADD COLUMN wallet_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00");
    } catch (e) {}

    // ตารางประวัติความเคลื่อนไหวยอดเงินในบัญชีของผู้ใช้งาน (เติมเงิน, ชำระเงิน, ปรับปรุงยอด)
    await db.query(`
      CREATE TABLE IF NOT EXISTS wallet_history (
        history_id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        nisit_id VARCHAR(50) DEFAULT NULL,
        member_name VARCHAR(150) DEFAULT NULL,
        type VARCHAR(30) NOT NULL DEFAULT 'topup',
        amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        balance_after DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        note VARCHAR(255) DEFAULT NULL,
        operator VARCHAR(100) DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 2. ตารางประวัติการสะสมแต้ม (ซื้อ 50 บาท ได้รับ 5 แต้ม)
    await db.query(`
      CREATE TABLE IF NOT EXISTS point_history (
        history_id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        nisit_id VARCHAR(50) DEFAULT NULL,
        member_name VARCHAR(150) DEFAULT NULL,
        reference_no VARCHAR(60) DEFAULT NULL,
        channel VARCHAR(60) NOT NULL DEFAULT 'สั่งซื้อสินค้า',
        purchase_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        points_change INT NOT NULL DEFAULT 0,
        points_balance INT NOT NULL DEFAULT 0,
        note VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 3. ตาราง 3.1 & 3.5: การจัดส่งและอนุมัติของขวัญเทศกาลปีใหม่และวันเกิด
    await db.query(`
      CREATE TABLE IF NOT EXISTS gift_delivery (
        gift_id INT AUTO_INCREMENT PRIMARY KEY,
        gift_no VARCHAR(50) NOT NULL UNIQUE,
        nisit_id VARCHAR(50) DEFAULT NULL,
        username VARCHAR(100) NOT NULL,
        member_name VARCHAR(150) NOT NULL,
        phone VARCHAR(50) DEFAULT NULL,
        birth_date DATE DEFAULT NULL,
        gift_type VARCHAR(50) NOT NULL DEFAULT 'เทศกาลปีใหม่',
        gift_item VARCHAR(255) NOT NULL DEFAULT 'ชุดของขวัญพรีเมียมประจำปี',
        shipping_address TEXT NOT NULL,
        member_points INT NOT NULL DEFAULT 0,
        status VARCHAR(50) NOT NULL DEFAULT 'รออนุมัติ',
        tracking_no VARCHAR(100) DEFAULT NULL,
        approved_by VARCHAR(100) DEFAULT NULL,
        approved_at DATETIME DEFAULT NULL,
        note TEXT DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 4. ตาราง 3.2: การมอบหมายงานและติดตามความก้าวหน้าการทำงานของพนักงาน
    await db.query(`
      CREATE TABLE IF NOT EXISTS staff_task (
        task_id INT AUTO_INCREMENT PRIMARY KEY,
        task_no VARCHAR(50) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        description TEXT DEFAULT NULL,
        assigned_to VARCHAR(100) NOT NULL,
        staff_name VARCHAR(150) NOT NULL,
        staff_role VARCHAR(100) NOT NULL DEFAULT 'พนักงานขาย',
        priority VARCHAR(50) NOT NULL DEFAULT 'ปานกลาง',
        progress INT NOT NULL DEFAULT 0,
        status VARCHAR(50) NOT NULL DEFAULT 'รอดำเนินการ',
        due_date DATE DEFAULT NULL,
        assigned_by VARCHAR(100) DEFAULT 'ผู้จัดการ (admin4)',
        remark TEXT DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 5. ตาราง 3.4 ข้อ 4: โกดังจัดเก็บสินค้าตามเงื่อนไขหมวดหมู่สินค้า (1 หมวดหมู่ : 1 โกดัง)
    await db.query(`
      CREATE TABLE IF NOT EXISTS warehouse_location (
        warehouse_id INT AUTO_INCREMENT PRIMARY KEY,
        warehouse_code VARCHAR(50) NOT NULL UNIQUE,
        warehouse_name VARCHAR(150) NOT NULL,
        category VARCHAR(100) NOT NULL UNIQUE,
        zone_detail VARCHAR(150) DEFAULT 'โซนมาตรฐาน A',
        max_capacity INT NOT NULL DEFAULT 500,
        manager_name VARCHAR(100) DEFAULT 'พนักงานคลังสินค้า (admin3)',
        status VARCHAR(50) NOT NULL DEFAULT 'พร้อมใช้งาน',
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 6. ตาราง 3.4 ข้อ 3: การรับสินค้าเข้าคลัง ตรวจสอบ QC และบันทึกสินค้าชำรุด/เสียหาย
    await db.query(`
      CREATE TABLE IF NOT EXISTS stock_qc_log (
        qc_id INT AUTO_INCREMENT PRIMARY KEY,
        qc_no VARCHAR(50) NOT NULL UNIQUE,
        order_no VARCHAR(50) DEFAULT NULL,
        product_id VARCHAR(50) NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        warehouse_code VARCHAR(50) NOT NULL,
        warehouse_name VARCHAR(150) NOT NULL,
        received_qty INT NOT NULL DEFAULT 0,
        passed_qty INT NOT NULL DEFAULT 0,
        damaged_qty INT NOT NULL DEFAULT 0,
        damage_reason TEXT DEFAULT NULL,
        qc_status VARCHAR(50) NOT NULL DEFAULT 'ผ่าน QC ทั้งหมด',
        inspector VARCHAR(100) DEFAULT 'พนักงานสต็อก (admin3)',
        inspected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // สร้างข้อมูลเริ่มต้น (Seed Data) หากตารางยังว่างอยู่ เพื่อให้ทดสอบได้ทันที
    await seedInitialRoleData();
  } catch (err) {
    console.error("สร้างตารางระบบบทบาท 3.1-3.5 ไม่สำเร็จ:", err.message);
  }
};

const seedInitialRoleData = async () => {
  try {
    const table = await getActiveMemberTable();

    // ตรวจสอบว่ามีบัญชี admin1 - admin4 หรือยัง (ถ้ายังไม่มีให้เพิ่มโดยไม่ทับของเดิม)
    const defaultAdmins = [
      { id: "9000000001", name: "เจ้าของกิจการ (Owner)", username: "admin1", phone: "0811111111" },
      { id: "9000000002", name: "พนักงานขาย (Sales)", username: "admin2", phone: "0822222222" },
      { id: "9000000003", name: "พนักงานสต็อก (Stock)", username: "admin3", phone: "0833333333" },
      { id: "9000000004", name: "ผู้จัดการ (Manager)", username: "admin4", phone: "0844444444" },
    ];
    for (const adm of defaultAdmins) {
      try {
        const [ex] = await db.query(`SELECT 1 FROM ${table} WHERE username = ? LIMIT 1`, [adm.username]);
        if (ex.length === 0) {
          await db.query(
            `INSERT INTO ${table} (nisit_id, name, username, password, phone, status) VALUES (?, ?, ?, '1234', ?, 'ใช้งาน')`,
            [adm.id, adm.name, adm.username, adm.phone]
          );
        }
      } catch (e) {}
    }

    // ซิงค์สมาชิกที่มีอยู่เข้า member_profile
    try {
      const [members] = await db.query(`SELECT * FROM ${table}`);
      for (let i = 0; i < members.length; i++) {
        const m = members[i];
        if (!m.username) continue;
        const [prof] = await db.query("SELECT 1 FROM member_profile WHERE username = ? LIMIT 1", [m.username]);
        if (prof.length === 0) {
          const samplePoints = 0;
          const sampleSpent = 0;
          const sampleMonth = String(((i % 12) + 1)).padStart(2, "0");
          const sampleBirth = `2002-${sampleMonth}-15`;
          const sampleAddr = `${100 + i}/9 หมู่ 8 ต.ท่าโพธิ์ อ.เมือง จ.พิษณุโลก 65000`;
          await db.query(
            `INSERT INTO member_profile (nisit_id, username, member_name, phone, points, total_spent, birth_date, gift_address)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [m.nisit_id || m.id || null, m.username, m.name || m.username, m.phone || "0891234567", samplePoints, sampleSpent, sampleBirth, sampleAddr]
          );
        }
      }
    } catch (e) {}

    // Seed 3.1 ของขวัญปีใหม่และวันเกิด (ถ้ายังว่าง)
    const [giftCount] = await db.query("SELECT COUNT(*) AS cnt FROM gift_delivery");
    if ((giftCount[0]?.cnt || 0) === 0) {
      const [profiles] = await db.query("SELECT * FROM member_profile LIMIT 5");
      const sampleGifts = [
        {
          gift_no: "GIFT-2026-001",
          nisit_id: profiles[0]?.nisit_id || "65000001",
          username: profiles[0]?.username || "member1",
          member_name: profiles[0]?.member_name || "คุณสมชาย ใจดี",
          phone: profiles[0]?.phone || "0812345678",
          birth_date: profiles[0]?.birth_date || "2001-11-20",
          gift_type: "เทศกาลปีใหม่",
          gift_item: "กระเช้าของขวัญพรีเมียมสวัสดีปีใหม่ 2027",
          shipping_address: profiles[0]?.gift_address || "123/45 ถ.พิษณุโลก-นครสวรรค์ อ.เมือง จ.พิษณุโลก 65000",
          member_points: profiles[0]?.points || 120,
          status: "รออนุมัติ",
          tracking_no: null,
          note: "ลูกค้าสมาชิกแจ้งที่อยู่จัดส่งสำหรับเทศกาลปีใหม่",
        },
        {
          gift_no: "GIFT-2026-002",
          nisit_id: profiles[1]?.nisit_id || "65000002",
          username: profiles[1]?.username || "member2",
          member_name: profiles[1]?.member_name || "คุณกนกวรรณ สุขสันต์",
          phone: profiles[1]?.phone || "0898765432",
          birth_date: profiles[1]?.birth_date || "2002-11-15",
          gift_type: "วันเกิด",
          gift_item: "เซ็ตของขวัญสุขสันต์วันเกิด (Birthday Special Box)",
          shipping_address: profiles[1]?.gift_address || "88/12 หมู่ 4 ต.ในเมือง อ.เมือง จ.พิษณุโลก 65000",
          member_points: profiles[1]?.points || 85,
          status: "รออนุมัติ",
          tracking_no: null,
          note: "ครบรอบเดือนเกิดของลูกค้าสมาชิก",
        },
        {
          gift_no: "GIFT-2026-003",
          nisit_id: profiles[2]?.nisit_id || "65000003",
          username: profiles[2]?.username || "member3",
          member_name: profiles[2]?.member_name || "คุณธนภัทร รุ่งเรือง",
          phone: profiles[2]?.phone || "0865554433",
          birth_date: profiles[2]?.birth_date || "2000-05-10",
          gift_type: "เทศกาลปีใหม่",
          gift_item: "ชุดกิฟต์เซ็ตสมุดไดอารี่และปากกาพรีเมียม ปีใหม่",
          shipping_address: profiles[2]?.gift_address || "55/9 ซอยลาดพร้าว 15 เขตจตุจักร กรุงเทพฯ 10900",
          member_points: profiles[2]?.points || 200,
          status: "อนุมัติแล้ว",
          tracking_no: "TH-EMS-99283741",
          approved_by: "เจ้าของร้าน (admin1)",
          note: "อนุมัติจัดส่งของขวัญปีใหม่เรียบร้อยแล้ว",
        },
      ];

      for (const g of sampleGifts) {
        await db.query(
          `INSERT INTO gift_delivery 
           (gift_no, nisit_id, username, member_name, phone, birth_date, gift_type, gift_item, shipping_address, member_points, status, tracking_no, approved_by, approved_at, note)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            g.gift_no,
            g.nisit_id,
            g.username,
            g.member_name,
            g.phone,
            g.birth_date,
            g.gift_type,
            g.gift_item,
            g.shipping_address,
            g.member_points,
            g.status,
            g.tracking_no,
            g.approved_by || null,
            g.status === "อนุมัติแล้ว" ? new Date() : null,
            g.note,
          ]
        );
      }
    }

    // Seed 3.2 งานที่ผู้จัดการมอบหมายให้พนักงาน (ถ้ายังว่าง)
    const [taskCount] = await db.query("SELECT COUNT(*) AS cnt FROM staff_task");
    if ((taskCount[0]?.cnt || 0) === 0) {
      const today = new Date().toISOString().slice(0, 10);
      const sampleTasks = [
        {
          task_no: "TASK-2026-001",
          title: "ตรวจสอบแต้มสะสมของลูกค้าและเชิญชวนสมัครสมาชิกใหม่หน้าเคาน์เตอร์",
          description: "แนะนำโปรโมชั่นซื้อครบทุก 50 บาท รับ 5 แต้ม พร้อมบันทึกข้อมูลวันเกิดและที่อยู่รับของขวัญปีใหม่ให้ลูกค้า",
          assigned_to: "admin2",
          staff_name: "พนักงานขาย (admin2)",
          staff_role: "พนักงานขาย",
          priority: "สูง",
          progress: 75,
          status: "กำลังดำเนินการ",
          due_date: today,
          assigned_by: "ผู้จัดการร้าน (admin4)",
          remark: "ดำเนินการสมัครสมาชิกใหม่ไปแล้ว 12 ราย",
        },
        {
          task_no: "TASK-2026-002",
          title: "ตรวจรับสินค้าเข้าคลัง ตรวจสอบ QC และคัดแยกสินค้าชำรุดล็อตประจำสัปดาห์",
          description: "ตรวจสอบคุณภาพสินค้าที่รับเข้าคลังทุกชิ้น บันทึกรายการที่ชำรุดเสียหาย และจัดเก็บเข้าโกดังตามหมวดหมู่ (1 หมวดหมู่ : 1 โกดัง)",
          assigned_to: "admin3",
          staff_name: "พนักงานสต็อก/คลังสินค้า (admin3)",
          staff_role: "พนักงานสต็อก/คลังสินค้า",
          priority: "สูง",
          progress: 100,
          status: "เสร็จสิ้น",
          due_date: today,
          assigned_by: "ผู้จัดการร้าน (admin4)",
          remark: "ตรวจ QC เสร็จสมบูรณ์ คัดแยกสินค้าชำรุดออกเรียบร้อย",
        },
        {
          task_no: "TASK-2026-003",
          title: "จัดเรียงสต็อกสินค้าตามโกดังหมวดหมู่และตรวจสอบความจุโกดัง",
          description: "ตรวจสอบให้แน่ใจว่าสินค้า 1 หมวดหมู่ ถูกจัดเก็บใน 1 โกดังตามเงื่อนไขที่กำหนด ไม่ปะปนกัน",
          assigned_to: "admin3",
          staff_name: "พนักงานสต็อก/คลังสินค้า (admin3)",
          staff_role: "พนักงานสต็อก/คลังสินค้า",
          priority: "ปานกลาง",
          progress: 40,
          status: "กำลังดำเนินการ",
          due_date: today,
          assigned_by: "ผู้จัดการร้าน (admin4)",
          remark: "จัดโซนโกดัง WH-01 และ WH-02 เสร็จแล้ว กำลังจัดโซน WH-03",
        },
        {
          task_no: "TASK-2026-004",
          title: "สรุปยอดขายหน้าร้าน POS และตรวจสอบรายการของขวัญลูกค้าประจำเดือน",
          description: "รวบรวมรายชื่อลูกค้าที่แจ้งวันเกิดในเดือนนี้ส่งให้เจ้าของร้านพิจารณาอนุมัติของขวัญ",
          assigned_to: "admin2",
          staff_name: "พนักงานขาย (admin2)",
          staff_role: "พนักงานขาย",
          priority: "ปานกลาง",
          progress: 0,
          status: "รอดำเนินการ",
          due_date: today,
          assigned_by: "ผู้จัดการร้าน (admin4)",
          remark: "รอสรุปข้อมูลช่วงปิดร้าน",
        },
      ];

      for (const t of sampleTasks) {
        await db.query(
          `INSERT INTO staff_task
           (task_no, title, description, assigned_to, staff_name, staff_role, priority, progress, status, due_date, assigned_by, remark)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            t.task_no,
            t.title,
            t.description,
            t.assigned_to,
            t.staff_name,
            t.staff_role,
            t.priority,
            t.progress,
            t.status,
            t.due_date,
            t.assigned_by,
            t.remark,
          ]
        );
      }
    }

    // Seed 3.4 โกดังตามหมวดหมู่สินค้า (1 หมวดหมู่ : 1 โกดัง)
    await syncWarehousesWithCategories();

    // Seed 3.4 ประวัติการตรวจรับสินค้า QC (ถ้ายังว่าง)
    const [qcCount] = await db.query("SELECT COUNT(*) AS cnt FROM stock_qc_log");
    if ((qcCount[0]?.cnt || 0) === 0) {
      const [prods] = await db.query("SELECT * FROM product LIMIT 3");
      const [whs] = await db.query("SELECT * FROM warehouse_location");
      const whMap = new Map(whs.map((w) => [w.category, w]));

      if (prods.length > 0) {
        const p1 = prods[0];
        const w1 = whMap.get(p1.category) || whs[0] || { warehouse_code: "WH-01", warehouse_name: "โกดัง 1" };
        await db.query(
          `INSERT INTO stock_qc_log
           (qc_no, order_no, product_id, product_name, category, warehouse_code, warehouse_name, received_qty, passed_qty, damaged_qty, damage_reason, qc_status, inspector)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            "QC-2026-001",
            "PR-SAMPLE-01",
            p1.product_id,
            p1.name,
            p1.category || "ทั่วไป",
            w1.warehouse_code,
            w1.warehouse_name,
            50,
            48,
            2,
            "บรรจุภัณฑ์ฉีกขาดและตัวสินค้ามีรอยแตกจากการขนส่ง 2 ชิ้น",
            "พบสินค้าชำรุดบางส่วน",
            "พนักงานคลังสินค้า (admin3)",
          ]
        );
      }
      if (prods.length > 1) {
        const p2 = prods[1];
        const w2 = whMap.get(p2.category) || whs[0] || { warehouse_code: "WH-02", warehouse_name: "โกดัง 2" };
        await db.query(
          `INSERT INTO stock_qc_log
           (qc_no, order_no, product_id, product_name, category, warehouse_code, warehouse_name, received_qty, passed_qty, damaged_qty, damage_reason, qc_status, inspector)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            "QC-2026-002",
            "PR-SAMPLE-02",
            p2.product_id,
            p2.name,
            p2.category || "ทั่วไป",
            w2.warehouse_code,
            w2.warehouse_name,
            30,
            30,
            0,
            "- (สภาพสมบูรณ์ 100%)",
            "ผ่าน QC ทั้งหมด",
            "พนักงานคลังสินค้า (admin3)",
          ]
        );
      }
    }
  } catch (err) {
    console.warn("Seed initial role data warning:", err.message);
  }
};

// ซิงค์หมวดหมู่สินค้าให้ตรงกับโกดังตามกฎ 1 หมวดหมู่ : 1 โกดัง
const syncWarehousesWithCategories = async (connOrDb = db) => {
  try {
    const [products] = await connOrDb.query("SELECT DISTINCT category FROM product WHERE category IS NOT NULL AND TRIM(category) != ''");
    const categories = products.map((p) => p.category.trim());
    const defaultCats = ["เครื่องเขียน", "อุปกรณ์สำนักงาน", "อุปกรณ์ไอที", "กระดาษและสิ่งพิมพ์", "ทั่วไป"];
    const allCats = Array.from(new Set([...categories, ...defaultCats]));

    const [existingWh] = await connOrDb.query("SELECT * FROM warehouse_location ORDER BY warehouse_id ASC");
    const catSet = new Set(existingWh.map((w) => w.category));

    let nextIndex = existingWh.length + 1;
    for (const cat of allCats) {
      if (!catSet.has(cat)) {
        const whCode = `WH-${String(nextIndex).padStart(2, "0")}`;
        const whName = `โกดัง ${String.fromCharCode(64 + ((nextIndex - 1) % 26) + 1)}${nextIndex} (${cat})`;
        const zone = `อาคารคลังสินค้า โซน ${String.fromCharCode(64 + ((nextIndex - 1) % 26) + 1)}-${nextIndex}`;
        await connOrDb.query(
          `INSERT IGNORE INTO warehouse_location (warehouse_code, warehouse_name, category, zone_detail, max_capacity, manager_name, status)
           VALUES (?, ?, ?, ?, 500, 'พนักงานสต็อก (admin3)', 'พร้อมใช้งาน')`,
          [whCode, whName, cat, zone]
        );
        nextIndex++;
      }
    }
  } catch (err) {
    console.warn("syncWarehousesWithCategories warning:", err.message);
  }
};

// ฟังก์ชันคำนวณและเพิ่มแต้มสะสมให้ลูกค้าสมาชิก (ซื้อทุก 50 บาท ได้รับ 5 แต้ม)
async function awardMemberPoints(connOrDb, {
  username,
  nisit_id,
  memberName,
  phone,
  shippingAddress,
  purchaseAmount,
  pointsEarned,
  referenceNo,
  channel,
  note,
}) {
  const table = await getActiveMemberTable(connOrDb);
  let targetUsername = username ? String(username).trim() : "";
  let targetId = nisit_id ? String(nisit_id).trim() : "";
  let resolvedName = memberName || targetUsername || "สมาชิก";
  let resolvedPhone = phone || null;

  // ค้นหาสมาชิกจากตาราง nisit / member
  try {
    let mRows = [];
    if (targetUsername) {
      [mRows] = await connOrDb.query(`SELECT * FROM ${table} WHERE username = ? LIMIT 1`, [targetUsername]);
    }
    if (mRows.length === 0 && targetId) {
      [mRows] = await connOrDb.query(`SELECT * FROM ${table} WHERE nisit_id = ? OR phone = ? LIMIT 1`, [targetId, targetId]).catch(async () => {
        return await connOrDb.query(`SELECT * FROM ${table} WHERE nisit_id = ? LIMIT 1`, [targetId]);
      });
    }
    if (mRows.length === 0 && targetUsername) {
      // เผื่อพนักงานขายกรอกเบอร์โทรหรือชื่อหรือรหัสสมาชิกในช่องค้นหา
      [mRows] = await connOrDb.query(
        `SELECT * FROM ${table} WHERE nisit_id = ? OR phone = ? OR name = ? LIMIT 1`,
        [targetUsername, targetUsername, targetUsername]
      );
    }
    if (mRows.length > 0) {
      targetUsername = mRows[0].username;
      targetId = mRows[0].nisit_id || mRows[0].id || targetId;
      resolvedName = mRows[0].name || resolvedName;
      resolvedPhone = mRows[0].phone || resolvedPhone;
    }
  } catch (e) {}

  if (!targetUsername) return null;

  const amt = parseFloat(purchaseAmount) || 0;
  const pts = pointsEarned !== undefined ? parseInt(pointsEarned, 10) : Math.floor(amt / 50) * 5;

  const [existing] = await connOrDb.query(
    "SELECT * FROM member_profile WHERE username = ? LIMIT 1",
    [targetUsername]
  );

  let newBalance = pts;
  if (existing.length === 0) {
    await connOrDb.query(
      `INSERT INTO member_profile (nisit_id, username, member_name, phone, points, total_spent, gift_address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [targetId || null, targetUsername, resolvedName, resolvedPhone, pts, amt, shippingAddress || null]
    );
  } else {
    const currPts = parseInt(existing[0].points, 10) || 0;
    const currSpent = parseFloat(existing[0].total_spent) || 0;
    newBalance = currPts + pts;
    const newSpent = currSpent + amt;
    const newAddr = shippingAddress || existing[0].gift_address || null;
    await connOrDb.query(
      `UPDATE member_profile
       SET points = ?, total_spent = ?, member_name = ?, phone = COALESCE(?, phone), gift_address = COALESCE(?, gift_address)
       WHERE username = ?`,
      [newBalance, newSpent, resolvedName, resolvedPhone, newAddr, targetUsername]
    );
  }

  // บันทึกประวัติแต้มสะสม
  await connOrDb.query(
    `INSERT INTO point_history (username, nisit_id, member_name, reference_no, channel, purchase_amount, points_change, points_balance, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      targetUsername,
      targetId || null,
      resolvedName,
      referenceNo || "-",
      channel || "ซื้อสินค้า",
      amt,
      pts,
      newBalance,
      note || `ซื้อสินค้ายอด ${amt.toFixed(2)} บาท (รับ ${pts} แต้ม)`,
    ]
  );

  // อัปเดตแต้มใน gift_delivery ของสมาชิกคนนี้ด้วย
  await connOrDb.query(
    "UPDATE gift_delivery SET member_points = ? WHERE username = ?",
    [newBalance, targetUsername]
  ).catch(() => {});

  return {
    username: targetUsername,
    nisit_id: targetId,
    member_name: resolvedName,
    earned_points: pts,
    points_balance: newBalance,
  };
}

initRoleSystemTables();


// ============================================================================
// 3.1 API สำหรับเจ้าของร้าน (Owner): อนุมัติการจัดส่งของขวัญเทศกาลปีใหม่และวันเกิด + ค้นหาตามเงื่อนไข
// ============================================================================

app.get("/api/owner/gifts", requireAuth, async (req, res) => {
  try {
    const { search, gift_type, status, birth_month, min_points } = req.query;

    const [rows] = await db.query("SELECT * FROM gift_delivery ORDER BY gift_id DESC");

    let filtered = rows.filter((g) => {
      if (gift_type && gift_type !== "all" && g.gift_type !== gift_type) return false;
      if (status && status !== "all" && g.status !== status) return false;
      if (min_points && Number(g.member_points || 0) < Number(min_points)) return false;
      if (birth_month && birth_month !== "all") {
        if (!g.birth_date) return false;
        const m = new Date(g.birth_date).getMonth() + 1;
        if (String(m) !== String(birth_month)) return false;
      }
      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        const match =
          (g.gift_no || "").toLowerCase().includes(q) ||
          (g.member_name || "").toLowerCase().includes(q) ||
          (g.username || "").toLowerCase().includes(q) ||
          (g.nisit_id || "").toLowerCase().includes(q) ||
          (g.phone || "").toLowerCase().includes(q) ||
          (g.shipping_address || "").toLowerCase().includes(q) ||
          (g.gift_item || "").toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });

    const summary = {
      total: rows.length,
      pending: rows.filter((r) => r.status === "รออนุมัติ").length,
      approved: rows.filter((r) => r.status === "อนุมัติแล้ว").length,
      shipped: rows.filter((r) => r.status === "จัดส่งสำเร็จ").length,
      rejected: rows.filter((r) => r.status === "ไม่อนุมัติ").length,
      newYearCount: rows.filter((r) => r.gift_type === "เทศกาลปีใหม่").length,
      birthdayCount: rows.filter((r) => r.gift_type === "วันเกิด").length,
    };

    res.json({ summary, gifts: filtered });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// สร้างรายการจัดส่งของขวัญใหม่ (โดยเจ้าของร้าน หรือระบบ)
app.post("/api/owner/gifts", requireAuth, async (req, res) => {
  try {
    const {
      username,
      nisit_id,
      member_name,
      phone,
      birth_date,
      gift_type,
      gift_item,
      shipping_address,
      note,
      auto_approve,
    } = req.body || {};

    if (!member_name || !shipping_address) {
      return res.status(400).json({ message: "กรุณาระบุชื่อสมาชิกและที่อยู่จัดส่งของขวัญ" });
    }

    let pts = 0;
    if (username) {
      const [prof] = await db.query("SELECT points, birth_date FROM member_profile WHERE username = ? LIMIT 1", [username]);
      if (prof.length > 0) pts = prof[0].points || 0;
    }

    const giftNo = `GIFT-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;
    const status = auto_approve ? "อนุมัติแล้ว" : "รออนุมัติ";
    const approvedBy = auto_approve ? (req.user.name || req.user.username) : null;
    const approvedAt = auto_approve ? new Date() : null;

    const [result] = await db.query(
      `INSERT INTO gift_delivery
       (gift_no, nisit_id, username, member_name, phone, birth_date, gift_type, gift_item, shipping_address, member_points, status, approved_by, approved_at, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        giftNo,
        nisit_id || null,
        username || "member",
        member_name.trim(),
        phone || null,
        birth_date || null,
        gift_type || "เทศกาลปีใหม่",
        gift_item || (gift_type === "วันเกิด" ? "เซ็ตของขวัญสุขสันต์วันเกิด" : "ชุดของขวัญพรีเมียมเทศกาลปีใหม่"),
        shipping_address.trim(),
        pts,
        status,
        approvedBy,
        approvedAt,
        note || null,
      ]
    );

    res.status(201).json({
      message: "บันทึกรายการจัดส่งของขวัญสำเร็จ",
      gift_id: result.insertId,
      gift_no: giftNo,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// อนุมัติ / อัปเดตสถานะการจัดส่งของขวัญปีใหม่และวันเกิด
app.put("/api/owner/gifts/:id/approve", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, tracking_no, gift_item, note } = req.body || {};
    const newStatus = status || "อนุมัติแล้ว";
    const approver = req.user.name || req.user.username || "เจ้าของร้าน";

    const [existing] = await db.query(
      "SELECT * FROM gift_delivery WHERE gift_id = ? OR gift_no = ? LIMIT 1",
      [id, id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: "ไม่พบรายการของขวัญนี้" });
    }

    const curr = existing[0];
    const finalTracking =
      tracking_no !== undefined
        ? tracking_no
        : curr.tracking_no || (newStatus === "อนุมัติแล้ว" || newStatus === "จัดส่งสำเร็จ" ? `TH-GIFT-${Date.now().toString().slice(-6)}` : null);

    await db.query(
      `UPDATE gift_delivery
       SET status = ?, tracking_no = ?, gift_item = ?, note = ?, approved_by = ?, approved_at = NOW()
       WHERE gift_id = ?`,
      [
        newStatus,
        finalTracking,
        gift_item || curr.gift_item,
        note !== undefined ? note : curr.note,
        approver,
        curr.gift_id,
      ]
    );

    res.json({
      message: `อัปเดตสถานะเป็น "${newStatus}" สำเร็จ`,
      gift_id: curr.gift_id,
      status: newStatus,
      tracking_no: finalTracking,
      approved_by: approver,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/owner/gifts/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM gift_delivery WHERE gift_id = ? OR gift_no = ?", [id, id]);
    res.json({ message: "ลบรายการของขวัญสำเร็จ" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ============================================================================
// 3.2 API สำหรับผู้จัดการ (Manager): มอบหมายงานและติดตามความก้าวหน้าการทำงานของพนักงาน + ค้นหาตามเงื่อนไข
// ============================================================================

app.get("/api/manager/tasks", requireAuth, async (req, res) => {
  try {
    const { search, staff_role, status, priority, assigned_to } = req.query;
    const [rows] = await db.query("SELECT * FROM staff_task ORDER BY task_id DESC");

    const filtered = rows.filter((t) => {
      if (staff_role && staff_role !== "all" && t.staff_role !== staff_role) return false;
      if (status && status !== "all" && t.status !== status) return false;
      if (priority && priority !== "all" && t.priority !== priority) return false;
      if (assigned_to && assigned_to !== "all" && t.assigned_to !== assigned_to) return false;
      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        const match =
          (t.task_no || "").toLowerCase().includes(q) ||
          (t.title || "").toLowerCase().includes(q) ||
          (t.description || "").toLowerCase().includes(q) ||
          (t.staff_name || "").toLowerCase().includes(q) ||
          (t.assigned_to || "").toLowerCase().includes(q) ||
          (t.remark || "").toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });

    const avgProgress =
      rows.length > 0
        ? Math.round(rows.reduce((sum, r) => sum + (Number(r.progress) || 0), 0) / rows.length)
        : 0;

    const summary = {
      total: rows.length,
      pending: rows.filter((r) => r.status === "รอดำเนินการ").length,
      inProgress: rows.filter((r) => r.status === "กำลังดำเนินการ").length,
      completed: rows.filter((r) => r.status === "เสร็จสิ้น").length,
      delayed: rows.filter((r) => r.status === "ล่าช้า").length,
      avgProgress,
    };

    res.json({ summary, tasks: filtered });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// มอบหมายงานใหม่ให้พนักงาน
app.post("/api/manager/tasks", requireAuth, async (req, res) => {
  try {
    const {
      title,
      description,
      assigned_to,
      staff_name,
      staff_role,
      priority,
      due_date,
      remark,
    } = req.body || {};

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "กรุณาระบุหัวข้องานที่มอบหมาย" });
    }

    const taskNo = `TASK-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const assignedBy = req.user.name || req.user.username || "ผู้จัดการ";

    const [result] = await db.query(
      `INSERT INTO staff_task
       (task_no, title, description, assigned_to, staff_name, staff_role, priority, progress, status, due_date, assigned_by, remark)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'รอดำเนินการ', ?, ?, ?)`,
      [
        taskNo,
        title.trim(),
        description || "",
        assigned_to || "admin2",
        staff_name || "พนักงานขาย (admin2)",
        staff_role || "พนักงานขาย",
        priority || "ปานกลาง",
        due_date || new Date().toISOString().slice(0, 10),
        assignedBy,
        remark || "",
      ]
    );

    res.status(201).json({
      message: "มอบหมายงานให้พนักงานสำเร็จ",
      task_id: result.insertId,
      task_no: taskNo,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// อัปเดตความก้าวหน้าการทำงาน (Progress %) และสถานะงาน
app.put("/api/manager/tasks/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, assigned_to, staff_name, staff_role, priority, progress, status, due_date, remark } = req.body || {};

    const [rows] = await db.query("SELECT * FROM staff_task WHERE task_id = ? OR task_no = ? LIMIT 1", [id, id]);
    if (rows.length === 0) return res.status(404).json({ message: "ไม่พบรายการงานนี้" });

    const curr = rows[0];
    let newProgress = progress !== undefined ? Math.min(100, Math.max(0, parseInt(progress, 10) || 0)) : curr.progress;
    let newStatus = status || curr.status;

    // ปรับสถานะอัตโนมัติตาม % ความก้าวหน้า
    if (progress !== undefined && !status) {
      if (newProgress >= 100) newStatus = "เสร็จสิ้น";
      else if (newProgress > 0) newStatus = "กำลังดำเนินการ";
      else newStatus = "รอดำเนินการ";
    } else if (status === "เสร็จสิ้น") {
      newProgress = 100;
    } else if (status === "รอดำเนินการ" && progress === undefined) {
      newProgress = 0;
    }

    await db.query(
      `UPDATE staff_task
       SET title = ?, description = ?, assigned_to = ?, staff_name = ?, staff_role = ?,
           priority = ?, progress = ?, status = ?, due_date = ?, remark = ?
       WHERE task_id = ?`,
      [
        title !== undefined ? title : curr.title,
        description !== undefined ? description : curr.description,
        assigned_to !== undefined ? assigned_to : curr.assigned_to,
        staff_name !== undefined ? staff_name : curr.staff_name,
        staff_role !== undefined ? staff_role : curr.staff_role,
        priority !== undefined ? priority : curr.priority,
        newProgress,
        newStatus,
        due_date !== undefined ? due_date : curr.due_date,
        remark !== undefined ? remark : curr.remark,
        curr.task_id,
      ]
    );

    res.json({
      message: "อัปเดตความก้าวหน้าของงานสำเร็จ",
      task_id: curr.task_id,
      progress: newProgress,
      status: newStatus,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/manager/tasks/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM staff_task WHERE task_id = ? OR task_no = ?", [id, id]);
    res.json({ message: "ลบรายการงานสำเร็จ" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ============================================================================
// 3.3 API สำหรับพนักงานขาย (Sales Staff): ค้นหาข้อมูลสมาชิก ตรวจสอบแต้มสะสม และบันทึกสมัครสมาชิกใหม่
// ============================================================================

app.get("/api/sales-staff/members", requireAuth, async (req, res) => {
  try {
    const { search, status, min_points, birth_month } = req.query;
    const table = await getActiveMemberTable();

    const [members] = await db.query(`SELECT * FROM ${table} ORDER BY nisit_id ASC`).catch(async () => {
      return await db.query(`SELECT * FROM ${table}`);
    });
    const [profiles] = await db.query("SELECT * FROM member_profile");
    const [histories] = await db.query("SELECT * FROM point_history ORDER BY history_id DESC LIMIT 300");

    const profileMap = new Map(profiles.map((p) => [p.username, p]));

    let combined = members.map((m) => {
      const prof = profileMap.get(m.username) || {};
      const memberHist = histories.filter((h) => h.username === m.username);
      return {
        nisit_id: m.nisit_id || m.id,
        name: m.name,
        username: m.username,
        phone: m.phone || prof.phone || "-",
        status: m.status || "ใช้งาน",
        points: Number(prof.points || 0),
        total_spent: Number(prof.total_spent || 0),
        birth_date: prof.birth_date || null,
        gift_address: prof.gift_address || "",
        point_history: memberHist,
      };
    });

    if (status && status !== "all") {
      combined = combined.filter((m) => m.status === status);
    }
    if (min_points !== undefined && min_points !== "") {
      combined = combined.filter((m) => m.points >= Number(min_points));
    }
    if (birth_month && birth_month !== "all") {
      combined = combined.filter((m) => {
        if (!m.birth_date) return false;
        return String(new Date(m.birth_date).getMonth() + 1) === String(birth_month);
      });
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      combined = combined.filter(
        (m) =>
          String(m.nisit_id || "").toLowerCase().includes(q) ||
          (m.name || "").toLowerCase().includes(q) ||
          (m.username || "").toLowerCase().includes(q) ||
          (m.phone || "").toLowerCase().includes(q) ||
          (m.gift_address || "").toLowerCase().includes(q)
      );
    }

    res.json(combined);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// พนักงานขายบันทึกสมัครสมาชิกใหม่ พร้อมตั้งค่าวันเกิด ที่อยู่จัดส่งของขวัญ และแต้มเริ่มต้น
app.post("/api/sales-staff/members", requireAuth, async (req, res) => {
  try {
    const {
      nisit_id,
      name,
      username,
      password,
      phone,
      birth_date,
      gift_address,
      initial_points = 0,
    } = req.body || {};

    if (!name?.trim() || !username?.trim()) {
      return res.status(400).json({ message: "กรุณากรอกชื่อ-นามสกุล และ Username ของสมาชิกใหม่" });
    }

    const cleanPhone = phone ? String(phone).replace(/\D/g, "") : "";
    if (cleanPhone && cleanPhone.length !== 10) {
      return res.status(400).json({ message: "เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลักเท่านั้น" });
    }

    const table = await getActiveMemberTable();
    const [exists] = await db.query(`SELECT 1 FROM ${table} WHERE username = ? LIMIT 1`, [username.trim()]);
    if (exists.length > 0) {
      return res.status(409).json({ message: "Username นี้ถูกใช้งานแล้ว กรุณาใช้ชื่ออื่น" });
    }

    const finalId = nisit_id?.trim() || Date.now().toString().slice(-10);
    const finalPass = password || "1234";

    await db.query(
      `INSERT INTO ${table} (nisit_id, name, username, password, phone, status) VALUES (?, ?, ?, ?, ?, 'ใช้งาน')`,
      [finalId, name.trim(), username.trim(), finalPass, cleanPhone || null]
    );

    const initPts = Math.max(0, parseInt(initial_points, 10) || 0);
    await db.query(
      `INSERT INTO member_profile (nisit_id, username, member_name, phone, points, total_spent, birth_date, gift_address)
       VALUES (?, ?, ?, ?, ?, 0.00, ?, ?)
       ON DUPLICATE KEY UPDATE member_name = VALUES(member_name), phone = VALUES(phone), birth_date = VALUES(birth_date), gift_address = VALUES(gift_address)`,
      [finalId, username.trim(), name.trim(), cleanPhone || null, initPts, birth_date || null, gift_address || null]
    );

    if (initPts > 0) {
      await db.query(
        `INSERT INTO point_history (username, nisit_id, member_name, reference_no, channel, purchase_amount, points_change, points_balance, note)
         VALUES (?, ?, ?, 'NEW-MEMBER', 'สมัครสมาชิกใหม่', 0, ?, ?, 'คะแนนต้อนรับสมาชิกใหม่')`,
        [username.trim(), finalId, name.trim(), initPts, initPts]
      );
    }

    // หากระบุที่อยู่รับของขวัญไว้ ให้สร้างคำขอของขวัญปีใหม่เข้าคิวรออนุมัติให้เจ้าของร้านด้วย
    if (gift_address && gift_address.trim()) {
      const giftNo = `GIFT-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;
      await db.query(
        `INSERT INTO gift_delivery
         (gift_no, nisit_id, username, member_name, phone, birth_date, gift_type, gift_item, shipping_address, member_points, status, note)
         VALUES (?, ?, ?, ?, ?, ?, 'เทศกาลปีใหม่', 'ชุดของขวัญต้อนรับสมาชิกใหม่ & เทศกาลปีใหม่', ?, ?, 'รออนุมัติ', 'บันทึกจากหน้าสมัครสมาชิกใหม่โดยพนักงานขาย')`,
        [giftNo, finalId, username.trim(), name.trim(), cleanPhone || null, birth_date || null, gift_address.trim(), initPts]
      ).catch(() => {});
    }

    res.status(201).json({
      message: "บันทึกสมัครสมาชิกใหม่สำเร็จ",
      member: {
        nisit_id: finalId,
        name: name.trim(),
        username: username.trim(),
        phone: cleanPhone,
        points: initPts,
        birth_date: birth_date || null,
        gift_address: gift_address || "",
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ============================================================================
// 3.4 API สำหรับพนักงานสต็อก / คลังสินค้า (Warehouse & Stock QC)
// - จัดการข้อมูลการรับสินค้าเข้าคลัง ตรวจสอบ QC และบันทึกสินค้าชำรุด/เสียหาย
// - ควบคุมการจัดเก็บสินค้าเข้าโกดังตามเงื่อนไขหมวดหมู่สินค้า (1 หมวดหมู่ : 1 โกดัง)
// - ค้นหาข้อมูลตามเงื่อนไขที่ต้องการ
// ============================================================================

app.get("/api/warehouse/overview", requireAuth, async (req, res) => {
  try {
    await syncWarehousesWithCategories();

    const { search, category, warehouse_code, qc_status, only_damaged } = req.query;

    const [warehouses] = await db.query("SELECT * FROM warehouse_location ORDER BY warehouse_code ASC");
    const [products] = await db.query("SELECT * FROM product ORDER BY product_id ASC");
    const [qcLogs] = await db.query("SELECT * FROM stock_qc_log ORDER BY qc_id DESC LIMIT 200");

    // จับคู่โกดังตามหมวดหมู่ (1 หมวดหมู่ : 1 โกดัง)
    const whByCategory = new Map(warehouses.map((w) => [w.category, w]));

    const enrichedWarehouses = warehouses.map((w) => {
      const catProducts = products.filter((p) => (p.category || "ทั่วไป") === w.category);
      const totalStock = catProducts.reduce((sum, p) => sum + (parseInt(p.stock_quantity, 10) || 0), 0);
      const skuCount = catProducts.length;
      return {
        ...w,
        sku_count: skuCount,
        current_stock: totalStock,
        usage_percent: w.max_capacity > 0 ? Math.min(100, Math.round((totalStock / w.max_capacity) * 100)) : 0,
        products: catProducts,
      };
    });

    let enrichedProducts = products.map((p) => {
      const cat = p.category || "ทั่วไป";
      const wh = whByCategory.get(cat);
      return {
        ...p,
        warehouse_code: wh ? wh.warehouse_code : "WH-00",
        warehouse_name: wh ? wh.warehouse_name : `โกดัง (${cat})`,
        zone_detail: wh ? wh.zone_detail : "โซนมาตรฐาน",
      };
    });

    if (category && category !== "all") {
      enrichedProducts = enrichedProducts.filter((p) => p.category === category);
    }
    if (warehouse_code && warehouse_code !== "all") {
      enrichedProducts = enrichedProducts.filter((p) => p.warehouse_code === warehouse_code);
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      enrichedProducts = enrichedProducts.filter(
        (p) =>
          (p.product_id || "").toLowerCase().includes(q) ||
          (p.name || "").toLowerCase().includes(q) ||
          (p.category || "").toLowerCase().includes(q) ||
          (p.warehouse_code || "").toLowerCase().includes(q) ||
          (p.warehouse_name || "").toLowerCase().includes(q)
      );
    }

    let filteredQcLogs = qcLogs.filter((log) => {
      if (category && category !== "all" && log.category !== category) return false;
      if (warehouse_code && warehouse_code !== "all" && log.warehouse_code !== warehouse_code) return false;
      if (qc_status && qc_status !== "all" && log.qc_status !== qc_status) return false;
      if (only_damaged === "true" && Number(log.damaged_qty || 0) <= 0) return false;
      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        const match =
          (log.qc_no || "").toLowerCase().includes(q) ||
          (log.order_no || "").toLowerCase().includes(q) ||
          (log.product_id || "").toLowerCase().includes(q) ||
          (log.product_name || "").toLowerCase().includes(q) ||
          (log.category || "").toLowerCase().includes(q) ||
          (log.warehouse_name || "").toLowerCase().includes(q) ||
          (log.damage_reason || "").toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });

    const summary = {
      totalWarehouses: enrichedWarehouses.length,
      totalProducts: products.length,
      totalStockPieces: products.reduce((s, p) => s + (parseInt(p.stock_quantity, 10) || 0), 0),
      totalQcLogs: qcLogs.length,
      totalReceivedPieces: qcLogs.reduce((s, l) => s + (parseInt(l.received_qty, 10) || 0), 0),
      totalPassedPieces: qcLogs.reduce((s, l) => s + (parseInt(l.passed_qty, 10) || 0), 0),
      totalDamagedPieces: qcLogs.reduce((s, l) => s + (parseInt(l.damaged_qty, 10) || 0), 0),
    };

    res.json({
      summary,
      warehouses: enrichedWarehouses,
      products: enrichedProducts,
      qcLogs: filteredQcLogs,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// สร้างหรือตั้งค่าโกดังใหม่ตามเงื่อนไข (1 หมวดหมู่ : 1 โกดัง)
app.post("/api/warehouse/warehouses", requireAuth, async (req, res) => {
  try {
    const { warehouse_code, warehouse_name, category, zone_detail, max_capacity, manager_name } = req.body || {};
    if (!category || !category.trim()) {
      return res.status(400).json({ message: "กรุณาระบุหมวดหมู่สินค้าประจำโกดัง" });
    }

    const cleanCat = category.trim();
    const [existingCat] = await db.query(
      "SELECT * FROM warehouse_location WHERE category = ? LIMIT 1",
      [cleanCat]
    );
    if (existingCat.length > 0) {
      return res.status(409).json({
        message: `เงื่อนไข (1 หมวดหมู่ : 1 โกดัง): หมวดหมู่ "${cleanCat}" มีโกดังประจำอยู่แล้วคือ "${existingCat[0].warehouse_code} - ${existingCat[0].warehouse_name}" ไม่สามารถสร้างโกดังซ้ำในหมวดหมู่เดียวกันได้`,
      });
    }

    const [countRows] = await db.query("SELECT COUNT(*) AS cnt FROM warehouse_location");
    const nextNum = (countRows[0]?.cnt || 0) + 1;
    const finalCode = warehouse_code?.trim() || `WH-${String(nextNum).padStart(2, "0")}`;
    const finalName = warehouse_name?.trim() || `โกดัง ${finalCode} (${cleanCat})`;

    await db.query(
      `INSERT INTO warehouse_location (warehouse_code, warehouse_name, category, zone_detail, max_capacity, manager_name, status)
       VALUES (?, ?, ?, ?, ?, ?, 'พร้อมใช้งาน')`,
      [
        finalCode,
        finalName,
        cleanCat,
        zone_detail || `โซนคลังสินค้า ${finalCode}`,
        parseInt(max_capacity, 10) || 500,
        manager_name || req.user.name || "พนักงานสต็อก (admin3)",
      ]
    );

    res.status(201).json({
      message: `สร้างโกดัง "${finalName}" สำหรับหมวดหมู่ "${cleanCat}" (1 หมวดหมู่ : 1 โกดัง) สำเร็จ`,
      warehouse_code: finalCode,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// แก้ไขรายละเอียดโกดัง
app.put("/api/warehouse/warehouses/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { warehouse_name, zone_detail, max_capacity, manager_name, status } = req.body || {};

    await db.query(
      `UPDATE warehouse_location
       SET warehouse_name = COALESCE(?, warehouse_name),
           zone_detail = COALESCE(?, zone_detail),
           max_capacity = COALESCE(?, max_capacity),
           manager_name = COALESCE(?, manager_name),
           status = COALESCE(?, status)
       WHERE warehouse_id = ? OR warehouse_code = ?`,
      [
        warehouse_name || null,
        zone_detail || null,
        max_capacity ? parseInt(max_capacity, 10) : null,
        manager_name || null,
        status || null,
        id,
        id,
      ]
    );

    res.json({ message: "อัปเดตข้อมูลโกดังสำเร็จ" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// รับสินค้าเข้าคลัง ตรวจสอบ QC บันทึกสินค้าชำรุด/เสียหาย และจัดเก็บเข้าโกดังตามหมวดหมู่ (1 หมวดหมู่ : 1 โกดัง)
app.post("/api/warehouse/receive-qc", requireAuth, async (req, res) => {
  const {
    product_id,
    order_no,
    received_qty,
    damaged_qty = 0,
    damage_reason,
    selected_warehouse_code,
  } = req.body || {};

  if (!product_id) {
    return res.status(400).json({ message: "กรุณาเลือกสินค้าที่ต้องการรับเข้าคลังและตรวจสอบ QC" });
  }

  const recvQty = parseInt(received_qty, 10);
  const dmgQty = parseInt(damaged_qty, 10) || 0;

  if (isNaN(recvQty) || recvQty <= 0) {
    return res.status(400).json({ message: "จำนวนสินค้าที่รับเข้าคลังต้องมากกว่า 0 ชิ้น" });
  }
  if (dmgQty < 0 || dmgQty > recvQty) {
    return res.status(400).json({ message: "จำนวนสินค้าชำรุด/เสียหาย ต้องไม่ติดลบและไม่เกินจำนวนที่รับเข้าทั้งหมด" });
  }

  const passedQty = recvQty - dmgQty;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await syncWarehousesWithCategories(conn);

    const [pRows] = await conn.query("SELECT * FROM product WHERE product_id = ? LIMIT 1", [product_id]);
    if (pRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: `ไม่พบสินค้ารหัส ${product_id}` });
    }

    const product = pRows[0];
    const prodCategory = (product.category || "ทั่วไป").trim();

    // ตรวจสอบโกดังประจำหมวดหมู่ตามเงื่อนไข (1 หมวดหมู่ : 1 โกดัง)
    const [whRows] = await conn.query(
      "SELECT * FROM warehouse_location WHERE category = ? LIMIT 1",
      [prodCategory]
    );

    const assignedWarehouse = whRows[0];
    if (!assignedWarehouse) {
      await conn.rollback();
      return res.status(400).json({ message: `ไม่พบโกดังสำหรับหมวดหมู่ "${prodCategory}"` });
    }

    // หากพนักงานเลือกโกดังไม่ตรงกับหมวดหมู่สินค้า ให้บล็อกตามกฎ 1 หมวดหมู่ : 1 โกดัง
    if (
      selected_warehouse_code &&
      selected_warehouse_code !== "auto" &&
      selected_warehouse_code !== assignedWarehouse.warehouse_code
    ) {
      await conn.rollback();
      return res.status(400).json({
        message: `ผิดเงื่อนไข (1 หมวดหมู่ : 1 โกดัง)! สินค้า "${product.name}" อยู่ในหมวดหมู่ "${prodCategory}" ต้องจัดเก็บเข้า "${assignedWarehouse.warehouse_code} - ${assignedWarehouse.warehouse_name}" เท่านั้น ไม่สามารถเก็บข้ามโกดังได้`,
      });
    }

    let qcStatus = "ผ่าน QC ทั้งหมด";
    if (dmgQty > 0 && passedQty > 0) {
      qcStatus = "พบสินค้าชำรุดบางส่วน";
    } else if (dmgQty === recvQty) {
      qcStatus = "ไม่ผ่าน QC ทั้งล็อต";
    }

    const qcNo = `QC-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;
    const inspector = req.user.name || req.user.username || "พนักงานสต็อก (admin3)";

    await conn.query(
      `INSERT INTO stock_qc_log
       (qc_no, order_no, product_id, product_name, category, warehouse_code, warehouse_name, received_qty, passed_qty, damaged_qty, damage_reason, qc_status, inspector)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        qcNo,
        order_no || "-",
        product.product_id,
        product.name,
        prodCategory,
        assignedWarehouse.warehouse_code,
        assignedWarehouse.warehouse_name,
        recvQty,
        passedQty,
        dmgQty,
        dmgQty > 0 ? (damage_reason || "พบสินค้าชำรุดจากการตรวจสอบ QC") : "- (สภาพสมบูรณ์ 100%)",
        qcStatus,
        inspector,
      ]
    );

    // เพิ่มสต็อกเฉพาะจำนวนที่ผ่าน QC (passedQty) เท่านั้น
    const currentStock = parseInt(product.stock_quantity, 10) || 0;
    const newStock = currentStock + passedQty;
    const newProductStatus = newStock <= 0 ? "หมด" : newStock < 10 ? "ใกล้หมด" : "มีสินค้า";

    await conn.query(
      "UPDATE product SET stock_quantity = ?, status = ? WHERE product_id = ?",
      [newStock, newProductStatus, product.product_id]
    );

    await conn.commit();

    res.status(201).json({
      message: `บันทึกผลตรวจ QC และจัดเก็บเข้า ${assignedWarehouse.warehouse_name} สำเร็จ! (รับเข้าสต็อกจริง ${passedQty} ชิ้น, คัดแยกชำรุด ${dmgQty} ชิ้น)`,
      qc: {
        qc_no: qcNo,
        product_id: product.product_id,
        product_name: product.name,
        category: prodCategory,
        warehouse_code: assignedWarehouse.warehouse_code,
        warehouse_name: assignedWarehouse.warehouse_name,
        received_qty: recvQty,
        passed_qty: passedQty,
        damaged_qty: dmgQty,
        qc_status: qcStatus,
        new_stock: newStock,
      },
    });
  } catch (err) {
    await conn.rollback().catch(() => {});
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});


// ============================================================================
// 3.5 API สำหรับลูกค้า / สมาชิก (Customer / Member Loyalty & Gift Profile)
// - สะสมแต้มจากการซื้อสินค้า (ซื้อ 50 บาท ได้รับ 5 แต้ม)
// - แจ้งวันเกิด และที่อยู่จัดส่งสำหรับรับของขวัญในเทศกาลปีใหม่และวันเกิด
// - ตรวจสอบยอดแต้มสะสมคงเหลือ
// ============================================================================

app.get("/api/loyalty/me", requireAuth, async (req, res) => {
  try {
    const username = req.user.username;
    const table = await getActiveMemberTable();

    let memberRow = null;
    try {
      const [mRows] = await db.query(`SELECT * FROM ${table} WHERE username = ? LIMIT 1`, [username]);
      if (mRows.length > 0) memberRow = mRows[0];
    } catch (e) {}

    let [profRows] = await db.query("SELECT * FROM member_profile WHERE username = ? LIMIT 1", [username]);
    if (profRows.length === 0) {
      await db.query(
        `INSERT INTO member_profile (nisit_id, username, member_name, phone, points, total_spent)
         VALUES (?, ?, ?, ?, 0, 0.00)`,
        [req.user.id || memberRow?.nisit_id || null, username, req.user.name || memberRow?.name || username, memberRow?.phone || null]
      );
      [profRows] = await db.query("SELECT * FROM member_profile WHERE username = ? LIMIT 1", [username]);
    }

    const profile = profRows[0];
    const [history] = await db.query(
      "SELECT * FROM point_history WHERE username = ? ORDER BY history_id DESC LIMIT 100",
      [username]
    );
    const [gifts] = await db.query(
      "SELECT * FROM gift_delivery WHERE username = ? ORDER BY gift_id DESC",
      [username]
    );

    res.json({
      profile: {
        nisit_id: profile.nisit_id || req.user.id || memberRow?.nisit_id,
        username: profile.username,
        member_name: profile.member_name || req.user.name,
        phone: profile.phone || memberRow?.phone || "",
        points: Number(profile.points || 0),
        total_spent: Number(profile.total_spent || 0),
        wallet_balance: parseFloat(profile.wallet_balance || 0),
        birth_date: profile.birth_date ? new Date(profile.birth_date).toISOString().slice(0, 10) : "",
        gift_address: profile.gift_address || "",
        newyear_gift_opt_in: Boolean(profile.newyear_gift_opt_in),
        birthday_gift_opt_in: Boolean(profile.birthday_gift_opt_in),
      },
      point_history: history,
      gifts,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ตรวจสอบแต้มสะสมและของขวัญของสมาชิกรายบุคคล (สำหรับ Admin/เจ้าหน้าที่ เมื่อกดปุ่ม "ตรวจสอบ")
app.get("/api/loyalty/member/:username", requireAuth, async (req, res) => {
  try {
    const { username } = req.params;
    const table = await getActiveMemberTable();

    let memberRow = null;
    try {
      const [mRows] = await db.query(`SELECT * FROM ${table} WHERE username = ? LIMIT 1`, [username]);
      if (mRows.length > 0) memberRow = mRows[0];
    } catch (e) {}

    let [profRows] = await db.query("SELECT * FROM member_profile WHERE username = ? LIMIT 1", [username]);
    if (profRows.length === 0) {
      const nid = memberRow?.nisit_id || memberRow?.id || null;
      const mName = memberRow?.name || username;
      const mPhone = memberRow?.phone || null;
      await db.query(
        `INSERT INTO member_profile (nisit_id, username, member_name, phone, points, total_spent)
         VALUES (?, ?, ?, ?, 0, 0.00)`,
        [nid, username, mName, mPhone]
      );
      [profRows] = await db.query("SELECT * FROM member_profile WHERE username = ? LIMIT 1", [username]);
    }

    const profile = profRows[0] || {};
    const [history] = await db.query(
      "SELECT * FROM point_history WHERE username = ? ORDER BY history_id DESC LIMIT 100",
      [username]
    );
    const [gifts] = await db.query(
      "SELECT * FROM gift_delivery WHERE username = ? ORDER BY gift_id DESC",
      [username]
    );

    res.json({
      profile: {
        nisit_id: profile.nisit_id || memberRow?.nisit_id || memberRow?.id,
        username: profile.username || username,
        member_name: profile.member_name || memberRow?.name || username,
        phone: profile.phone || memberRow?.phone || "",
        points: Number(profile.points || 0),
        total_spent: Number(profile.total_spent || 0),
        wallet_balance: parseFloat(profile.wallet_balance || 0),
        birth_date: profile.birth_date ? new Date(profile.birth_date).toISOString().slice(0, 10) : "",
        gift_address: profile.gift_address || "",
        newyear_gift_opt_in: Boolean(profile.newyear_gift_opt_in),
        birthday_gift_opt_in: Boolean(profile.birthday_gift_opt_in),
      },
      point_history: history || [],
      gifts: gifts || [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// บันทึกปรับแต้มสะสมให้สมาชิก (ให้แต้มพิเศษ / แลกแต้ม)
app.post("/api/loyalty/member/:username/points", requireAuth, async (req, res) => {
  try {
    const { username } = req.params;
    const { points_change, reason } = req.body || {};
    const change = parseInt(points_change, 10);
    if (isNaN(change) || change === 0) {
      return res.status(400).json({ message: "กรุณาระบุจำนวนแต้มที่ถูกต้อง" });
    }

    const [profRows] = await db.query("SELECT * FROM member_profile WHERE username = ? LIMIT 1", [username]);
    if (profRows.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลสมาชิก" });
    }
    const currentPts = Number(profRows[0].points || 0);
    const newBalance = Math.max(0, currentPts + change);

    await db.query("UPDATE member_profile SET points = ? WHERE username = ?", [newBalance, username]);

    const refNo = `ADJ-${Date.now().toString().slice(-6)}`;
    const operator = req.user.name || req.user.username || "เจ้าหน้าที่";
    await db.query(
      `INSERT INTO point_history (username, nisit_id, member_name, reference_no, channel, purchase_amount, points_change, points_balance, note)
       VALUES (?, ?, ?, ?, 'ปรับแต้มโดยเจ้าหน้าที่', 0, ?, ?, ?)`,
      [
        username,
        profRows[0].nisit_id,
        profRows[0].member_name,
        refNo,
        change,
        newBalance,
        reason ? `${reason} (โดย: ${operator})` : `ปรับแต้มโดย: ${operator}`,
      ]
    );

    res.json({
      message: `ปรับแต้มสำเร็จ! ยอดแต้มคงเหลือปัจจุบัน: ${newBalance} แต้ม`,
      points_balance: newBalance,
      points_change: change,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// รีเซ็ตแต้มสะสมของสมาชิกทุกคนเป็น 0 (Reset All Points)
app.post("/api/loyalty/reset-all-points", requireAuth, async (req, res) => {
  try {
    const [result] = await db.query("UPDATE member_profile SET points = 0");
    try {
      await db.query("TRUNCATE TABLE point_history");
    } catch (e) {
      await db.query("DELETE FROM point_history");
    }
    await db.query("UPDATE gift_delivery SET member_points = 0").catch(() => {});

    res.json({
      message: "รีเซ็ตยอดแต้มสะสมของสมาชิกทุกคนเป็น 0 เรียบร้อยแล้ว!",
      affectedMembers: result.affectedRows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ปรับปรุง / เติมเงินยอดเงินในบัญชีของผู้ใช้งาน (Admin หรือเจ้าหน้าที่ ปรับยอดเงินให้สมาชิก)
app.post("/api/loyalty/member/:username/wallet", requireAuth, async (req, res) => {
  try {
    const { username } = req.params;
    const { amount_change, type = "adjustment", reason } = req.body || {};
    const change = parseFloat(amount_change);
    if (isNaN(change) || change === 0) {
      return res.status(400).json({ message: "กรุณาระบุจำนวนเงินที่ต้องการปรับปรุง" });
    }

    let [profRows] = await db.query("SELECT * FROM member_profile WHERE username = ? LIMIT 1", [username]);
    if (profRows.length === 0) {
      // ตรวจสอบจากตารางหลัก (nisit หรือ member)
      const table = await getActiveMemberTable();
      const [uRows] = await db.query(`SELECT * FROM ${table} WHERE username = ? LIMIT 1`, [username]);
      if (uRows.length === 0) {
        return res.status(404).json({ message: "ไม่พบข้อมูลสมาชิกนี้ในระบบ" });
      }
      const u = uRows[0];
      await db.query(
        `INSERT INTO member_profile (nisit_id, username, member_name, phone, points, total_spent, wallet_balance)
         VALUES (?, ?, ?, ?, 0, 0, 0)`,
        [u.nisit_id || u.id || null, u.username, u.name || u.username, u.phone || null]
      );
      [profRows] = await db.query("SELECT * FROM member_profile WHERE username = ? LIMIT 1", [username]);
    }

    const currentBal = parseFloat(profRows[0].wallet_balance || 0);
    const newBalance = Math.max(0, currentBal + change);

    await db.query("UPDATE member_profile SET wallet_balance = ? WHERE username = ?", [newBalance, username]);

    const operator = req.user.name || req.user.username || "เจ้าหน้าที่";
    await db.query(
      `INSERT INTO wallet_history (username, nisit_id, member_name, type, amount, balance_after, note, operator)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        username,
        profRows[0].nisit_id,
        profRows[0].member_name,
        type,
        change,
        newBalance,
        reason || `ปรับยอดเงินโดย: ${operator}`,
        operator,
      ]
    );

    res.json({
      message: `ปรับปรุงยอดเงินในบัญชีของ @${username} สำเร็จ! ยอดคงเหลือใหม่: ฿${newBalance.toFixed(2)} บาท`,
      wallet_balance: newBalance,
      amount_change: change,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ผู้ใช้งานเติมเงินเข้าบัญชีของตนเอง (User Top-up Wallet)
app.post("/api/user/wallet/topup", requireAuth, async (req, res) => {
  try {
    const username = req.user.username;
    const { amount, payment_channel = "พร้อมเพย์ / PromptPay" } = req.body || {};
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ message: "จำนวนเงินที่เติมต้องมากกว่า 0 บาท" });
    }

    let [profRows] = await db.query("SELECT * FROM member_profile WHERE username = ? LIMIT 1", [username]);
    if (profRows.length === 0) {
      await db.query(
        `INSERT INTO member_profile (nisit_id, username, member_name, phone, points, total_spent, wallet_balance)
         VALUES (?, ?, ?, ?, 0, 0, 0)`,
        [req.user.id || null, username, req.user.name || username, req.user.phone || null]
      );
      [profRows] = await db.query("SELECT * FROM member_profile WHERE username = ? LIMIT 1", [username]);
    }

    const currentBal = parseFloat(profRows[0].wallet_balance || 0);
    const newBalance = currentBal + numAmount;

    await db.query("UPDATE member_profile SET wallet_balance = ? WHERE username = ?", [newBalance, username]);

    await db.query(
      `INSERT INTO wallet_history (username, nisit_id, member_name, type, amount, balance_after, note, operator)
       VALUES (?, ?, ?, 'topup', ?, ?, ?, ?)`,
      [
        username,
        profRows[0].nisit_id,
        profRows[0].member_name || req.user.name,
        numAmount,
        newBalance,
        `เติมเงินเข้าบัญชีผู้ใช้งานผ่าน ${payment_channel}`,
        username,
      ]
    );

    res.json({
      message: `เติมเงินเข้าบัญชีสำเร็จ! ยอดเงินคงเหลือใหม่: ฿${newBalance.toFixed(2)} บาท`,
      wallet_balance: newBalance,
      amount_added: numAmount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ดึงประวัติรายการยอดเงินคงเหลือในกระเป๋าเงินของผู้ใช้ปัจจุบัน (Wallet History)
app.get("/api/user/wallet/history", requireAuth, async (req, res) => {
  try {
    const username = req.user.username;
    const [rows] = await db.query(
      "SELECT * FROM wallet_history WHERE username = ? ORDER BY history_id DESC LIMIT 100",
      [username]
    );
    let [profRows] = await db.query(
      "SELECT wallet_balance FROM member_profile WHERE username = ? LIMIT 1",
      [username]
    );
    const balance = parseFloat(profRows[0]?.wallet_balance || 0);
    res.json({
      wallet_balance: balance,
      history: rows || [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ลูกค้าแจ้ง/อัปเดตวันเกิด และที่อยู่จัดส่งสำหรับรับของขวัญในเทศกาลปีใหม่และวันเกิด
app.put("/api/loyalty/profile", requireAuth, async (req, res) => {
  try {
    const username = req.user.username;
    const {
      member_name,
      phone,
      birth_date,
      gift_address,
      newyear_gift_opt_in = true,
      birthday_gift_opt_in = true,
      create_gift_requests = true,
    } = req.body || {};

    if (!birth_date) {
      return res.status(400).json({ message: "กรุณาระบุวันเดือนปีเกิดของท่าน" });
    }
    if (!gift_address || !gift_address.trim()) {
      return res.status(400).json({ message: "กรุณาระบุที่อยู่จัดส่งสำหรับรับของขวัญเทศกาลปีใหม่และวันเกิด" });
    }

    const cleanPhone = phone ? String(phone).replace(/\D/g, "").slice(0, 10) : null;

    await db.query(
      `INSERT INTO member_profile
       (nisit_id, username, member_name, phone, birth_date, gift_address, newyear_gift_opt_in, birthday_gift_opt_in)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         member_name = COALESCE(VALUES(member_name), member_name),
         phone = COALESCE(VALUES(phone), phone),
         birth_date = VALUES(birth_date),
         gift_address = VALUES(gift_address),
         newyear_gift_opt_in = VALUES(newyear_gift_opt_in),
         birthday_gift_opt_in = VALUES(birthday_gift_opt_in)`,
      [
        req.user.id || null,
        username,
        member_name || req.user.name || username,
        cleanPhone,
        birth_date,
        gift_address.trim(),
        newyear_gift_opt_in ? 1 : 0,
        birthday_gift_opt_in ? 1 : 0,
      ]
    );

    const [profRows] = await db.query("SELECT * FROM member_profile WHERE username = ? LIMIT 1", [username]);
    const prof = profRows[0] || {};

    // อัปเดตที่อยู่และวันเกิดในรายการของขวัญที่ยังรออนุมัติ หรือสร้างรายการขอรับของขวัญปีใหม่และวันเกิดให้เจ้าของร้านอนุมัติ
    if (create_gift_requests) {
      const giftTypesToEnsure = [];
      if (newyear_gift_opt_in) giftTypesToEnsure.push("เทศกาลปีใหม่");
      if (birthday_gift_opt_in) giftTypesToEnsure.push("วันเกิด");

      for (const gType of giftTypesToEnsure) {
        const [existingGift] = await db.query(
          "SELECT * FROM gift_delivery WHERE username = ? AND gift_type = ? LIMIT 1",
          [username, gType]
        );
        if (existingGift.length === 0) {
          const giftNo = `GIFT-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}${gType === "วันเกิด" ? "B" : "N"}`;
          const giftItem =
            gType === "วันเกิด"
              ? "เซ็ตของขวัญสุขสันต์วันเกิดสมาชิก (Birthday Gift Set)"
              : "กระเช้าของขวัญสวัสดีปีใหม่สำหรับสมาชิก (New Year Gift Set)";
          await db.query(
            `INSERT INTO gift_delivery
             (gift_no, nisit_id, username, member_name, phone, birth_date, gift_type, gift_item, shipping_address, member_points, status, note)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'รออนุมัติ', ?)`,
            [
              giftNo,
              req.user.id || prof.nisit_id || null,
              username,
              member_name || req.user.name || username,
              cleanPhone || prof.phone || null,
              birth_date,
              gType,
              giftItem,
              gift_address.trim(),
              prof.points || 0,
              `สมาชิกแจ้งวันเกิดและที่อยู่จัดส่งสำหรับรับของขวัญ (${gType})`,
            ]
          );
        } else {
          await db.query(
            `UPDATE gift_delivery
             SET member_name = ?, phone = COALESCE(?, phone), birth_date = ?, shipping_address = ?, member_points = ?
             WHERE gift_id = ?`,
            [
              member_name || req.user.name || username,
              cleanPhone,
              birth_date,
              gift_address.trim(),
              prof.points || 0,
              existingGift[0].gift_id,
            ]
          );
        }
      }
    }

    res.json({
      message: "บันทึกข้อมูลวันเกิดและที่อยู่จัดส่งของขวัญปีใหม่/วันเกิดเรียบร้อยแล้ว!",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ลูกค้ากดส่งคำขอรับของขวัญปีใหม่ หรือ วันเกิดเพิ่มเติม
app.post("/api/loyalty/request-gift", requireAuth, async (req, res) => {
  try {
    const username = req.user.username;
    const { gift_type, note } = req.body || {};
    const targetType = gift_type === "วันเกิด" ? "วันเกิด" : "เทศกาลปีใหม่";

    const [profRows] = await db.query("SELECT * FROM member_profile WHERE username = ? LIMIT 1", [username]);
    const prof = profRows[0];
    if (!prof || !prof.birth_date || !prof.gift_address) {
      return res.status(400).json({
        message: "กรุณาบันทึกวันเกิดและที่อยู่จัดส่งของขวัญก่อนส่งคำขอรับของขวัญ",
      });
    }

    const giftNo = `GIFT-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;
    const giftItem =
      targetType === "วันเกิด"
        ? "เซ็ตของขวัญสุขสันต์วันเกิดสมาชิก (Birthday Special Box)"
        : "ชุดของขวัญพรีเมียมเทศกาลปีใหม่ (New Year Gift Box)";

    await db.query(
      `INSERT INTO gift_delivery
       (gift_no, nisit_id, username, member_name, phone, birth_date, gift_type, gift_item, shipping_address, member_points, status, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'รออนุมัติ', ?)`,
      [
        giftNo,
        prof.nisit_id || req.user.id || null,
        username,
        prof.member_name || req.user.name || username,
        prof.phone || null,
        prof.birth_date,
        targetType,
        giftItem,
        prof.gift_address,
        prof.points || 0,
        note || `ลูกค้าส่งคำขอรับของขวัญ${targetType}`,
      ]
    );

    res.status(201).json({
      message: `ส่งคำขอรับของขวัญ${targetType}สำเร็จ! รอเจ้าของร้านอนุมัติการจัดส่ง`,
      gift_no: giftNo,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server กำลังทำงานที่ http://localhost:${PORT}`);
});
