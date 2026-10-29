const express = require("express");
const router = express.Router();
const pool = require("../../db");
// ==========================================
// GET - รายงานที่ยังไม่ได้ตรวจสอบ
// ==========================================
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        pr.Report_Title_ID,
        pr.Member_ID,
        pr.Post_ID,
        pr.Report_ID,
        CONCAT(DATE_FORMAT(pr.Post_Report_Date, '%d/%m/'), YEAR(pr.Post_Report_Date) + 543) AS Post_Report_Date,
        pr.Reason,
        pr.Admin_ID,
        p.Posting_Name,
        CONCAT(COALESCE(m.First_Name, ''), ' ', COALESCE(m.Last_Name, '')) AS Reporter_Name
      FROM post_reports pr
      LEFT JOIN postings p
        ON p.Post_ID = pr.Post_ID
      LEFT JOIN members m
        ON m.Member_ID = pr.Member_ID
      WHERE pr.Admin_ID IS NULL AND (p.Post_State IS NULL OR p.Post_State <> 'End')
      ORDER BY
        pr.Post_Report_Date DESC,
        pr.Post_Report_Time DESC
    `);
    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("GET ADMIN REPORTS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "ไม่สามารถโหลดรายงานได้",
      error: error.message,
    });
  }
});
// ==========================================
// SUSPEND - ระงับโพสต์
// ==========================================
router.put("/:reportId/suspend", async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { reportId } = req.params;
    const { adminId } = req.body;
    console.log("===== SUSPEND REPORT =====");
    console.log("Report ID =", reportId);
    console.log("Admin ID =", adminId);
    if (!adminId) {
      return res.status(400).json({
        success: false,
        message: "ไม่พบ Admin_ID",
      });
    }
    await connection.beginTransaction();
    const [reports] = await connection.query(
      `
      SELECT
        Report_Title_ID,
        Post_ID
      FROM post_reports
      WHERE Report_Title_ID = ?
      LIMIT 1
      `,
      [reportId]
    );
    if (reports.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "ไม่พบรายงาน",
      });
    }
    const postId = reports[0].Post_ID;
    console.log("Post ID =", postId);
    // ==========================================
    // 1. ระงับโพสต์
    // ==========================================
    const [postResult] = await connection.query(
      `
      UPDATE postings
      SET
        Post_Suspended_Date = CURDATE(),
        Post_Suspended_Time = CURTIME(),
        Post_State = 'End',
        Admin_ID = ?
      WHERE Post_ID = ?
      `,
      [adminId, postId]
    );
    console.log("POSTINGS UPDATE =", postResult);
    if (postResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "ไม่พบโพสต์ที่ต้องการระงับ",
      });
    }
    // ==========================================
    // 2. บันทึก Admin_ID ลง post_reports
    // ==========================================
    const [reportResult] = await connection.query(
      `
      UPDATE post_reports
      SET Admin_ID = ?
      WHERE Report_Title_ID = ?
        AND Admin_ID IS NULL
      `,
      [adminId, reportId]
    );
    console.log("POST_REPORTS UPDATE =", reportResult);
    if (reportResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "ไม่สามารถบันทึก Admin_ID ลงรายงานได้",
      });
    }
    // ทุกอย่างสำเร็จ
    await connection.commit();
    res.json({
      success: true,
      message: "ระงับโพสต์และบันทึก Admin เรียบร้อย",
    });
  } catch (error) {
    await connection.rollback();
    console.error("SUSPEND REPORT ERROR:", error);
    res.status(500).json({
      success: false,
      message: "ไม่สามารถระงับโพสต์ได้",
      error: error.message,
    });
  } finally {
    connection.release();
  }
});
// ==========================================
// COMPLETE - ตรวจสอบเสร็จสิ้น
// ==========================================
router.put("/:reportId/complete", async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { reportId } = req.params;
    const { adminId } = req.body;
    if (!adminId) {
      return res.status(400).json({
        success: false,
        message: "ไม่พบ Admin_ID",
      });
    }
    await connection.beginTransaction();
    // 1. ค้นหารายงานและ Post_ID
    const [reports] = await connection.query(
      `
      SELECT Report_Title_ID, Post_ID
      FROM post_reports
      WHERE Report_Title_ID = ?
        AND Admin_ID IS NULL
      LIMIT 1
      `,
      [reportId]
    );
    if (reports.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "ไม่พบรายงานที่รอตรวจสอบ",
      });
    }
    const postId = reports[0].Post_ID;
    // 2. บันทึก Admin_ID ลง post_reports
    const [reportResult] = await connection.query(
      `
      UPDATE post_reports
      SET Admin_ID = ?
      WHERE Report_Title_ID = ?
        AND Admin_ID IS NULL
      `,
      [adminId, reportId]
    );
    if (reportResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "ไม่สามารถบันทึก Admin_ID ลงรายงานได้",
      });
    }
    // 3. บันทึก Admin_ID ลง postings
    if (postId !== null && postId !== undefined) {
      const [postResult] = await connection.query(
        `
        UPDATE postings
        SET Admin_ID = ?
        WHERE Post_ID = ?
        `,
        [adminId, postId]
      );
      if (postResult.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: "ไม่พบโพสต์ที่ต้องการบันทึก Admin_ID",
        });
      }
    }
    // 4. ยืนยันการบันทึกทั้งสองตาราง
    await connection.commit();
    return res.json({
      success: true,
      message: "ตรวจสอบรายงานและบันทึก Admin_ID เรียบร้อย",
    });
  } catch (error) {
    await connection.rollback();
    console.error("COMPLETE REPORT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "ไม่สามารถบันทึกการตรวจสอบได้",
      error: error.message,
    });
  } finally {
    connection.release();
  }
});

module.exports = router;