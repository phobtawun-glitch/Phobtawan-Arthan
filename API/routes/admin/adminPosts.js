const express = require("express");
const router = express.Router();
const pool = require("../../db");
// ========================================
// GET /admin/posts
// ดึงโพสต์ทั้งหมดสำหรับ Admin
// ========================================
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        p.Post_ID,
        p.Posting_Name,
        p.Post_Type_ID,
        p.Post_State,
        p.Post_Start_Date,
        p.Post_Start_Time,
        p.Recrive_Date,
        p.Receive_Time,
        p.Post_Suspended_Date,
        p.Post_Suspended_Time,
        p.Member_ID,
        pt.Post_Type_Name,
        c.Category_Name
      FROM postings p
      LEFT JOIN post_types pt
        ON pt.Post_Type_ID = p.Post_Type_ID
      LEFT JOIN categorys c
        ON c.Category_ID = p.Category_ID
      ORDER BY p.Post_Start_Date DESC, p.Post_Start_Time DESC
    `);
    const posts = rows.map((row) => {
      const isSuspended =
        row.Post_Suspended_Date !== null &&
        row.Post_Suspended_Time !== null;
      const isReturned =
        row.Recrive_Date !== null &&
        row.Receive_Time !== null;
      let status = "searching";
      if (isSuspended) {
        status = "suspended";
      } else if (row.Post_State === "Working") {
        status = "searching";
      } else if (row.Post_State === "End" && isReturned) {
        status = "returned";
      } else if (row.Post_State === "End" && !isReturned) {
        status = "not_returned";
      }
      return {
        id: String(row.Post_ID),
        title: row.Posting_Name ?? "",
        type: String(row.Post_Type_ID),
        typeName: row.Post_Type_Name ?? "",
        status,
        createdAt: row.Post_Start_Date,
        postedTime: row.Post_Start_Time,
        postState: row.Post_State,
        suspendedDate: row.Post_Suspended_Date,
        suspendedTime: row.Post_Suspended_Time,
        memberId: row.Member_ID,
      };
    });
    res.json({
      success: true,
      data: posts,
    });
  } catch (error) {
    console.error("ADMIN POSTS GET ERROR:", error);
    res.status(500).json({
      success: false,
      message: "ไม่สามารถโหลดโพสต์ได้",
      error: error.message,
    });
  }
});
// ========================================
// PUT /admin/posts/:id/suspend
// ระงับโพสต์
// ========================================
router.put("/:id/suspend", async (req, res) => {
  try {
    const postId = req.params.id;
    const { adminId } = req.body;
    if (!adminId) {
      return res.status(400).json({
        success: false,
        message: "ไม่พบ Admin_ID",
      });
    }
    const [result] = await pool.query(
      `
      UPDATE postings
      SET
        Post_Suspended_Date = CURDATE(),
        Post_Suspended_Time = CURTIME(),
        Post_State = 'End',
        Admin_ID = ?
      WHERE Post_ID = ?
      `,
      [adminId, postId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบโพสต์",
      });
    }
    const [rows] = await pool.query(
      `
      SELECT
        Post_ID,
        Post_State,
        Admin_ID,
        Post_Suspended_Date,
        Post_Suspended_Time
      FROM postings
      WHERE Post_ID = ?
      `,
      [postId]
    );
    res.json({
      success: true,
      message: "ระงับโพสต์เรียบร้อย",
      data: rows[0],
    });
  } catch (error) {
    console.error("ADMIN POST SUSPEND ERROR:", error);
    res.status(500).json({
      success: false,
      message: "ไม่สามารถระงับโพสต์ได้",
      error: error.message,
    });
  }
});

router.get("/types", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        Post_Type_ID,
        Post_Type_Name
      FROM post_types
      ORDER BY Post_Type_ID
    `);
    res.json({
      success: true,
      data: rows.map(row => ({
        id: String(row.Post_Type_ID),
        name: row.Post_Type_Name,
      })),
    });
  } catch (error) {
    console.error("ADMIN POST TYPES ERROR:", error);
    res.status(500).json({
      success: false,
      message: "ไม่สามารถโหลดประเภทโพสต์ได้",
      error: error.message,
    });
  }
});

module.exports = router;