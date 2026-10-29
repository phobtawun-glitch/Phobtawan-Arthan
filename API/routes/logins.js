// routes/logins.js
const express = require("express");
const router = express.Router();
const pool = require("../db");
const jwt = require("jsonwebtoken");
const { findSubdistrictByGPS } = require("../services/locationService");
const {getMatchingPostsBySubdistrict, buildLineNotificationMessage,} = require("../services/postNotificationService");
const {sendLineNotification,} = require("../services/lineNotification");
const {sendEmailNotification,} = require("../services/emailNotification");
const { notifyOnlineMembersInSubdistrict, buildLoginNotification } = require("../services/onlineMemberNotificationService");

const formatDate = (date) => {
  if (!date) {
    return "-";
  }
  const d = new Date(date);
  const day = String(
    d.getDate()
  ).padStart(2, "0");
  const month = String(
    d.getMonth() + 1
  ).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT *
      FROM logins
      ORDER BY Sequence_ID DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error("GET LOGINS ERROR =", err);
    res.status(500).json({
      error: err.message
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      Member_ID,
      Format_Name,
      Login_Latitude,
      Login_Longitude
    } = req.body;
    if (!Member_ID) {
      return res.status(400).json({
        error: "ไม่พบ Member_ID"
      });
    }
    if (!Format_Name) {
      return res.status(400).json({
        error: "ไม่พบรูปแบบการ Login"
      });
    }
    if (!["Email", "Line"].includes(Format_Name)) {
      return res.status(400).json({
        error: "Format_Name ต้องเป็น Email หรือ Line"
      });
    }
    if (
      Login_Latitude === undefined ||
      Login_Latitude === null ||
      Login_Longitude === undefined ||
      Login_Longitude === null
    ) {
      return res.status(400).json({
        error: "ไม่พบตำแหน่ง Latitude / Longitude"
      });
    }
    const latitude = Number(Login_Latitude);
    const longitude = Number(Login_Longitude);
    if (!Number.isFinite(latitude)) {
      return res.status(400).json({
        error: "Login_Latitude ไม่ถูกต้อง"
      });
    }
    if (!Number.isFinite(longitude)) {
      return res.status(400).json({
        error: "Login_Longitude ไม่ถูกต้อง"
      });
    }
    const [result] = await pool.query(`
      INSERT INTO logins (
        Member_ID, Format_Name, Login_State, Login_Latitude, Login_Longitude, Login_Date, Login_Time, Login_Expire_At
      )
      VALUES (
        ?, ?, 'Connected', ?, ?, CURDATE(), CURTIME(), DATE_ADD(NOW(), INTERVAL 40 MINUTE)
      )
    `, [
      Member_ID,
      Format_Name,
      latitude,
      longitude
    ]);
    // แจ้งเตือนสมาชิกที่เพิ่ง Login หากมีโพสต์ในตำบลเดียวกัน
    try {
      const loginSubdistrict = await findSubdistrictByGPS(
        latitude,
        longitude
      );
      if (loginSubdistrict) {
        const posts = await getMatchingPostsBySubdistrict(
          loginSubdistrict.Subdistrict_ID,
          Member_ID
        );
        if (posts.length > 0) {
          const message = buildLineNotificationMessage(
            loginSubdistrict.Subdistrict_Name,
            posts
          );
          const [members] = await pool.query(
            `
            SELECT Email, \`Line\`
            FROM members
            WHERE Member_ID = ?
              AND Member_State = 'Active'
            LIMIT 1
            `,
            [Member_ID]
          );
          if (members.length > 0) {
            const member = members[0];
            if (Format_Name === "Line" && member.Line) {
              await sendLineNotification(member.Line, message);
            } else if (Format_Name === "Email" && member.Email) {
              const emailHtml = `
                <div style="font-family:Arial,sans-serif">
                  <h2>📢 พบโพสต์ในตำบล${loginSubdistrict.Subdistrict_Name}</h2>
                  <p>มีโพสต์ที่ตรงกับพื้นที่ที่คุณเข้าสู่ระบบ</p>
                  <pre style="white-space:pre-wrap">${message}</pre>
                </div>
              `;
              await sendEmailNotification(
                member.Email,
                "พบโพสต์ในตำบลของคุณ",
                emailHtml
              );
            }
          }
        } else {
          console.log("ไม่มีโพสต์ที่ตรงกับตำบล ไม่ส่งแจ้งเตือน");
        }
      }
    } catch (notificationError) {
      console.error("LOGIN POST NOTIFICATION ERROR:", notificationError);
    }
    res.status(201).json({
      message: "บันทึก Login สำเร็จ",
      Sequence_ID: result.insertId,
      Member_ID: Member_ID,
      Format_Name: Format_Name,
      Login_State: "Connected"
    });
  } catch (err) {
    console.error("CREATE LOGIN ERROR =", err);
    res.status(500).json({
      error: err.message
    });
  }
});

