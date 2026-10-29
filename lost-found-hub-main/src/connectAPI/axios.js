import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:3001",
  withCredentials: true,
});

// ส่ง Token อัตโนมัติทุก Request
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    // 👇 เพิ่มตรงนี้
    console.log("===== Axios Request =====");
    console.log("Token:", token);
    console.log("URL:", config.url);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;

      // 👇 เพิ่มตรงนี้
      console.log("Authorization:", config.headers.Authorization);
    } else {
      console.log("❌ ไม่พบ Token");
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default instance;