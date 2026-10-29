import axios from "./axios";

export const getCategories = async () => {
    const res = await axios.get("/categorys");
    return res.data;
};