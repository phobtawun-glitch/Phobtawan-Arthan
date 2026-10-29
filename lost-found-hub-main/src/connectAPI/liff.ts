import liff from "@line/liff";

export const initLiff = async () => {
  try {
    await liff.init({
      liffId: import.meta.env.VITE_LIFF_ID,
    });

    console.log("LIFF initialized");
    console.log("Logged in:", liff.isLoggedIn());

  } catch (error) {
    console.error("LIFF init error:", error);
  }
};

export default liff;