const axios = require("axios");
const pool = require("../db");

function normalizeThaiLocation(name = "") {
  return name
    .trim()
    .replace(/^(ตำบล|ต\.|แขวง|อำเภอ|อ\.|เขต)\s*/u, "")
    .replace(/\s+/g, "");
}

const findSubdistrictByGPS = async (latitude, longitude) => {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  const apiKey = process.env.GOOGLE_GEOLOCATION_API_KEY;

  if (!apiKey) {
    throw new Error("ไม่พบ GOOGLE_GEOLOCATION_API_KEY ใน .env");
  }

  const response = await axios.get(
    "https://maps.googleapis.com/maps/api/geocode/json",
    {
      params: {
        latlng: `${lat},${lng}`,
        language: "th",
        key: apiKey,
      },
      timeout: 10000,
    }
  );

  const data = response.data;

  if (data.status !== "OK" || !data.results?.length) {
    console.error("GOOGLE GEOCODING STATUS:", data.status);
    return null;
  }

  let subdistrictName = null;
  let districtName = null;

  // อ่านตำบลและอำเภอจากผลลัพธ์เดียวกัน
  for (const result of data.results) {
    const components = result.address_components || [];

    const getComponent = (...types) => {
      const item = components.find((component) =>
        types.some((type) => component.types.includes(type))
      );

      return item?.long_name || null;
    };

    const subdistrict = getComponent(
      "administrative_area_level_3",
      "sublocality_level_1"
    );

    const district = getComponent("administrative_area_level_2");

    if (subdistrict) {
      subdistrictName = subdistrict;
      districtName = district;
      break;
    }
  }

  if (!subdistrictName) {
    console.error("Google ไม่พบข้อมูลระดับตำบล");
    return null;
  }

  const normalizedSubdistrict =
    normalizeThaiLocation(subdistrictName);

  const normalizedDistrict =
    normalizeThaiLocation(districtName || "");

  console.log("GOOGLE SUBDISTRICT:", subdistrictName);
  console.log("NORMALIZED SUBDISTRICT:", normalizedSubdistrict);
  console.log("GOOGLE DISTRICT:", districtName);
  console.log("NORMALIZED DISTRICT:", normalizedDistrict);

  // เทียบชื่อตำบลแบบไม่ยึดติดกับคำนำหน้า
  let sql = `
    SELECT
      s.Subdistrict_ID,
      s.Subdistrict_Name,
      s.District_ID
    FROM subdistricts s
    WHERE REPLACE(
      REGEXP_REPLACE(
        TRIM(s.Subdistrict_Name),
        '^(ตำบล|ต\\\\.|แขวง)[[:space:]]*',
        ''
      ),
      ' ',
      ''
    ) = ?
  `;

  const params = [normalizedSubdistrict];

  if (normalizedDistrict) {
    sql += `
      AND s.District_ID IN (
        SELECT d.District_ID
        FROM districts d
        WHERE REPLACE(
          REGEXP_REPLACE(
            TRIM(d.District_Name),
            '^(อำเภอ|อ\\\\.|เขต)[[:space:]]*',
            ''
          ),
          ' ',
          ''
        ) = ?
      )
    `;

    params.push(normalizedDistrict);
  }

  sql += " LIMIT 2";

  const [rows] = await pool.query(sql, params);

  console.log("SUBDISTRICT MATCH COUNT:", rows.length);

  if (rows.length !== 1) {
    console.error("ไม่พบตำบลที่ตรงกัน หรือมีผลลัพธ์ซ้ำ");
    return null;
  }

  return rows[0];
};

module.exports = { findSubdistrictByGPS };