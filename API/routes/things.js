// routes/things.js
const express = require("express");
const router = express.Router();
const pool = require("../db");//db.js

// READ - ดึงผู้ใช้ทั้งหมด
router.get("/", async (req, res) => {
    try {
      const [rows] = await pool.query("SELECT * FROM things");
      res.json(rows);
    } catch (err) {
      res.status(500).json({error: err.message});
    }
  });

  // insert - method post
router.post("/", async (req, res) => {

  const { Thing_ID, Thing_Name } = req.body;

    try {
        const [result] = await pool.query(
          "INSERT INTO things (Thing_ID, Thing_Name) VALUES (?, ?)",  [Thing_ID, Thing_Name]
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
    const { Thing_ID, Thing_Name } = req.body;
    await pool.query("UPDATE things SET Thing_ID=?, Thing_Name=? WHERE thingid=?", 
      [Thing_ID, Thing_Name,id,]
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
    await pool.query("DELETE FROM things WHERE thingid=?", [id]);
    res.json({ message: "ลบสำเร็จ" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

