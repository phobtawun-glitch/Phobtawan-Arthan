// routes/in_the_place.js
const express = require("express");
const router = express.Router();
const pool = require("../db");//db.js
const authMiddleware = require("../middleware/auth");

// READ - ดึงผู้ใช้ทั้งหมด
router.get("/", async (req, res) => {
    try {
      const [rows] = await pool.query("SELECT * FROM in_the_place");
      res.json(rows);
    } catch (err) {
      res.status(500).json({error: err.message});
    }
  });

// INSERT - บันทึกตำแหน่งของโพสต์
router.post("/", authMiddleware, async (req, res) => {
  const { IN_Latitude, IN_Longitude, Post_ID, Posting_Report_Date, Posting_Report_Time, Subdistrict_ID} = req.body;
  const Member_ID = req.user.memberId;
  try {
    const [result] = await pool.query(
      `INSERT INTO in_the_place
      ( IN_Latitude, IN_Longitude, Post_ID, Posting_Report_Date, Posting_Report_Time, Member_ID, Subdistrict_ID) VALUES (?, ?, ?, ?, ?, ?, ?)`, [IN_Latitude, IN_Longitude, Post_ID, Posting_Report_Date, Posting_Report_Time, Member_ID, Subdistrict_ID]
    );
    res.status(201).json({
      message: "บันทึกตำแหน่งสำเร็จ",
      id: result.insertId
    });
  } catch (err) {
    console.error("IN_THE_PLACE INSERT ERROR:", err);
    res.status(500).json({
      message: err.message,
      code: err.code,
      sqlMessage: err.sqlMessage
    });
  }
});

  // แก้ไขสมาชิก
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { IN_Latitude, IN_Longitude, Post_ID, Posting_Report_Date, Posting_Report_Time, Member_ID, Subdistrict_ID } = req.body;
    await pool.query("UPDATE in_the_place SET IN_Latitude=?, IN_Longitude=?, Post_ID=?, Posting_Report_Date=?, Posting_Report_Time=?, Member_ID=?, Subdistrict_ID=? WHERE inid=?", 
      [IN_Latitude, IN_Longitude, Post_ID, Posting_Report_Date, Posting_Report_Time, Member_ID, Subdistrict_ID,id,]
  );
    res.json({ message: "แก้ไขสำเร็จ" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ลบสมาชิก
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM in_the_place WHERE inid=?", [id]);
    res.json({ message: "ลบสำเร็จ" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;