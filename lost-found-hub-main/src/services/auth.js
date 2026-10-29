import axios from "../connectAPI/axios";

export const login = async (email, password) => {
  const res = await axios.post("/auth/login", {
    email,
    password,
  });

  localStorage.setItem("token", res.data.token);

  localStorage.setItem(
    "member",
    JSON.stringify(res.data.member)
  );

  return res.data;
};

export const getMe = async () => {
  const res = await axios.get("/auth/me");
  return res.data;
};