import api from "@/api";

export const updateBusinessSettings = async (
  accessToken: string,
  data: any,
  id: string,
): Promise<any> => {
  try {
    const response = await api.put(`/settings/business-settings/${id}/`, data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error updating business settings:", error);
    throw error;
  }
};
