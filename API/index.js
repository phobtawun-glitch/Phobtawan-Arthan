require("dotenv").config();
//เอาไว้รันฝั่ง server
const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path");
// ให้สิทธิ์ frontend localhost:3000

app.use(
  cors({
    origin: [
      "http://localhost:8080",
      "https://localhost:8080",
    ],
    credentials: true,
  })
);

const authRoutes = require("./routes/auth")
const adminsRoutes = require("./routes/admins");
const categorysRoutes = require("./routes/categorys");
const commentsRoutes = require("./routes/comments");
const districtsRoutes = require("./routes/districts");
const in_the_placeRoutes = require("./routes/in_the_place");
const is_inRoutes = require("./routes/is_in");
const loginsRoutes = require("./routes/logins");
const membersRoutes = require("./routes/members");
const post_reportsRoutes = require("./routes/post_reports");
const post_typesRoutes = require("./routes/post_types");
const postingsRoutes = require("./routes/postings");
const provincesRoutes = require("./routes/provinces");
const subdistrictsRoutes = require("./routes/subdistricts");
const thingsRoutes = require("./routes/things");
const adminDashboardRoutes = require("./routes/admin/adminDashboard");
const adminPostsRoutes = require("./routes/admin/adminPosts");
const adminReportsRoutes = require("./routes/admin/adminReports");
const adminSuspendedRoutes = require("./routes/admin/adminSuspended");
const adminMembersRoutes = require("./routes/admin/adminMembers");
const adminSuspendedMembersRoutes = require("./routes/admin/adminSuspendedMembers");
const geolocationRoutes = require("./routes/geolocation");

app.use(express.json()); // เพื่ออ่าน JSON จาก req.body
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/auth", authRoutes);
app.use("/admins", adminsRoutes);
app.use("/categorys", categorysRoutes);
app.use("/comments", commentsRoutes);
app.use("/districts", districtsRoutes);
app.use("/in_the_place", in_the_placeRoutes);
app.use("/is_in", is_inRoutes);
app.use("/logins", loginsRoutes);
app.use("/members", membersRoutes); // กำหนด route
app.use("/post_reports", post_reportsRoutes);
app.use("/post_types", post_typesRoutes);
app.use("/postings", postingsRoutes);
app.use("/provinces", provincesRoutes);
app.use("/subdistricts", subdistrictsRoutes);
app.use("/things", thingsRoutes);
app.use("/admin/dashboard", adminDashboardRoutes);
app.use("/admin/posts", adminPostsRoutes);
app.use("/admin/reports", adminReportsRoutes);
app.use("/admin/suspended", adminSuspendedRoutes);
app.use("/admin/members", adminMembersRoutes);
app.use("/admin/suspended-members", adminSuspendedMembersRoutes);
app.use("/geolocation", geolocationRoutes);

//อยู่สุดท้าย
app.listen(3001, () => {
  console.log("Server is running at http://localhost:3001");
  console.log("JWT_SECRET =", process.env.JWT_SECRET);
});