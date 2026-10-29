const express = require("express");
const router = express.Router();
const pool = require("../db");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "phobtawun@gmail.com",
    pass: "umesuxxhcgdfrzis"
  }
});
// READ - ดึงผู้ใช้ทั้งหมด
router.get("/", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM members");
        res.json(rows);
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

router.post("/", async (req, res) => {
  console.log("BODY =", req.body);
  const {
    First_Name, Last_Name, Sex, Email, Member_Password
  } = req.body;
  try {
    // ตรวจสอบว่า Email ถูกใช้งานแล้วหรือยัง
    const [existingEmail] = await pool.query(
      "SELECT Member_ID FROM members WHERE Email = ? LIMIT 1",
      [Email]
    );
    if (existingEmail.length > 0) {
      console.log("EMAIL DUPLICATE =", Email);
      return res.status(409).json({
        error: "อีเมลนี้ถูกใช้งานแล้ว"
      });
    }
    // ถ้ายังไม่มี Email นี้ จึงเพิ่มสมาชิก
    const [result] = await pool.query(
      `INSERT INTO members (
        First_Name,
        Last_Name,
        Sex,
        Email,
        Member_Password,
        Member_Register_Date,
        Member_Register_Time,
        Member_State
      ) VALUES (?, ?, ?, ?, ?, CURDATE(), CURTIME(), 'Active')`,
      [
        First_Name,
        Last_Name,
        Sex,
        Email,
        Member_Password
      ]
    );

    console.log("INSERT SUCCESS");

    res.status(201).json({
      success: true,
      id: result.insertId,
      message: "สมัครสมาชิกสำเร็จ"
    });
  } catch (err) {
    console.error("MYSQL ERROR =", err);
    res.status(500).json({
      error: err.message
    });
  }
});

  // แก้ไขสมาชิก
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      First_Name, Last_Name, Sex, Email, Member_Password
    } = req.body;
    // ตรวจว่า Email ถูกใช้โดยสมาชิกคนอื่นหรือไม่
    const [existingEmail] = await pool.query(
      `
      SELECT Member_ID
      FROM members
      WHERE Email = ?
      AND Member_ID != ?
      LIMIT 1
      `,
      [Email, id]
    );
    if (existingEmail.length > 0) {
      return res.status(409).json({
        error: "อีเมลนี้ถูกใช้งานโดยสมาชิกคนอื่นแล้ว"
      });
    }
    // แก้ไขสมาชิก
    await pool.query(
      `
      UPDATE members
      SET
        First_Name = ?,
        Last_Name = ?,
        Sex = ?,
        Email = ?,
        Member_Password = ?
      WHERE Member_ID = ?
      `,
      [
        First_Name, Last_Name, Sex, Email, Member_Password, id
      ]
    );
    res.json({
      message: "แก้ไขสำเร็จ"
    });
  } catch (err) {
    console.error("UPDATE MEMBER ERROR =", err);
    res.status(500).json({
      error: err.message
    });
  }
});

// ลบสมาชิก
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM members WHERE memid=?", [id]);
    res.json({ message: "ลบสำเร็จ" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    console.log("===== MEMBER LOGIN =====");
    console.log("BODY =", req.body);
    const { email, password } = req.body;

    // ตรวจสอบข้อมูล
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "กรุณากรอกอีเมลและรหัสผ่าน"
      });
    }

    // ค้นหาสมาชิก
    const [rows] = await pool.query(
      `
      SELECT *
      FROM members
      WHERE Email = ?
        AND Member_Password = ?
      LIMIT 1
      `,
      [email.trim(), password]
    );

    console.log("MEMBER FOUND =", rows.length);

    // 1. ไม่พบสมาชิก
    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
      });
    }

    // 2. ต้องประกาศ member ก่อนใช้งาน
    const member = rows[0];
    console.log("MEMBER STATE =", member.Member_State);
    console.log("PASSWORD MATCHED =", member.Member_Password === password);

    // 3. ตรวจสอบสถานะบัญชี
    if (member.Member_State !== "Active") {
      console.log("LOGIN BLOCKED: ACCOUNT SUSPENDED");

      return res.status(403).json({
        success: false,
        code: "ACCOUNT_SUSPENDED",
        message: "บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ"
      });
    }

    // 4. บัญชี Active จึงสร้าง JWT
    console.log("LOGIN MEMBER_ID =", member.Member_ID);

    const token = jwt.sign(
      { memberId: member.Member_ID },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("JWT CREATED");

    // ส่งข้อมูลกลับ Frontend
    res.json({
      success: true,
      token,
      member
    });
  } catch (err) {
    console.error(
      "MEMBER LOGIN ERROR =",
      err
    );
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

router.post("/send-otp", async (req, res) => {
  try {
    const emailKey = String(req.body.email || "")
      .trim()
      .toLowerCase();

    if (!emailKey) {
      return res.status(400).json({
        success: false,
        message: "กรุณาระบุอีเมล"
      });
    }

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    global.otpStore = global.otpStore || {};
    global.otpStore[emailKey] = otp;

    console.log("===== SEND OTP =====");
    console.log("EMAIL =", emailKey);
    console.log("OTP =", otp); // แสดงรหัส OTP สำหรับทดสอบ
    console.log("OTP SAVED =", !!global.otpStore[emailKey]);

    await transporter.sendMail({
      from: "phobtawun@gmail.com",
      to: emailKey,
      subject: "OTP Verification",
      html: `<h2>รหัส OTP ของคุณคือ ${otp}</h2>`
    });

    return res.json({
      success: true,
      message: "ส่ง OTP สำเร็จ"
    });
  } catch (err) {
    console.error("SEND OTP ERROR =", err);

    return res.status(500).json({
      success: false,
      message: "ส่ง OTP ไม่สำเร็จ"
    });
  }
});

router.post("/verify-otp", async (req, res) => {
  const emailKey = String(req.body.email || "")
    .trim()
    .toLowerCase();

  const otp = String(req.body.otp || "");

  global.otpStore = global.otpStore || {};

  const savedOtp = global.otpStore[emailKey];

  console.log("===== VERIFY OTP =====");
  console.log("EMAIL =", emailKey);
  console.log("OTP EXISTS =", savedOtp !== undefined);

  if (savedOtp === undefined || savedOtp !== otp) {
    return res.status(400).json({
      success: false,
      message: "OTP ไม่ถูกต้องหรือหมดอายุ"
    });
  }

  delete global.otpStore[emailKey];

  return res.json({
    success: true,
    message: "ยืนยัน OTP สำเร็จ"
  });
});

module.exports = router;