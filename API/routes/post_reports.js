// routes/post_reports.js

const express = require("express");
const router = express.Router();
const pool = require("../db");


// =====================================================
// GET /post_reports/reasons
// ดึงเหตุผลจากตาราง reports
// =====================================================
router.get("/reasons", async (req, res) => {
  try {

    const [rows] = await pool.query(`
      SELECT
        Report_ID,
        Report_Name
      FROM reports
      ORDER BY Report_ID ASC
    `);

    res.json(rows);

  } catch (err) {

    console.error("GET REPORT REASONS ERROR =", err);

    res.status(500).json({
      error: err.message
    });
  }
});


// =====================================================
// GET /post_reports
// ดึงรายงานทั้งหมด
// =====================================================
router.get("/", async (req, res) => {
  try {

    const [rows] = await pool.query(`
      SELECT
        pr.Report_Title_ID,
        pr.Post_Report_Date,
        pr.Post_Report_Time,
        pr.Reason,
        pr.Member_ID,
        pr.Post_ID,
        pr.Report_ID,
        r.Report_Name,
        pr.Admin_ID
      FROM post_reports pr
      LEFT JOIN reports r
        ON pr.Report_ID = r.Report_ID
      ORDER BY
        pr.Post_Report_Date DESC,
        pr.Post_Report_Time DESC
    `);

    res.json(rows);

  } catch (err) {

    console.error("GET POST REPORTS ERROR =", err);

    res.status(500).json({
      error: err.message
    });
  }
});


// =====================================================
// POST /post_reports
// เพิ่มรายงานโพสต์
// =====================================================
router.post("/", async (req, res) => {
  try {
    const [columns] = await pool.query(`
      SHOW COLUMNS FROM post_reports
    `);

    console.log("POST_REPORTS COLUMNS =", columns);

  } catch (err) {
    console.error("CHECK TABLE ERROR =", err);
  }
  console.log("POST /post_reports BODY =", req.body);

  const {
    Post_Report_Date,
    Post_Report_Time,
    Reason,
    Member_ID,
    Post_ID,
    Report_ID,
    Admin_ID
  } = req.body;


  // ตรวจข้อมูลที่จำเป็น
  if (
    !Post_Report_Date ||
    !Post_Report_Time ||
    !Member_ID ||
    !Post_ID ||
    !Report_ID
  ) {
    return res.status(400).json({
      error: "ข้อมูลการรายงานไม่ครบ"
    });
  }


  try {

    const [result] = await pool.query(
      `
      INSERT INTO post_reports (
        Post_Report_Date,
        Post_Report_Time,
        Reason,
        Member_ID,
        Post_ID,
        Report_ID,
        Admin_ID
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        Post_Report_Date,
        Post_Report_Time,
        Reason || null,
        Member_ID,
        Post_ID,
        Report_ID,
        Admin_ID || null
      ]
    );


    res.status(201).json({
      message: "ส่งรายงานเรียบร้อย",
      Report_Title_ID: result.insertId
    });


  } catch (err) {

    console.error("CREATE POST REPORT ERROR =", err);

    res.status(500).json({
      error: err.message
    });
  }
});

module.exports = router;