import api from "@/api";

export const updateVoucher = async (
  access: string,
  id: number,
  voucherData: any,
) => {
  try {
    const response = await api.put(`/api/vouchers/${id}/`, voucherData, {
      headers: {
        Authorization: `Bearer ${access}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
