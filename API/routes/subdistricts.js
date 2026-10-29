// routes/subdistricts.js
const express = require("express");
const router = express.Router();
const pool = require("../db");//db.js

// READ - ดึงผู้ใช้ทั้งหมด
router.get("/", async (req, res) => {
    try {
      const [rows] = await pool.query("SELECT * FROM subdistricts");
      res.json(rows);
    } catch (err) {
      res.status(500).json({error: err.message});
    }
  });

  // insert - method post
router.post("/", async (req, res) => {

  const { Subdistrict_ID, Subdistrict_Name, Subdistrict_Latitude, Subdistrict_Longitude, District_ID } = req.body;

    try {
        const [result] = await pool.query(
          "INSERT INTO subdistricts (Subdistrict_ID, Subdistrict_Name, Subdistrict_Latitude, Subdistrict_Longitude, District_ID) VALUES (?, ?, ?, ?, ?)",  [Subdistrict_ID, Subdistrict_Name, Subdistrict_Latitude, Subdistrict_Longitude, District_ID]
        );
        res
          .status(201)
          .json({id: result.insertId});
      } catch (err) {
        res.status(500).json({error: err.message});
      }
  });

  // แก้ไขสมาชิก
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { Subdistrict_ID, Subdistrict_Name, Subdistrict_Latitude, Subdistrict_Longitude, District_ID } = req.body;
    await pool.query("UPDATE subdistricts SET Subdistrict_ID=?, Subdistrict_Name=?, Subdistrict_Latitude=?, Subdistrict_Longitude=?, District_ID=? WHERE subid=?", 
      [Subdistrict_ID, Subdistrict_Name, Subdistrict_Latitude, Subdistrict_Longitude, District_ID,id,]
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
    await pool.query("DELETE FROM subdistricts WHERE subid=?", [id]);
    res.json({ message: "ลบสำเร็จ" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ดึงตำบลตามอำเภอ
router.get("/district/:districtId", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT Subdistrict_ID, Subdistrict_Name
       FROM subdistricts
       WHERE District_ID = ?
       ORDER BY Subdistrict_Name`,
      [req.params.districtId]
    );

    res.json(rows);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

