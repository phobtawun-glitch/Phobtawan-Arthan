const express = require("express");
const router = express.Router();
const pool = require("../db");
// READ - ดึงอำเภอทั้งหมด
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM districts");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ดึงอำเภอตามจังหวัด
router.get("/province/:provinceId", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT District_ID, District_Name FROM districts WHERE Province_ID = ? ORDER BY District_Name",
      [req.params.provinceId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// INSERT
router.post("/", async (req, res) => {
  const {
    District_ID,
    District_Name,
    District_Latitude,
    District_Longitude,
    Province_ID,
  } = req.body;
  try {
    const [result] = await pool.query(
      `INSERT INTO districts
      (District_ID, District_Name, District_Latitude, District_Longitude, Province_ID)
      VALUES (?, ?, ?, ?, ?)`,
      [
        District_ID,
        District_Name,
        District_Latitude,
        District_Longitude,
        Province_ID,
      ]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      District_ID,
      District_Name,
      District_Latitude,
      District_Longitude,
      Province_ID,
    } = req.body;
    await pool.query(
      `UPDATE districts
       SET District_ID=?,
           District_Name=?,
           District_Latitude=?,
           District_Longitude=?,
           Province_ID=?
       WHERE District_ID=?`,
      [
        District_ID,
        District_Name,
        District_Latitude,
        District_Longitude,
        Province_ID,
        id,
      ]
    );
    res.json({ message: "แก้ไขสำเร็จ" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(
      "DELETE FROM districts WHERE District_ID=?",
      [id]
    );
    res.json({ message: "ลบสำเร็จ" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;