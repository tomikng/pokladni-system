import api from "@/api";

export const setTip = async (access: string, saleId: number, tip: number) => {
  try {
    const requestData = {
      tip,
    };

    const response = await api.post(
      `/api/sales/${saleId}/set_tip/`,
      requestData,
      {
        headers: {
          Authorization: `Bearer ${access}`,
          "Content-Type": "application/json",
        },
      },
    );
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("Error setting tip:", error);
    throw error;
  }
};
