// routes/post_types.js
const express = require("express");
const router = express.Router();
const pool = require("../db");//db.js

// READ - ดึงผู้ใช้ทั้งหมด
router.get("/", async (req, res) => {
    try {
      const [rows] = await pool.query("SELECT * FROM post_types");
      res.json(rows);
    } catch (err) {
      res.status(500).json({error: err.message});
    }
  });

  // insert - method post
router.post("/", async (req, res) => {

  const { Post_Type_ID, Post_Type_Name } = req.body;

    try {
        const [result] = await pool.query(
          "INSERT INTO post_types (Post_Type_ID, Post_Type_Name) VALUES (?, ?)",  [Post_Type_ID, Post_Type_Name]
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
    const { Post_Type_ID, Post_Type_Name } = req.body;
    await pool.query("UPDATE post_types SET Post_Type_ID=?, Post_Type_Name=? WHERE post_typeid=?", 
      [Post_Type_ID, Post_Type_Name,id,]
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
    await pool.query("DELETE FROM post_types WHERE post_typeid=?", [id]);
    res.json({ message: "ลบสำเร็จ" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

