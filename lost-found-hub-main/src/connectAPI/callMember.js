import axios from "./axios";

export const getMembers = async () => {
 
  const response = await axios.get("/members");
  return response.data;
};

// InsertMembers()
export const insertMembers = async (membersData) => {
  try {
    const res = await axios.post("/members", membersData); //  ใช้ path ตรง ๆ
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const updateMembers = async (id, membersData) => {
  const res = await axios.put(`/members/${id}`, membersData);
  return res.data;
};

export const deleteMembers = async (id) => {
  const res = await axios.delete(`/members/${id}`);
  return res.data;
};