router.post("/line", async (req, res) => {
  try {
    const {
      idToken,
      Login_Latitude,
      Login_Longitude
    } = req.body;
    if (!idToken) {
      return res.status(400).json({
        message: "ไม่พบ LINE ID Token"
      });
    }
    if (
      Login_Latitude === undefined ||
      Login_Longitude === undefined
    ) {
      return res.status(400).json({
        message: "ไม่พบตำแหน่ง Latitude / Longitude"
      });
    }
    const latitude = Number(Login_Latitude);
    const longitude = Number(Login_Longitude);
    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return res.status(400).json({
        message: "Latitude / Longitude ไม่ถูกต้อง"
      });
    }
    // ตรวจสอบ LINE ID Token
    const verifyResponse = await fetch(
      "https://api.line.me/oauth2/v2.1/verify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          id_token: idToken,
          client_id: process.env.LINE_CHANNEL_ID
        })
      }
    );
    const lineData = await verifyResponse.json();
    if (!verifyResponse.ok) {
      console.error("LINE VERIFY ERROR:", lineData);
      return res.status(401).json({
        message: "LINE Token ไม่ถูกต้อง"
      });
    }
    const lineUserId = lineData.sub;
    if (!lineUserId) {
      return res.status(400).json({
        message: "ไม่พบ LINE User ID"
      });
    }
    // ค้นหาสมาชิกจาก LINE ID
    const [rows] = await pool.query(
      "SELECT * FROM members WHERE `Line` = ?",
      [lineUserId]
    );
    let member;
    if (rows.length > 0) {
      // สมาชิกเดิม
      member = rows[0];
    } else {
      // สมัครสมาชิก LINE ใหม่
      const displayName = lineData.name || "LINE User";
      const nameParts = displayName.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      const [result] = await pool.query(
        `
        INSERT INTO members (
          First_Name,
          Last_Name,
          Sex,
          Email,
          Member_Password,
          Line,
          Member_State
        )
        VALUES (?, ?, ?, ?, ?, ?, 'Active')
        `,
        [
          firstName,
          lastName,
          null,
          null,
          null,
          lineUserId
        ]
      );
      const [newRows] = await pool.query(
        `
        SELECT *
        FROM members
        WHERE Member_ID = ?
        `,
        [result.insertId]
      );
      member = newRows[0];
      if (!member) {
        throw new Error("ไม่พบข้อมูลสมาชิกหลังสมัคร LINE");
      }
    }
    // =========================================
    // ตรวจสอบสถานะสมาชิกก่อน Login
    // =========================================
    if (member.Member_State !== "Active") {
      return res.status(403).json({
        success: false,
        code: "MEMBER_SUSPENDED",
        message: "บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ"
      });
    }
    // สร้าง JWT หลังจากตรวจสอบสถานะแล้วเท่านั้น
    const token = jwt.sign(
      {memberId: member.Member_ID}, process.env.JWT_SECRET, {expiresIn: "7d"}
    );
    // บันทึกประวัติ Login
    const [loginResult] = await pool.query(
      `
      INSERT INTO logins (
        Member_ID,
        Format_Name,
        Login_State,
        Login_Latitude,
        Login_Longitude,
        Login_Date,
        Login_Time,
        Login_Expire_At
      )
      VALUES (
        ?,
        'Line',
        'Connected',
        ?,
        ?,
        CURDATE(),
        CURTIME(),
        DATE_ADD(NOW(), INTERVAL 40 MINUTE)
      )
      `,
      [
        member.Member_ID,
        latitude,
        longitude
      ]
    );
    console.log(
      "สร้าง Login Sequence_ID =",
      loginResult.insertId
    );
    // แจ้งเตือนสมาชิก LINE ที่เพิ่ง Login หากมีโพสต์ในตำบลเดียวกัน
    try {
      const loginSubdistrict = await findSubdistrictByGPS(
        latitude,
        longitude
      );
      if (loginSubdistrict) {
        const posts = await getMatchingPostsBySubdistrict(
          loginSubdistrict.Subdistrict_ID,
          member.Member_ID
        );
        if (posts.length > 0 && member.Line) {
          const message = buildLineNotificationMessage(
            loginSubdistrict.Subdistrict_Name,
            posts
          );
          await sendLineNotification(member.Line, message);
          console.log("ส่งแจ้งเตือนโพสต์ให้สมาชิก LINE ที่ Login สำเร็จ");
        } else {
          console.log("ไม่มีโพสต์ที่ตรงกับตำบล ไม่ส่งแจ้งเตือน");
        }
      }
    } catch (notificationError) {
      console.error("LINE LOGIN POST NOTIFICATION ERROR:", notificationError);
    }
    return res.json({
      success: true,
      message: "LINE Login สำเร็จ",
      token,
      member,
      login: {
        Sequence_ID: loginResult.insertId,
        Member_ID: member.Member_ID,
        Format_Name: "Line",
        Login_State: "Connected"
      }
    });
  } catch (err) {
    console.error("LINE LOGIN ERROR:", err);
    return res.status(500).json({
      message: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ LINE"
    });
  }
});

