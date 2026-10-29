const pool = require("../db");

const formatDate = (date) => {
  if (!date) return "-";

  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
};

// โพสต์ที่ยังเปิดใช้งานในตำบล
const getMatchingPostsBySubdistrict = async (subdistrictId) => {
  if (!subdistrictId) return [];

  const [rows] = await pool.query(
    `
    SELECT
      p.Post_ID,
      p.Posting_Name,
      p.Post_Start_Date,
      p.Post_Start_Time,
      p.Place_Name,
      p.Member_ID,
      i.Subdistrict_ID,
      s.Subdistrict_Name
    FROM postings p
    INNER JOIN in_the_place i
      ON i.Post_ID = p.Post_ID
    INNER JOIN subdistricts s
      ON s.Subdistrict_ID = i.Subdistrict_ID
    WHERE i.Subdistrict_ID = ?
      AND p.Post_State = 'Working'
      AND p.Recrive_Date IS NULL
      AND p.Receive_Time IS NULL
      AND p.Post_Suspended_Date IS NULL
      AND p.Post_Suspended_Time IS NULL
    ORDER BY p.Post_Start_Date DESC, p.Post_Start_Time DESC
    `,
    [subdistrictId]
  );

  return rows;
};

// สมาชิกอื่นที่มี Login session ล่าสุดเป็น Connected
const getOnlineMembersBySubdistrict = async (
  subdistrictId,
  creatorMemberId
) => {
  if (!subdistrictId) return [];

  const [rows] = await pool.query(
    `
    SELECT
      m.Member_ID,
      m.Email,
      m.\`Line\`,
      l.Format_Name
    FROM members m
    INNER JOIN logins l
      ON l.Sequence_ID = (
        SELECT l2.Sequence_ID
        FROM logins l2
        WHERE l2.Member_ID = m.Member_ID
        ORDER BY l2.Sequence_ID DESC
        LIMIT 1
      )
    WHERE l.Login_State = 'Connected'
      AND m.Member_ID <> ?
      AND EXISTS (
        SELECT 1
        FROM in_the_place ip
        INNER JOIN postings p
          ON p.Post_ID = ip.Post_ID
        WHERE ip.Subdistrict_ID = ?
          AND p.Member_ID = m.Member_ID
      )
    `,
    [creatorMemberId, subdistrictId]
  );

  return rows;
};

const buildLineNotificationMessage = (subdistrict, posts) => {
  if (!posts || posts.length === 0) {
    return null;
  }

  const subdistrictName =
    subdistrict?.Subdistrict_Name ||
    posts[0]?.Subdistrict_Name ||
    "ไม่ทราบตำบล";

  let message =
    `📢 แจ้งเตือนโพสต์สิ่งของในพื้นที่\n\n` +
    `📍 ตำบล${subdistrictName}\n` +
    `━━━━━━━━━━━━━━━━━━\n\n`;

  posts.forEach((post, index) => {
    const date = post.Post_Start_Date
      ? formatDate(post.Post_Start_Date)
      : "-";

    message +=
      `${index + 1}. ${post.Posting_Name || "ไม่ระบุชื่อสิ่งของ"}\n` +
      `📅 วันที่: ${date}\n` +
      `📍 สถานที่: ${post.Place_Name || "-"}\n\n` +
      `━━━━━━━━━━━━━━━━━━\n\n`;
  });

  message += `พบทั้งหมด ${posts.length} รายการ\n\n`;
  message += `ขอบคุณที่เข้าใช้งานระบบ Lost and Found 🙏`;

  return message;
};

module.exports = {
  getMatchingPostsBySubdistrict,
  getOnlineMembersBySubdistrict,
  buildLineNotificationMessage,
};