import api from "@/api";

interface SaleDetail {
  id: string;
  date_created: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
    total: number;
  }>;
  total_amount: number | string;
}

export const fetchSaleDetail = async (
  access: string,
  saleId: string,
): Promise<SaleDetail> => {
  try {
    const response = await api.get(`/api/sales/${saleId}/`, {
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