router.post("/extend", async (req, res) => {
  try {
    const {
      Sequence_ID,
      Member_ID
    } = req.body;
    if (!Sequence_ID || !Member_ID) {
      return res.status(400).json({
        error: "ข้อมูลไม่ครบ"
      });
    }
    const [result] = await pool.query(
      `
      UPDATE logins
      SET
        Login_State = 'Connected',
        Login_Expire_At =
          DATE_ADD(NOW(), INTERVAL 40 MINUTE)
      WHERE Sequence_ID = ?
        AND Member_ID = ?
      `,
      [
        Sequence_ID,
        Member_ID
      ]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "ไม่พบ Login Session"
      });
    }
    res.json({
      message: "ต่อเวลา Login สำเร็จ",
      Sequence_ID,
      Login_State: "Connected"
    });
  } catch (err) {
    console.error(
      "EXTEND LOGIN ERROR =",
      err
    );
    res.status(500).json({
      error: err.message
    });
  }
});

router.post("/logout", async (req, res) => {
  try {
    const {
      Sequence_ID,
      Member_ID
    } = req.body;
    if (!Sequence_ID || !Member_ID) {
      return res.status(400).json({
        error: "ข้อมูลไม่ครบ"
      });
    }
    const [result] = await pool.query(
      `
      UPDATE logins
      SET Login_State = 'Not Connected'
      WHERE Sequence_ID = ?
        AND Member_ID = ?
        AND Login_State = 'Connected'
      `,
      [
        Sequence_ID,
        Member_ID
      ]
    );
    res.json({
      message: "Logout สำเร็จ",
      Sequence_ID,
      Login_State: "Not Connected",
      affectedRows: result.affectedRows
    });
  } catch (err) {
    console.error(
      "LOGOUT ERROR =",
      err
    );
    res.status(500).json({
      error: err.message
    });
  }
});

router.post("/disconnect", async (req, res) => {
  try {
    const {
      Sequence_ID,
      Member_ID
    } = req.body;
    if (!Sequence_ID || !Member_ID) {
      return res.sendStatus(204);
    }
    await pool.query(
      `
      UPDATE logins
      SET Login_State = 'Not Connected'
      WHERE Sequence_ID = ?
        AND Member_ID = ?
        AND Login_State = 'Connected'
      `,
      [
        Sequence_ID,
        Member_ID
      ]
    );
    res.sendStatus(204);
  } catch (err) {
    console.error(
      "DISCONNECT ERROR =",
      err
    );
    res.sendStatus(204);
  }
});

