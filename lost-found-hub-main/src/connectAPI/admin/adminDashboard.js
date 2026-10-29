const express = require("express");
const router = express.Router();
const pool = require("../../db");

// ==========================================
// ADMIN DASHBOARD - STATS
// ==========================================
router.get("/stats", async (req, res) => {
  try {
    // ==========================================
    // 1. โพสต์ทั้งหมด
    // ==========================================
    const [postRows] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM postings
    `);

    // ==========================================
    // 2. สมาชิกทั้งหมด
    // ==========================================
    const [memberRows] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM members
    `);

    // ==========================================
    // 3. ได้รับคืน
    //
    // ต้องมีข้อมูลครบทั้ง 5 column
    // ==========================================
    const [returnedRows] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM postings
      WHERE
        Recrive_Date IS NOT NULL
        AND Receive_Time IS NOT NULL
        AND Receiver_Image IS NOT NULL
        AND Receiver_Name IS NOT NULL
        AND Receiver_Contact IS NOT NULL
    `);

    // ==========================================
    // 4. ไม่ได้รับคืน
    //
    // มีข้อมูลวันและเวลาที่ถูกระงับ
    // ==========================================
    const [notReturnedRows] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM postings
      WHERE
        Post_Suspended_Date IS NOT NULL
        AND Post_Suspended_Time IS NOT NULL
    `);

    res.json({
      success: true,
      stats: {
        posts: Number(postRows[0].total),
        members: Number(memberRows[0].total),
        returned: Number(returnedRows[0].total),
        notReturned: Number(notReturnedRows[0].total),
      },
    });

  } catch (err) {
    console.error("ADMIN DASHBOARD STATS ERROR:", err);

    res.status(500).json({
      success: false,
      message: "ไม่สามารถโหลดข้อมูล Dashboard ได้",
      error: err.message,
    });
  }
});

module.exports = router;