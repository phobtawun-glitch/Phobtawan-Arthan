const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const uploadDir = path.join(__dirname, '..', 'uploads', 'comments');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `comment_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('อนุญาตเฉพาะไฟล์รูปภาพ'));
  },
});
// GET comments ของโพสต์
router.get('/post/:postId', authMiddleware, async (req, res) => {
  try {
    const { postId } = req.params;
    const [rows] = await pool.query(
      `
      SELECT
        c.Comment_Start_Date,
        c.Comment_Start_Time,
        c.Post_ID,
        c.Member_ID,
        c.Reply_To_Member_ID,
        c.Comment_Image,
        c.Comment_Message,
        c.Comment_Latitude,
        c.Comment_Longitude,
        m.First_Name,
        m.Last_Name
      FROM comments c
      LEFT JOIN members m ON c.Member_ID = m.Member_ID
      WHERE c.Post_ID = ?
      ORDER BY c.Comment_Start_Date ASC, c.Comment_Start_Time ASC
      `,
      [postId]
    );
    res.json(rows);
  } catch (err) {
    console.error('GET COMMENTS ERROR =', err);
    res.status(500).json({ error: err.message });
  }
});
// POST comment + รูปภาพ 1 รูป + ตำแหน่ง 1 จุด
router.post('/', authMiddleware, upload.single('Comment_Image'), async (req, res) => {
  const {
    Comment_Start_Date,
    Comment_Start_Time,
    Post_ID,
    Member_ID,
    Reply_To_Member_ID,
    Comment_Message,
    Comment_Latitude,
    Comment_Longitude,
  } = req.body;
  const Comment_Image = req.file ? req.file.filename : null;
  if (Number(Member_ID) !== Number(req.user.memberId)) {
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(403).json({ error: 'ไม่มีสิทธิ์ส่งข้อความในบัญชีนี้' });
  }
  if (!Comment_Start_Date || !Comment_Start_Time || !Post_ID || !Member_ID) {
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: 'ข้อมูล Comment ไม่ครบ' });
  }
  if (!Comment_Message && !Comment_Image &&
      (Comment_Latitude === undefined || Comment_Longitude === undefined)) {
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: 'ต้องมีข้อความ รูปภาพ หรือตำแหน่งอย่างน้อย 1 อย่าง' });
  }
  try {
    const latitude = Comment_Latitude === undefined || Comment_Latitude === ''
      ? null
      : Number(Comment_Latitude);
    const longitude = Comment_Longitude === undefined || Comment_Longitude === ''
      ? null
      : Number(Comment_Longitude);
    if ((latitude !== null && !Number.isFinite(latitude)) ||
        (longitude !== null && !Number.isFinite(longitude))) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: 'Latitude/Longitude ไม่ถูกต้อง' });
    }
    const [result] = await pool.query(
      `
      INSERT INTO comments (
        Comment_Start_Date,
        Comment_Start_Time,
        Post_ID,
        Member_ID,
        Reply_To_Member_ID,
        Comment_Image,
        Comment_Message,
        Comment_Latitude,
        Comment_Longitude
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        Comment_Start_Date,
        Comment_Start_Time,
        Post_ID,
        Member_ID,
        Reply_To_Member_ID || null,
        Comment_Image,
        Comment_Message || null,
        latitude,
        longitude,
      ]
    );
    res.status(201).json({
      message: 'ส่งข้อความเรียบร้อย',
      id: result.insertId || null,
      imageUrl: Comment_Image,
    });
  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    console.error('CREATE COMMENT ERROR =', err);
    res.status(500).json({ error: err.message });
  }
});
// DELETE comment — ใช้คีย์ร่วมของตาราง comments
router.delete('/', authMiddleware, async (req, res) => {
  const {
    Comment_Start_Date,
    Comment_Start_Time,
    Post_ID,
    Member_ID,
  } = req.body;
  if (!Comment_Start_Date || !Comment_Start_Time || !Post_ID || !Member_ID) {
    return res.status(400).json({ error: 'ข้อมูลสำหรับลบ Comment ไม่ครบ' });
  }
  try {
    const [rows] = await pool.query(
      `
      SELECT Comment_Image
      FROM comments
      WHERE Comment_Start_Date = ?
        AND Comment_Start_Time = ?
        AND Post_ID = ?
        AND Member_ID = ?
      LIMIT 1
      `,
      [Comment_Start_Date, Comment_Start_Time, Post_ID, Member_ID]
    );
    await pool.query(
      `
      DELETE FROM comments
      WHERE Comment_Start_Date = ?
        AND Comment_Start_Time = ?
        AND Post_ID = ?
        AND Member_ID = ?
      `,
      [Comment_Start_Date, Comment_Start_Time, Post_ID, Member_ID]
    );
    if (rows[0]?.Comment_Image) {
      const imagePath = path.join(uploadDir, rows[0].Comment_Image);
      fs.unlink(imagePath, () => {});
    }
    res.json({ message: 'ลบความคิดเห็นแล้ว' });
  } catch (err) {
    console.error('DELETE COMMENT ERROR =', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;