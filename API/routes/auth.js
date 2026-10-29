const express = require("express");
const router = express.Router();
const pool = require("../db");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/auth");

router.get(
  "/me",
  authMiddleware,
  async (req, res) => {
    const [rows] = await pool.query(
      "SELECT * FROM members WHERE Member_ID=?",
      [req.user.memberId]
    );
    res.json(rows[0]);
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.query(
      "SELECT * FROM members WHERE Email=? AND Member_Password=?",
      [email, password]
    );
    if (rows.length === 0) {
      return res.status(401).json({
        message: "Email หรือ Password ไม่ถูกต้อง"
      });
    }
    const member = rows[0];
    const token = jwt.sign(
      {memberId: member.Member_ID}, process.env.JWT_SECRET, {expiresIn: "7d"}
    );
    res.json({token, member});
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

module.exports = router;