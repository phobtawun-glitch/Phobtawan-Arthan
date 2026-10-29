import axios from "./axios";

export const getLogins = async () => {
 
  const response = await axios.get("/logins");
  return response.data;
};

// InsertLogins()
export const insertLogins = async (loginsData) => {
  try {
    const res = await axios.post("/logins", loginsData); //  ใช้ path ตรง ๆ
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const updateLogins = async (id, loginsData) => {
  const res = await axios.put(`/logins/${id}`, loginsData);
  return res.data;
};

export const deleteLogins = async (id) => {
  const res = await axios.delete(`/logins/${id}`);
  return res.data;
};



