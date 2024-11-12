import api from "@/api";

export const deleteVoucher = async (access: string, id: number) => {
  try {
    const response = await api.delete(`/api/vouchers/${id}/`, {
      headers: {
        Authorization: `Bearer ${access}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
