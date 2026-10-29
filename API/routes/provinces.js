// routes/provinces.js
const express = require("express");
const router = express.Router();
const pool = require("../db");//db.js

// READ - ดึงผู้ใช้ทั้งหมด
router.get("/", async (req, res) => {
    try {
      const [rows] = await pool.query("SELECT * FROM provinces");
      res.json(rows);
    } catch (err) {
      res.status(500).json({error: err.message});
    }
  });

  // insert - method post
router.post("/", async (req, res) => {

  const { Province_ID, Province_Name, Postal_Code, Province_Latitude, Province_Longitude } = req.body;

    try {
        const [result] = await pool.query(
          "INSERT INTO provinces (Province_ID, Province_Name, Postal_Code, Province_Latitude, Province_Longitude) VALUES (?, ?, ?, ?, ? )",  [Province_ID, Province_Name, Postal_Code, Province_Latitude, Province_Longitude]
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
    const { Province_ID, Province_Name, Postal_Code, Province_Latitude, Province_Longitude } = req.body;
    await pool.query("UPDATE provinces SET Province_ID=?, Province_Name=?, Postal_Code=?, Province_Latitude=?, Province_Longitude=? WHERE proid=?", 
      [Province_ID, Province_Name, Postal_Code, Province_Latitude, Province_Longitude,id,]
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
    await pool.query("DELETE FROM provinces WHERE proid=?", [id]);
    res.json({ message: "ลบสำเร็จ" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