router.post("/check-expired", async (req, res) => {
  try {
    const [result] = await pool.query(
      `
      UPDATE logins
      SET Login_State = 'Not Connected'
      WHERE Login_State = 'Connected'
        AND Login_Expire_At IS NOT NULL
        AND Login_Expire_At <= NOW()
      `
    );
    res.json({
      message: "ตรวจสอบ Session สำเร็จ",
      updatedRows: result.affectedRows
    });
  } catch (err) {
    console.error(
      "CHECK EXPIRED ERROR =",
      err
    );
    res.status(500).json({
      error: err.message
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const {
      id
    } = req.params;
    const {
      Member_ID, Format_Name, Login_State, Login_Latitude, Login_Longitude, Login_Date, Login_Time, Login_Expire_At
    } = req.body;
    await pool.query(
      `
      UPDATE logins
      SET
        Member_ID = ?,
        Format_Name = ?,
        Login_State = ?,
        Login_Latitude = ?,
        Login_Longitude = ?,
        Login_Date = ?,
        Login_Time = ?,
        Login_Expire_At = ?
      WHERE Sequence_ID = ?
      `,
      [
        Member_ID,
        Format_Name,
        Login_State,
        Login_Latitude,
        Login_Longitude,
        Login_Date,
        Login_Time,
        Login_Expire_At,
        id
      ]
    );
    res.json({
      message: "แก้ไขสำเร็จ"
    });
  } catch (err) {
    console.error(
      "UPDATE LOGIN ERROR =",
      err
    );
    res.status(500).json({
      error: err.message
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const {
      id
    } = req.params;
    await pool.query(
      `
      DELETE FROM logins
      WHERE Sequence_ID = ?
      `,
      [id]
    );
    res.json({
      message: "ลบสำเร็จ"
    });
  } catch (err) {
    console.error(
      "DELETE LOGIN ERROR =",
      err
    );
    res.status(500).json({
      error: err.message
    });
  }
});
router.get('/session/:Sequence_ID', async (req, res) => {
  const { Sequence_ID } = req.params;
  try {
    console.log("===== CHECK LOGIN SESSION =====");
    console.log("Sequence_ID =", Sequence_ID);
    const [rows] = await pool.query(
      `
      SELECT
        Sequence_ID,
        Member_ID,
        Login_State,
        Login_Expire_At
      FROM logins
      WHERE Sequence_ID = ?
      LIMIT 1
      `,
      [Sequence_ID]
    );
    console.log("SESSION ROWS =", rows.length);
    if (rows.length === 0) {
      return res.status(404).json({
        message: "ไม่พบ Login Session"
      });
    }
    const login = rows[0];
    console.log("LOGIN SESSION =", login);
    // ต้องเป็น Connected
    if (login.Login_State !== "Connected") {
      return res.status(401).json({
        message: "Login Session ไม่ได้เชื่อมต่อ"
      });
    }
    // ต้องมีเวลาหมดอายุ
    if (!login.Login_Expire_At) {
      return res.status(401).json({
        message: "ไม่พบเวลาหมดอายุของ Login Session"
      });
    }
    // ตรวจว่าเวลาหมดอายุผ่านไปแล้วหรือยัง
    const expireTime = new Date(
      login.Login_Expire_At
    ).getTime();
    if (
      !Number.isFinite(expireTime) ||
      expireTime <= Date.now()
    ) {
      await pool.query(
        `
        UPDATE logins
        SET Login_State = 'Not Connected'
        WHERE Sequence_ID = ?
        `,
        [Sequence_ID]
      );
      console.log(
        "SESSION EXPIRED → Not Connected"
      );
      return res.status(401).json({
        message: "Login Session หมดอายุ"
      });
    }
    console.log(
      "SESSION VALID → Connected"
    );
    res.json({
      valid: true,
      login
    });
  } catch (error) {
    console.error(
      "SESSION CHECK ERROR:",
      error
    );
    res.status(500).json({
      message: "ไม่สามารถตรวจสอบ Login Session ได้",
      error: error.message
    });
  }
});
module.exports = router;