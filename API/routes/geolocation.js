const express = require("express");
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    console.log("===== GOOGLE GEOLOCATION START =====");
    const response = await fetch(
      `https://www.googleapis.com/geolocation/v1/geolocate?key=${process.env.GOOGLE_GEOLOCATION_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          considerIp: true,
        }),
      }
    );
    const data = await response.json();
    console.log("GOOGLE RESPONSE:", data);
    if (!response.ok) {
      console.error("GOOGLE GEOLOCATION ERROR:", data);
      return res.status(response.status).json({
        success: false,
        message:
          data?.error?.message ||
          "Google Geolocation failed",
      });
    }
    if (
      !data?.location ||
      !Number.isFinite(data.location.lat) ||
      !Number.isFinite(data.location.lng) ||
      !Number.isFinite(data.accuracy)
    ) {
      return res.status(500).json({
        success: false,
        message: "Google ไม่ได้ส่งข้อมูลตำแหน่งที่ถูกต้องกลับมา",
      });
    }
    res.json({
      success: true,
      latitude: data.location.lat,
      longitude: data.location.lng,
      accuracy: data.accuracy,
    });
  } catch (error) {
    console.error("GEOLOCATION ERROR:", error);
    res.status(500).json({
      success: false,
      message: "ไม่สามารถระบุตำแหน่งได้",
    });
  }
});

module.exports = router;