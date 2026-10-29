const pool = require("../db");
const { findSubdistrictByGPS } = require("./locationService");
const { sendLineNotification } = require("./lineNotification");
const { sendEmailNotification } = require("./emailNotification");

const escapeHtml = (value) => String(value ?? "-")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;");

/**
 * Notify each distinct online member in a subdistrict once.
 * If a member has multiple active sessions, use their newest active session's
 * location and Format_Name to select exactly one delivery channel.
 */
const notifyOnlineMembersInSubdistrict = async ({
  subdistrictId,
  excludeMemberId,
  title,
  message,
  emailHtml,
}) => {
  if (!subdistrictId) return { notified: 0, skipped: 0 };

  const [sessions] = await pool.query(`
    SELECT
      l.Sequence_ID,
      l.Member_ID,
      l.Format_Name,
      l.Login_Latitude,
      l.Login_Longitude,
      m.Email,
      m.Line
    FROM logins l
    INNER JOIN members m ON m.Member_ID = l.Member_ID
    WHERE l.Login_State = 'Connected'
      AND l.Login_Expire_At IS NOT NULL
      AND l.Login_Expire_At > NOW()
      AND m.Member_State = 'Active'
    ORDER BY l.Sequence_ID DESC
  `);

  // Rows are newest-first: retain only one active session per member.
  const latestSessionByMember = new Map();
  for (const session of sessions) {
    const memberKey = String(session.Member_ID);
    if (excludeMemberId != null && memberKey === String(excludeMemberId)) continue;
    if (!latestSessionByMember.has(memberKey)) {
      latestSessionByMember.set(memberKey, session);
    }
  }

  let notified = 0;
  let skipped = 0;

  for (const session of latestSessionByMember.values()) {
    try {
      const location = await findSubdistrictByGPS(
        session.Login_Latitude,
        session.Login_Longitude
      );
      if (!location || String(location.Subdistrict_ID) !== String(subdistrictId)) {
        skipped++;
        continue;
      }

      let sent = false;
      // The channel follows the member's newest active session, not their profile fields.
      if (session.Format_Name === "Line") {
        sent = await sendLineNotification(session.Line, message);
      } else if (session.Format_Name === "Email") {
        sent = await sendEmailNotification(
          session.Email,
          title,
          emailHtml
        );
      }

      if (sent) notified++;
      else skipped++;
    } catch (error) {
      skipped++;
      console.error(
        "ONLINE MEMBER NOTIFICATION ERROR:",
        session.Member_ID,
        error.message
      );
    }
  }

  return { notified, skipped };
};

const buildPostNotification = ({ postName, placeName, subdistrictName }) => {
  const safePostName = escapeHtml(postName);
  const safePlaceName = escapeHtml(placeName || "-");
  const safeSubdistrict = escapeHtml(subdistrictName || "พื้นที่ของคุณ");
  const title = "📢 มีโพสต์ใหม่ในตำบลของคุณ";
  const message = `${title}\n📍 ตำบล${subdistrictName || "-"}\n📌 ${postName || "-"}\nสถานที่: ${placeName || "-"}`;
  const emailHtml = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#333">
      <h2>${title}</h2>
      <p>📍 ตำบล<strong>${safeSubdistrict}</strong></p>
      <p>📌 มีการสร้างโพสต์ใหม่: <strong>${safePostName}</strong></p>
      <p>สถานที่: ${safePlaceName}</p>
      <p>ขอบคุณที่ใช้งานระบบ Lost and Found</p>
    </div>`;
  return { title, message, emailHtml };
};

const buildLoginNotification = ({ subdistrictName }) => {
  const safeSubdistrict = escapeHtml(subdistrictName || "พื้นที่ของคุณ");
  const title = "📍 มีสมาชิกเข้าสู่ระบบในตำบลเดียวกับคุณ";
  const message = `${title}\nตำบล${subdistrictName || "-"}\nมีสมาชิกเข้าสู่ระบบในพื้นที่เดียวกับคุณ`;
  const emailHtml = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#333">
      <h2>${title}</h2>
      <p>มีสมาชิกเข้าสู่ระบบในตำบล<strong>${safeSubdistrict}</strong>เดียวกับคุณ</p>
      <p>ขอบคุณที่ใช้งานระบบ Lost and Found</p>
    </div>`;
  return { title, message, emailHtml };
};

module.exports = {
  notifyOnlineMembersInSubdistrict,
  buildPostNotification,
  buildLoginNotification,
};