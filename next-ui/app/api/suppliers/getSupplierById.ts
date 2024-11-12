import api from "@/api";

export const getSupplierById = async (access: string, id: number) => {
  try {
    const response = await api.get(`/api/supplier/${id}/`, {
      headers: {
        Authorization: `Bearer ${access}`,
      },
    });
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
