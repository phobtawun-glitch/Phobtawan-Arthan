import axios from "./axios";

export const getInThePlaces = async () => {
  const response = await axios.get("/in_the_place");
  return response.data;
};

export const insertInThePlace = async (inThePlaceData) => {
  try {
    const res = await axios.post("/in_the_place", inThePlaceData);
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const updateInThePlace = async (id, inThePlaceData) => {
  const res = await axios.put(`/in_the_place/${id}`, inThePlaceData);
  return res.data;
};

export const deleteInThePlace = async (id) => {
  const res = await axios.delete(`/in_the_place/${id}`);
  return res.data;
};