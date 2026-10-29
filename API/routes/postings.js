const authMiddleware = require("../middleware/auth");
const jwt = require("jsonwebtoken");
const express = require("express");
const router = express.Router();
const pool = require("../db"); // db.js
const upload = require("../middleware/upload");
const { getMatchingPostsBySubdistrict, getOnlineMembersBySubdistrict, buildLineNotificationMessage, } = require("../services/postNotificationService");
const { sendEmailNotification } = require("../services/emailNotification");
const { sendLineNotification } = require("../services/lineNotification");
const { notifyOnlineMembersInSubdistrict, buildPostNotification } = require("../services/onlineMemberNotificationService");
const { findSubdistrictByGPS } = require("../services/locationService");

// ==========================================
// 1. READ ALL - ดึงประกาศทั้งหมด (เพิ่มเข้ามาเพื่อแก้ 404)
// ==========================================
router.get("/", async (req, res) => {
  try {

    // อัปเดตสถานะโพสต์ที่หมดอายุเป็น End
    await pool.query(`
      UPDATE postings
      SET Post_State = 'End'
      WHERE DATEDIFF(CURDATE(), Post_Start_Date) >= 30
      AND Post_State <> 'End'
    `);

    // ดึงเฉพาะโพสต์ที่ยังใช้งาน
    const [rows] = await pool.query(`
      SELECT
        p.*,
        p.Post_Start_Date AS createdAt,
        p.Post_Start_Time AS postedTime,
        pt.Post_Type_Name,
        c.Category_Name
      FROM postings p
      LEFT JOIN post_types pt
        ON p.Post_Type_ID = pt.Post_Type_ID
      LEFT JOIN categorys c
        ON p.Category_ID = c.Category_ID
      WHERE p.Post_State = 'Working'
      ORDER BY p.Post_ID DESC
    `);

    res.json(rows);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get(
  "/my-posts",
  authMiddleware,
  async (req, res) => {
    try {
      const Member_ID = req.user.memberId;

      console.log("GET MY POSTS");
      console.log("Member_ID =", Member_ID);

      const [rows] = await pool.query(
        `
        SELECT
          p.*,
          pt.Post_Type_Name,
          c.Category_Name
        FROM postings p
        LEFT JOIN post_types pt
          ON p.Post_Type_ID = pt.Post_Type_ID
        LEFT JOIN categorys c
          ON p.Category_ID = c.Category_ID
        WHERE p.Member_ID = ?
        ORDER BY p.Post_ID DESC
        `,
        [Member_ID]
      );

      res.json(rows);

    } catch (err) {
      console.error("GET MY POSTS ERROR:", err);

      res.status(500).json({
        error: err.message
      });
    }
  }
);
// ==========================================
// 2. READ BY ID - ดึงประกาศรายบุคคลตาม ID
// ==========================================
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // ตรวจ token แบบ optional: บุคคลทั่วไปดูโพสต์ได้ แต่ข้อมูลอ่อนไหวส่งให้เฉพาะผู้เข้าสู่ระบบ
    let isLoggedIn = false;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
        isLoggedIn = true;
      } catch (_tokenError) {
        return res.status(401).json({ message: "Token ไม่ถูกต้อง" });
      }
    }

    const [rows] = await pool.query(
      `
      SELECT
        p.*,
        c.Category_Name,
        pt.Post_Type_Name,
        ip.IN_Latitude,
        ip.IN_Longitude,
        s.Subdistrict_Name,
        d.District_Name,
        pr.Province_Name
      FROM postings p
      LEFT JOIN categorys c
        ON p.Category_ID = c.Category_ID
      LEFT JOIN post_types pt
        ON p.Post_Type_ID = pt.Post_Type_ID
      LEFT JOIN in_the_place ip
        ON p.Post_ID = ip.Post_ID
      LEFT JOIN subdistricts s
        ON ip.Subdistrict_ID = s.Subdistrict_ID
      LEFT JOIN districts d
        ON s.District_ID = d.District_ID
      LEFT JOIN provinces pr
        ON d.Province_ID = pr.Province_ID
      WHERE p.Post_ID = ?
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบโพสต์" });
    }

    const post = { ...rows[0] };

    if (isLoggedIn) {
      post.gpsPoints = rows
        .filter((row) => row.IN_Latitude != null && row.IN_Longitude != null)
        .map((row) => ({
          latitude: row.IN_Latitude,
          longitude: row.IN_Longitude,
        }));
    } else {
      // ไม่ส่งข้อมูลที่ถูกซ่อนในหน้าเว็บให้ guest ผ่าน API
      delete post.Place_Name;
      delete post.Post_Detail;
      delete post.IN_Latitude;
      delete post.IN_Longitude;
      delete post.Subdistrict_Name;
      delete post.District_Name;
      delete post.Province_Name;
      // ห้ามส่งพิกัด GPS ไปให้ผู้ที่ยังไม่เข้าสู่ระบบ
      delete post.gpsPoints;
    }

    // ไม่ส่งพิกัดเดี่ยวจากแถว SQL ซ้ำใน response
    delete post.IN_Latitude;
    delete post.IN_Longitude;
    res.json(post);
  } catch (err) {
    console.error("GET POST DETAIL ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. INSERT - สร้างประกาศใหม่
// ==========================================
router.post(
  "/",
  authMiddleware,
  upload.single("Post_Image"),
  async (req, res) => {

    const {
      Posting_Name,
      Category_ID,
      Post_Suspended_Date,
      Post_Suspended_Time,
      Post_Start_Date,
      Post_Start_Time,
      About_Thing_Date,
      Recrive_Date,
      Receive_Time,
      Post_Close_Date,
      Post_Close_Time,
      Post_State,
      Place_Name,
      Post_Detail,
      Post_Type_ID,
      Admin_ID,
      gpsPoints,
      Subdistrict_ID
    } = req.body;

    const Post_Image = req.file ? req.file.filename : null;
    const Member_ID = req.user.memberId;

    console.log("=================================");
    console.log("CREATE POST");
    console.log("Member_ID =", Member_ID);
    console.log("Subdistrict_ID =", Subdistrict_ID);
    console.log("gpsPoints =", gpsPoints);
    console.log("=================================");

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      // ==========================================
      // 1. INSERT postings
      // ==========================================
      const [postResult] = await connection.query(
        `
        INSERT INTO postings (
          Posting_Name,
          Category_ID,
          Member_ID,
          Post_Suspended_Date,
          Post_Suspended_Time,
          Post_Start_Date,
          Post_Start_Time,
          About_Thing_Date,
          Recrive_Date,
          Receive_Time,
          Post_Close_Date,
          Post_Close_Time,
          Post_State,
          Place_Name,
          Post_Detail,
          Post_Image,
          Post_Type_ID,
          Admin_ID
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          Posting_Name,
          Category_ID,
          Member_ID,
          Post_Suspended_Date || null,
          Post_Suspended_Time || null,
          Post_Start_Date,
          Post_Start_Time,
          About_Thing_Date || null,
          Recrive_Date || null,
          Receive_Time || null,
          Post_Close_Date,
          Post_Close_Time,
          Post_State,
          Place_Name,
          Post_Detail,
          Post_Image,
          Post_Type_ID,
          Admin_ID || null
        ]
      );

      const Post_ID = postResult.insertId;
      console.log("New Post_ID =", Post_ID);

      // ==========================================
      // 2. บันทึก GPS 
      // ==========================================
      if (gpsPoints) {
        const parsedGpsPoints = JSON.parse(gpsPoints);
        console.log("GPS ที่แปลงแล้ว =", parsedGpsPoints);
        if (
          Array.isArray(parsedGpsPoints) &&
          parsedGpsPoints.length > 0
        ) {
          for (const point of parsedGpsPoints) {
            await connection.query(
              `
              INSERT INTO in_the_place (
                IN_Latitude,
                IN_Longitude,
                Post_ID,
                Member_ID,
                Subdistrict_ID
              )
              VALUES (?, ?, ?, ?, ?)
              `,
              [
                point.latitude,
                point.longitude,
                Post_ID,
                Member_ID,
                Subdistrict_ID
              ]
            );
          }
          console.log(
            `บันทึก GPS สำเร็จ ${parsedGpsPoints.length} จุด`);
        }
      }

      // ==========================================
      // 3. Commit
      // ==========================================
      await connection.commit();

      console.log("สร้างโพสต์สำเร็จ Post_ID =", Post_ID);

      // แจ้งสมาชิกที่ออนไลน์อยู่ในตำบลเดียวกัน โดยไม่แจ้งเจ้าของโพสต์
      try {
        let postSubdistrict = null;
        if (Subdistrict_ID) {
          const [subdistrictRows] = await pool.query(
            "SELECT Subdistrict_ID, Subdistrict_Name FROM subdistricts WHERE Subdistrict_ID = ? LIMIT 1",
            [Subdistrict_ID]
          );
          postSubdistrict = subdistrictRows[0] || null;
        }

        if (!postSubdistrict && gpsPoints) {
          const parsedPoints = JSON.parse(gpsPoints);
          if (Array.isArray(parsedPoints) && parsedPoints.length > 0) {
            postSubdistrict = await findSubdistrictByGPS(
              parsedPoints[0].latitude,
              parsedPoints[0].longitude
            );
          }
        }

        if (postSubdistrict) {
          const notice = buildPostNotification({
            postName: Posting_Name,
            placeName: Place_Name,
            subdistrictName: postSubdistrict.Subdistrict_Name,
          });
          const notificationResult = await notifyOnlineMembersInSubdistrict({
            subdistrictId: postSubdistrict.Subdistrict_ID,
            excludeMemberId: Member_ID,
            ...notice,
          });
          console.log("NEW POST NOTIFICATION RESULT:", notificationResult);
        } else {
          console.log("ไม่สามารถระบุตำบลของโพสต์ จึงข้ามการแจ้งเตือน");
        }
      } catch (notificationError) {
        // การแจ้งเตือนล้มเหลวต้องไม่ทำให้โพสต์ที่บันทึกสำเร็จแล้วถูกตอบกลับเป็น error
        console.error("NEW POST NOTIFICATION ERROR:", notificationError);
      }

      res.status(201).json({
        message: "สร้างโพสต์และบันทึกสถานที่สำเร็จ",
        id: Post_ID,
        Post_ID: Post_ID,
        Member_ID: Member_ID
      });

    } catch (err) {

      // ถ้ามี error ยกเลิกทุกอย่าง
      await connection.rollback();

      console.error("CREATE POST ERROR:", err);

      res.status(500).json({
        message: err.message,
        code: err.code,
        sqlMessage: err.sqlMessage
      });

    } finally {

      connection.release();

    }
  }
);

