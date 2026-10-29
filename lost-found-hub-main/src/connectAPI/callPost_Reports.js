import axios from "./axios";

// ดึงเหตุผลการรายงาน
export const getReportReasons = async () => {
  const response = await axios.get("/post_reports/reasons");
  return response.data;
};


// ส่งรายงาน
export const createReport = async (data) => {
  const response = await axios.post("/post_reports", data);
  return response.data;
};