import api from "@/api";

export const fetchColors = async (accessToken: string): Promise<any[]> => {
  try {
    const response = await api.get("/api/product/colors/", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data.colors;
  } catch (error) {
    console.error("Error fetching colors:", error);
    throw error;
  }
};
