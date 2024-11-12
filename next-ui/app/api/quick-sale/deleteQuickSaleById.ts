import api from "@/api";

export const deleteQuickSaleById = async (access: string, id: number) => {
  try {
    const response = await api.delete(`/api/quick-sale/${id}/`, {
      headers: {
        Authorization: `Bearer ${access}`,
      },
    });
    return response;
  } catch (e) {
    console.log(e);
    throw e;
  }
};
