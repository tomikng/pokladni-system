import api from "@/api";

export const fetchEuroRate = async (accessToken: string): Promise<number> => {
  try {
    const response = await api.get("/settings/business-settings/euro_rate/", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data.euro_rate;
  } catch (error) {
    console.error("Error fetching euro rate:", error);
    throw error;
  }
};