router.patch("/:id/receive", async (req, res) => {
  try {
    const { id } = req.params;

    // ใช้เวลาปัจจุบันของเครื่อง Backend
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");

    const Recrive_Date =
      `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    const Receive_Time =
      `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const [result] = await pool.query(
      `UPDATE postings
       SET Recrive_Date = ?,
           Receive_Time = ?,
           Post_State = 'End'
       WHERE Post_ID = ?`,
      [Recrive_Date, Receive_Time, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "ไม่พบโพสต์ที่ต้องการรับคืน" });
    }

    res.json({
      success: true,
      message: "ยืนยันรับคืนสำเร็จ",
      Recrive_Date,
      Receive_Time,
      Post_State: "End",
    });
  } catch (err) {
    console.error("CONFIRM RECEIVE ERROR:", err);
    res.status(500).json({
      message: "บันทึกการรับคืนไม่สำเร็จ",
      error: err.message,
    });
  }
});

// ==========================================
// 4. UPDATE - แก้ไขประกาศ
// ==========================================
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      Posting_Name, Category_ID, 
      Post_Suspended_Date, Post_Suspended_Time, Post_Start_Date, 
      Post_Start_Time, About_Thing_Date, Recrive_Date, Receive_Time, 
      Post_Close_Date, Post_Close_Time, Post_State, Place_Name, Post_Detail,
      Post_Image, Post_Type_ID, Admin_ID 
    } = req.body;

    await pool.query(
      "UPDATE postings SET Posting_Name=?, Category_ID=?, Post_Suspended_Date=?, Post_Suspended_Time=?, Post_Start_Date=?, Post_Start_Time=?, About_Thing_Date=?, Recrive_Date=?, Receive_Time=?, Post_Close_Date=?, Post_Close_Time=?, Post_State=?, Place_Name=?, Post_Detail=?, Post_Image=?, Post_Type_ID=?, Admin_ID=? WHERE Post_ID=?", 
      [Posting_Name, Category_ID, Post_Suspended_Date, Post_Suspended_Time, Post_Start_Date, Post_Start_Time, About_Thing_Date, Recrive_Date, Receive_Time, Post_Close_Date, Post_Close_Time, Post_State, Place_Name, Post_Detail, Post_Image, Post_Type_ID, Admin_ID, id]
    );
    res.json({ message: "แก้ไขสำเร็จ" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. DELETE - ลบประกาศ
// ==========================================
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM postings WHERE Post_ID=?", [id]);
    res.json({ message: "ลบสำเร็จ" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;