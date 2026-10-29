import axios from "./axios";

// ดึงประกาศทั้งหมด
export const getPostings = async () => {
  const res = await axios.get("/postings");
  return res.data;
};

// เพิ่มประกาศ
export const createPosting = async (data) => {
  const res = await axios.post("/postings", data);
  return res.data;
};

// แก้ไขประกาศ
export const updatePosting = async (id, data) => {
  const res = await axios.put(`/postings/${id}`, data);
  return res.data;
};

// ลบประกาศ
export const deletePosting = async (id) => {
  const res = await axios.delete(`/postings/${id}`);
  return res.data;
};