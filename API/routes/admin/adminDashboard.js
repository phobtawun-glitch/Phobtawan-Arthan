const express = require("express");
const router = express.Router();
const pool = require("../../db");

router.get("/stats", async (req, res) => {
  try {
    const [postRows] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM postings
    `);
    const [memberRows] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM members
    `);
    // โพสต์ที่ได้รับคืนแล้ว
    const [returnedRows] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM postings
      WHERE Post_State = 'End'
        AND Recrive_Date IS NOT NULL
        AND Receive_Time IS NOT NULL
        AND Post_Suspended_Date IS NULL
        AND Post_Suspended_Time IS NULL
    `);
    // โพสต์ที่ยังไม่ได้รับคืน
    const [notReturnedRows] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM postings
      WHERE Post_State = 'End'
        AND Recrive_Date IS NULL
        AND Receive_Time IS NULL
        AND Post_Suspended_Date IS NULL
        AND Post_Suspended_Time IS NULL
    `);

    res.json({
      success: true,
      stats: {
        posts: Number(postRows[0].total),
        members: Number(memberRows[0].total),
        returned: Number(returnedRows[0].total),
        notReturned: Number(notReturnedRows[0].total),
      },
    });
  } catch (error) {
    console.error("ADMIN DASHBOARD STATS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "ไม่สามารถโหลดข้อมูล Dashboard ได้",
      error: error.message,
    });
  }
});
// =====================================================
// สถิติรายเดือน
// =====================================================
router.get("/monthly", async (req, res) => {
  try {
    const year = req.query.year ? Number(req.query.year) : null;
    if (year !== null && (!Number.isInteger(year) || year < 1)) {
      return res.status(400).json({
        success: false,
        message: "ปีไม่ถูกต้อง",
      });
    }
    const params = [];
    let sql = `
      SELECT
        periods.year,
        periods.month,
        COALESCE(p.posts, 0) AS posts,
        COALESCE(l.users, 0) AS users,
        COALESCE(p.returned, 0) AS returned,
        COALESCE(p.notReturned, 0) AS notReturned,
        COALESCE(p.unclaimed, 0) AS unclaimed
      FROM (
        SELECT
          YEAR(Post_Start_Date) AS year,
          MONTH(Post_Start_Date) AS month
        FROM postings
        WHERE Post_Start_Date IS NOT NULL
        UNION
        SELECT
          YEAR(Login_Date) AS year,
          MONTH(Login_Date) AS month
        FROM logins
        WHERE Login_Date IS NOT NULL
      ) AS periods
      LEFT JOIN (
        SELECT
          YEAR(p.Post_Start_Date) AS year,
          MONTH(p.Post_Start_Date) AS month,
          COUNT(*) AS posts,
          -- โพสต์ที่ได้รับคืนแล้ว
          SUM(
            CASE
              WHEN p.Post_State = 'End'
                AND p.Recrive_Date IS NOT NULL
                AND p.Receive_Time IS NOT NULL
                AND p.Post_Suspended_Date IS NULL
                AND p.Post_Suspended_Time IS NULL
              THEN 1
              ELSE 0
            END
          ) AS returned,
          -- แจ้งสิ่งของสูญหาย แต่ไม่ได้รับคืน
          SUM(
            CASE
              WHEN p.Post_State = 'End'
                AND p.Recrive_Date IS NULL
                AND p.Receive_Time IS NULL
                AND p.Post_Suspended_Date IS NULL
                AND p.Post_Suspended_Time IS NULL
                AND pt.Post_Type_Name = 'แจ้งสิ่งของสูญหาย'
              THEN 1
              ELSE 0
            END
          ) AS notReturned,
          -- แจ้งพบสิ่งของ แต่ไม่มีเจ้าของมารับ
          SUM(
            CASE
              WHEN p.Post_State = 'End'
                AND p.Recrive_Date IS NULL
                AND p.Receive_Time IS NULL
                AND p.Post_Suspended_Date IS NULL
                AND p.Post_Suspended_Time IS NULL
                AND pt.Post_Type_Name = 'แจ้งพบสิ่งของ'
              THEN 1
              ELSE 0
            END
          ) AS unclaimed
        FROM postings p
        LEFT JOIN post_types pt
          ON pt.Post_Type_ID = p.Post_Type_ID
        WHERE p.Post_Start_Date IS NOT NULL
    `;
    if (year !== null) {
      sql += `
        AND YEAR(p.Post_Start_Date) = ?
      `;
      params.push(year);
    }
    sql += `
        GROUP BY
          YEAR(p.Post_Start_Date),
          MONTH(p.Post_Start_Date)
      ) AS p
        ON p.year = periods.year
        AND p.month = periods.month
      LEFT JOIN (
        SELECT
          YEAR(Login_Date) AS year,
          MONTH(Login_Date) AS month,
          COUNT(DISTINCT Member_ID) AS users
        FROM logins
        WHERE Login_Date IS NOT NULL
    `;
    if (year !== null) {
      sql += `
        AND YEAR(Login_Date) = ?
      `;
      params.push(year);
    }
    sql += `
        GROUP BY
          YEAR(Login_Date),
          MONTH(Login_Date)
      ) AS l
        ON l.year = periods.year
        AND l.month = periods.month
      WHERE 1 = 1
    `;
    if (year !== null) {
      sql += `
        AND periods.year = ?
      `;
      params.push(year);
    }
    sql += `
      ORDER BY
        periods.year,
        periods.month
    `;
    const [rows] = await pool.query(sql, params);
    res.json({
      success: true,
      data: rows.map((row) => ({
        year: Number(row.year),
        month: Number(row.month),
        posts: Number(row.posts),
        users: Number(row.users),
        returned: Number(row.returned),
        notReturned: Number(row.notReturned),
        unclaimed: Number(row.unclaimed),
      })),
    });
  } catch (error) {
    console.error("ADMIN DASHBOARD MONTHLY ERROR:", error);
    res.status(500).json({
      success: false,
      message: "ไม่สามารถโหลดข้อมูลรายเดือนได้",
      error: error.message,
    });
  }
});
// =====================================================
// สถิติรายปี
// =====================================================
router.get("/yearly", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        periods.year,
        COALESCE(p.posts, 0) AS posts,
        COALESCE(l.users, 0) AS users,
        COALESCE(p.returned, 0) AS returned,
        COALESCE(p.notReturned, 0) AS notReturned,
        COALESCE(p.unclaimed, 0) AS unclaimed
      FROM (
        SELECT YEAR(Post_Start_Date) AS year
        FROM postings
        WHERE Post_Start_Date IS NOT NULL
        UNION
        SELECT YEAR(Login_Date) AS year
        FROM logins
        WHERE Login_Date IS NOT NULL
      ) AS periods
      LEFT JOIN (
        SELECT
          YEAR(p.Post_Start_Date) AS year,
          COUNT(*) AS posts,
          -- โพสต์ที่ได้รับคืนแล้ว
          SUM(
            CASE
              WHEN p.Post_State = 'End'
                AND p.Recrive_Date IS NOT NULL
                AND p.Receive_Time IS NOT NULL
                AND p.Post_Suspended_Date IS NULL
                AND p.Post_Suspended_Time IS NULL
              THEN 1
              ELSE 0
            END
          ) AS returned,
          -- แจ้งสิ่งของสูญหาย แต่ไม่ได้รับคืน
          SUM(
            CASE
              WHEN p.Post_State = 'End'
                AND p.Recrive_Date IS NULL
                AND p.Receive_Time IS NULL
                AND p.Post_Suspended_Date IS NULL
                AND p.Post_Suspended_Time IS NULL
                AND pt.Post_Type_Name = 'แจ้งสิ่งของสูญหาย'
              THEN 1
              ELSE 0
            END
          ) AS notReturned,
          -- แจ้งพบสิ่งของ แต่ไม่มีเจ้าของมารับ
          SUM(
            CASE
              WHEN p.Post_State = 'End'
                AND p.Recrive_Date IS NULL
                AND p.Receive_Time IS NULL
                AND p.Post_Suspended_Date IS NULL
                AND p.Post_Suspended_Time IS NULL
                AND pt.Post_Type_Name = 'แจ้งพบสิ่งของ'
              THEN 1
              ELSE 0
            END
          ) AS unclaimed
        FROM postings p
        LEFT JOIN post_types pt
          ON pt.Post_Type_ID = p.Post_Type_ID
        WHERE p.Post_Start_Date IS NOT NULL
        GROUP BY YEAR(p.Post_Start_Date)
      ) AS p
        ON p.year = periods.year
      LEFT JOIN (
        SELECT
          YEAR(Login_Date) AS year,
          COUNT(DISTINCT Member_ID) AS users
        FROM logins
        WHERE Login_Date IS NOT NULL
        GROUP BY YEAR(Login_Date)
      ) AS l
        ON l.year = periods.year
      ORDER BY periods.year
    `);
    res.json({
      success: true,
      data: rows.map((row) => ({
        year: Number(row.year),
        posts: Number(row.posts),
        users: Number(row.users),
        returned: Number(row.returned),
        notReturned: Number(row.notReturned),
        unclaimed: Number(row.unclaimed),
      })),
    });
  } catch (error) {
    console.error("ADMIN DASHBOARD YEARLY ERROR:", error);
    res.status(500).json({
      success: false,
      message: "ไม่สามารถโหลดข้อมูลรายปีได้",
      error: error.message,
    });
  }
});
// =====================================================
// สถิติรายจังหวัด
// =====================================================
router.get("/provinces", async (req, res) => {
  try {
    const year = req.query.year ? Number(req.query.year) : null;
    const month = req.query.month ? Number(req.query.month) : null;
    if (year !== null && (!Number.isInteger(year) || year < 1)) {
      return res.status(400).json({
        success: false,
        message: "ปีไม่ถูกต้อง",
      });
    }
    if (
      month !== null &&
      (!Number.isInteger(month) || month < 1 || month > 12)
    ) {
      return res.status(400).json({
        success: false,
        message: "เดือนไม่ถูกต้อง",
      });
    }
    let sql = `
      SELECT
        pr.Province_Name AS province,
        COUNT(DISTINCT p.Post_ID) AS posts
      FROM postings p
      LEFT JOIN in_the_place i
        ON i.Post_ID = p.Post_ID
      LEFT JOIN subdistricts s
        ON s.Subdistrict_ID = i.Subdistrict_ID
      LEFT JOIN districts d
        ON d.District_ID = s.District_ID
      LEFT JOIN provinces pr
        ON pr.Province_ID = d.Province_ID
      WHERE p.Post_Start_Date IS NOT NULL
    `;
    const params = [];
    if (year !== null) {
      sql += `
        AND YEAR(p.Post_Start_Date) = ?
      `;
      params.push(year);
    }
    if (month !== null) {
      sql += `
        AND MONTH(p.Post_Start_Date) = ?
      `;
      params.push(month);
    }
    sql += `
      GROUP BY
        pr.Province_ID,
        pr.Province_Name
      ORDER BY posts DESC
    `;
    const [rows] = await pool.query(sql, params);
    res.json({
      success: true,
      data: rows.map((row) => ({
        province: row.province || "ไม่ระบุจังหวัด",
        posts: Number(row.posts),
      })),
    });
  } catch (error) {
    console.error("ADMIN DASHBOARD PROVINCES ERROR:", error);
    res.status(500).json({
      success: false,
      message: "ไม่สามารถโหลดข้อมูลจังหวัดได้",
      error: error.message,
    });
  }
});
// =====================================================
// ปี / เดือนที่มีข้อมูล
// =====================================================
router.get("/periods", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        YEAR(Post_Start_Date) AS year,
        MONTH(Post_Start_Date) AS month
      FROM postings
      WHERE Post_Start_Date IS NOT NULL
      GROUP BY
        YEAR(Post_Start_Date),
        MONTH(Post_Start_Date)
      ORDER BY
        year DESC,
        month DESC
    `);

    const years = [
      ...new Set(
        rows
          .map((row) => Number(row.year))
          .filter((year) => !Number.isNaN(year))
      ),
    ];

    const monthsByYear = {};

    rows.forEach((row) => {
      const year = Number(row.year);
      const month = Number(row.month);
      if (!monthsByYear[year]) {
        monthsByYear[year] = [];
      }
      monthsByYear[year].push(month);
    });
    res.json({
      success: true,
      years,
      monthsByYear,
    });
  } catch (error) {
    console.error("ADMIN DASHBOARD PERIODS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "ไม่สามารถโหลดปีและเดือนได้",
      error: error.message,
    });
  }
});

module.exports = router;