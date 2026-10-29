const axios = require("axios");

const LINE_PUSH_URL = "https://api.line.me/v2/bot/message/push";

const sendLineNotification = async (lineUserId, text) => {
  if (!lineUserId) {
    throw new Error("ไม่มี LINE User ID");
  }

  if (!process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN) {
    throw new Error(
      "ไม่พบ LINE_MESSAGING_CHANNEL_ACCESS_TOKEN"
    );
  }

  try {
    const response = await axios.post(
      LINE_PUSH_URL,
      {
        to: lineUserId,
        messages: [
          {
            type: "text",
            text,
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN}`,
        },
      }
    );

    console.log("===== LINE NOTIFICATION SENT =====");
    console.log("LINE USER ID:", lineUserId);
    console.log("STATUS:", response.status);

    return true;
  } catch (error) {
    console.error(
      "LINE NOTIFICATION ERROR:",
      error.response?.data || error.message
    );

    return false;
  }
};

module.exports = {
  sendLineNotification,
};