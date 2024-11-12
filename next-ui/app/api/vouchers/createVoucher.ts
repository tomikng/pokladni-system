import api from "@/api";

export const createVoucher = async (access: string, voucherData: any) => {
  try {
    const response = await api.post("/api/vouchers/", voucherData, {
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
