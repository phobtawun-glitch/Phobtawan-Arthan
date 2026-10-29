// routes/categorys.js
const express = require("express");
const router = express.Router();
const pool = require("../db");//db.js
// READ - ดึงผู้ใช้ทั้งหมด
router.get("/", async (req, res) => {
    try {
      const [rows] = await pool.query("SELECT * FROM categorys");
      res.json(rows);
    } catch (err) {
      res.status(500).json({error: err.message});
    }
  });

// insert - method post
router.post("/", async (req, res) => {
  const { Category_ID, Category_Name } = req.body;
    try {
        const [result] = await pool.query(
          "INSERT INTO categorys (Category_ID, Category_Name) VALUES (?, ?)",  [Category_ID, Category_Name]
        );
        res.status(201).json({id: result.insertId});
      } catch (err) {
        res.status(500).json({error: err.message});
      }
  });

  // แก้ไขสมาชิก
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { Category_ID, Category_Name } = req.body;
    await pool.query("UPDATE categorys SET Category_ID=?, Category_Name=? WHERE catid=?", 
      [Category_ID, Category_Name,id,]
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
    await pool.query("DELETE FROM categorys WHERE catid=?", [id]);
    res.json({ message: "ลบสำเร็จ" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;