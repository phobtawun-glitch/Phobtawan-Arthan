const express = require("express");
const router = express.Router();
const pool = require("../../db");
// ==========================================
// GET - โพสต์ที่ถูกระงับ
// ==========================================
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        p.Post_ID,
        p.Posting_Name,
        p.Post_State,
        p.Post_Type_ID,
        p.Member_ID,
        CONCAT(DATE_FORMAT(p.Post_Suspended_Date, '%d/%m/'), YEAR(p.Post_Suspended_Date) + 543) AS Post_Suspended_Date,
        pr.Report_Title_ID,
        pr.Reason,
        pr.Admin_ID AS Report_Admin_ID,
        pt.Post_Type_Name,
        CONCAT(COALESCE(m.First_Name, ''), ' ', COALESCE(m.Last_Name, '')
        ) AS Author_Name
      FROM postings p
      LEFT JOIN post_reports pr
        ON pr.Report_Title_ID = (
          SELECT pr2.Report_Title_ID
          FROM post_reports pr2
          WHERE pr2.Post_ID = p.Post_ID
            AND pr2.Admin_ID IS NOT NULL
          ORDER BY pr2.Report_Title_ID DESC
          LIMIT 1
        )
      LEFT JOIN post_types pt
        ON p.Post_Type_ID = pt.Post_Type_ID
      LEFT JOIN members m
        ON p.Member_ID = m.Member_ID
      WHERE p.Post_State = 'End'
        AND p.Post_Suspended_Date IS NOT NULL
        AND p.Post_Suspended_Time IS NOT NULL
      ORDER BY
        p.Post_Suspended_Date DESC,
        p.Post_Suspended_Time DESC
    `);
    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("GET SUSPENDED POSTS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "ไม่สามารถโหลดโพสต์ที่ถูกระงับได้",
      error: error.message,
    });
  }
});

module.exports = router;