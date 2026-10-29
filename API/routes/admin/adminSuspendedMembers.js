const express = require("express");
const router = express.Router();
const pool = require("../../db");
// ==========================================
// GET - สมาชิกที่ถูกระงับ
// แสดงเฉพาะ Member_State = Inactive
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
        m.Member_State,
        m.Member_Suspended_Date,
        m.Member_Suspended_Time,
        m.Reason_Suspended,
        m.Member_Unsuspended_Date,
        m.Member_Unsuspended_Time,
        m.Reason_Unsuspended,
        m.Admin_ID,
        (
          SELECT COUNT(*)
          FROM postings p
          WHERE p.Member_ID = m.Member_ID
        ) AS Post_Count
      FROM members m
      WHERE m.Member_State = 'Inactive'
      ORDER BY
        m.Member_Suspended_Date DESC,
        m.Member_Suspended_Time DESC,
        m.Member_ID DESC
    `);

    const data = rows.map((member) => ({
      id: String(member.Member_ID),
      name: `${member.First_Name ?? ""} ${member.Last_Name ?? ""}`.trim(),
      email: member.Email || member.Line || "-",
      gender: member.Sex || "ไม่ระบุ",
      postCount: Number(member.Post_Count ?? 0),
      status: "suspended",
      suspended: true,
      suspendedDate: member.Member_Suspended_Date,
      suspendedTime: member.Member_Suspended_Time,
      reasonSuspended: member.Reason_Suspended,
      unsuspendedDate: member.Member_Unsuspended_Date,
      unsuspendedTime: member.Member_Unsuspended_Time,
      reasonUnsuspended: member.Reason_Unsuspended,
      memberState: member.Member_State,
      adminId: member.Admin_ID,
    }));
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("GET SUSPENDED MEMBERS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "ไม่สามารถโหลดสมาชิกที่ถูกระงับได้",
      error: error.message,
    });
  }
});
// ==========================================
// PUT - ปลดระงับสมาชิก
// ==========================================
router.put("/:memberId/unsuspend", async (req, res) => {
  try {
    const { memberId } = req.params;
    const { adminId, reason } = req.body;
    if (!adminId) {
      return res.status(400).json({
        success: false,
        message: "ไม่พบ Admin_ID",
      });
    }
    if (!reason || !String(reason).trim()) {
      return res.status(400).json({
        success: false,
        message: "กรุณาระบุเหตุผลในการปลดระงับสมาชิก",
      });
    }
    const trimmedReason = String(reason).trim();
    const [result] = await pool.query(
      `
      UPDATE members
      SET
        Member_Unsuspended_Date = CURDATE(),
        Member_Unsuspended_Time = CURTIME(),
        Reason_Unsuspended = ?,
        Admin_ID = ?,
        Member_State = 'Active'
      WHERE Member_ID = ?
        AND Member_State = 'Inactive'
      `,
      [trimmedReason, adminId, memberId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบสมาชิกที่ถูกระงับ หรือสมาชิกถูกปลดระงับแล้ว",
      });
    }
    return res.json({
      success: true,
      message: "ปลดระงับสมาชิกเรียบร้อย",
    });
  } catch (error) {
    console.error("UNSUSPEND MEMBER ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "ไม่สามารถปลดระงับสมาชิกได้",
      error: error.message,
    });
  }
});

module.exports = router;