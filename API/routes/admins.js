const express = require("express");
const router = express.Router();
const pool = require("../db");
// =========================
// ADMIN LOGIN
// =========================
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log("===== ADMIN LOGIN =====");
    console.log("Username:", username);
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน",
      });
    }
    // ค้นหา Admin จากฐานข้อมูล
    const [rows] = await pool.query(
      `
      SELECT
        Admin_ID,
        Admin_Name,
        Admin_Password
      FROM admins
      WHERE Admin_Name = ?
      LIMIT 1
      `,
      [username]
    );
    console.log("Admin found:", rows.length);
    // ไม่พบ username
    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
      });
    }
    const admin = rows[0];
    // ตรวจสอบ password
    if (admin.Admin_Password !== password) {
      return res.status(401).json({
        success: false,
        message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
      });
    }
    // ไม่ส่ง password กลับ frontend
    const adminData = {
      Admin_ID: admin.Admin_ID,
      Admin_Name: admin.Admin_Name,
    };
    console.log("ADMIN LOGIN SUCCESS:", adminData);
    return res.json({
      success: true,
      message: "เข้าสู่ระบบ Admin สำเร็จ",
      admin: adminData,
    });
  } catch (error) {
    console.error("ADMIN LOGIN ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดของเซิร์ฟเวอร์",
    });
  }
});

module.exports = router;