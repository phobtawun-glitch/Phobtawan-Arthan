const express = require("express");
const router = express.Router();
const pool = require("../../db");
// ==========================================
// GET - สมาชิกที่ยังไม่ถูกระงับ
// ==========================================
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        m.Member_ID,
        m.First_Name,
        m.Last_Name,
        m.Email,
        m.Line,
        m.Sex,
        m.Member_Suspended_Date,
        m.Member_Suspended_Time,
        m.Reason_Suspended,
        m.Admin_ID,
        (
          SELECT COUNT(*) FROM postings p
          WHERE p.Member_ID = m.Member_ID
        ) AS Post_Count,
        (
          SELECT l.Login_State FROM logins l
          WHERE l.Member_ID = m.Member_ID
          ORDER BY l.Login_Date DESC, l.Login_Time DESC
          LIMIT 1
        ) AS Login_State,
        (
          SELECT l.Login_Date FROM logins l
          WHERE l.Member_ID = m.Member_ID
          ORDER BY l.Login_Date DESC, l.Login_Time DESC
          LIMIT 1
        ) AS Last_Login_Date,
        (
          SELECT l.Login_Time
          FROM logins l
          WHERE l.Member_ID = m.Member_ID
          ORDER BY l.Login_Date DESC, l.Login_Time DESC
          LIMIT 1
        ) AS Last_Login_Time
      FROM members m
      WHERE m.Member_State = 'Active'
      ORDER BY
        CASE
          WHEN (
            SELECT l.Login_State
            FROM logins l
            WHERE l.Member_ID = m.Member_ID
            ORDER BY l.Login_Date DESC, l.Login_Time DESC
            LIMIT 1
          ) = 'Connected' THEN 0
          ELSE 1
        END,
        m.Member_ID DESC
    `);

    const data = rows.map((member) => ({
      id: String(member.Member_ID),
      name: `${member.First_Name ?? ""} ${member.Last_Name ?? ""}`.trim(),
      email: member.Email || member.Line || "-",
      gender: member.Sex || "ไม่ได้ระบุ",
      postCount: Number(member.Post_Count ?? 0),
      status:
        member.Login_State === "Connected"
          ? "online"
          : "offline",
      suspended: false,
      suspendedDate: member.Member_Suspended_Date,
      suspendedTime: member.Member_Suspended_Time,
      reasonSuspended: member.Reason_Suspended,
      adminId: member.Admin_ID,
      lastLoginDate: member.Last_Login_Date,
      lastLoginTime: member.Last_Login_Time,
      loginState: member.Login_State,
    }));
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("GET ADMIN MEMBERS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "ไม่สามารถโหลดข้อมูลสมาชิกได้",
      error: error.message,
    });
  }
});
// ==========================================
// PUT - ระงับสมาชิก
// ==========================================
router.put("/:memberId/suspend", async (req, res) => {
  try {
    const { memberId } = req.params;
    const { adminId, reason } = req.body;
    console.log("===== SUSPEND MEMBER =====");
    console.log("memberId:", memberId);
    console.log("adminId:", adminId);
    console.log("reason:", reason);
    if (!adminId) {
      return res.status(400).json({
        success: false,
        message: "ไม่พบ Admin_ID",
      });
    }
    if (!reason || !String(reason).trim()) {
      return res.status(400).json({
        success: false,
        message: "กรุณาระบุเหตุผลในการระงับสมาชิก",
      });
    }
    const [result] = await pool.query(
      `
      UPDATE members
      SET
        Member_Suspended_Date = CURDATE(),
        Member_Suspended_Time = CURTIME(),
        Reason_Suspended = ?,
        Admin_ID = ?,
        Member_State = 'Inactive'
      WHERE Member_ID = ?
        AND Member_State = 'Active'
      `,
      [String(reason).trim(), adminId, memberId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบสมาชิก หรือสมาชิกไม่ได้อยู่ในสถานะ Active",
      });
    }
    return res.json({
      success: true,
      message: "ระงับสมาชิกเรียบร้อย",
    });
  } catch (error) {
    console.error("SUSPEND MEMBER ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "ไม่สามารถระงับสมาชิกได้",
      error: error.message,
    });
  }
});

module.exports = router;