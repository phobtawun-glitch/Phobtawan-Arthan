const multer = require("multer");
const path = require("path");

// กำหนดตำแหน่งเก็บไฟล์
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

// อนุญาตเฉพาะรูปภาพ
const fileFilter = (req, file, cb) => {
  const allow = /jpg|jpeg|png|gif|webp/;
  const ext = allow.test(path.extname(file.originalname).toLowerCase());
  const mime = allow.test(file.mimetype);

  if (ext && mime) {
    return cb(null, true);
  }
  cb(new Error("รองรับเฉพาะไฟล์รูปภาพ"));
};

module.exports = multer({
  storage,
  fileFilter,
});