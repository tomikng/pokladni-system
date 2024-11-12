import api from "@/api";

export const fetchBusinessSettings = async (
  accessToken: string,
): Promise<any> => {
  try {
    const response = await api.get("/settings/business-settings/", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching business settings:", error);
    throw error;
  }
};
