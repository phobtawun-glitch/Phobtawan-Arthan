import axios from "@/connectAPI/axios";

export interface GPSLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export const getCurrentLocation = async (): Promise<GPSLocation> => {
  try {
    console.log("===== GOOGLE GEOLOCATION START =====");

    const response = await axios.post("/geolocation");

    console.log("GOOGLE GEOLOCATION RESPONSE:", response.data);

    if (!response.data?.success) {
      throw new Error(
        response.data?.message ||
          "ไม่สามารถระบุตำแหน่งได้"
      );
    }

    const latitude = Number(response.data.latitude);
    const longitude = Number(response.data.longitude);
    const accuracy = Number(response.data.accuracy);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      !Number.isFinite(accuracy)
    ) {
      throw new Error(
        "Google ไม่ได้ส่งตำแหน่งที่ถูกต้องกลับมา"
      );
    }

    console.log("===== GOOGLE LOCATION =====");
    console.log("Latitude:", latitude);
    console.log("Longitude:", longitude);
    console.log("Accuracy:", accuracy, "meters");

    return {
      latitude,
      longitude,
      accuracy,
    };
  } catch (error: any) {
    console.error(
      "GOOGLE GEOLOCATION ERROR:",
      error?.response?.data || error
    );

    throw new Error(
      error?.response?.data?.message ||
        error?.message ||
        "ไม่สามารถระบุตำแหน่งได้"
    );
  }
};