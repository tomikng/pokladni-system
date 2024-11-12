import api from "@/api";
import { ApiTypes } from "@/app/types/api";

export const createSale = async (
  access: string,
  saleData: ApiTypes.CreateSale,
) => {
  try {
    const requestData = {
      cashier: saleData.cashier,
      total_amount: saleData.total_amount,
      items: saleData.items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
      })),
      payment: {
        payment_type: saleData.payment.payment_type,
      },
    };

    // if (saleData.voucher_id !== undefined) {
    //   requestData.voucher_id = saleData.voucher_id;
    // }

    const response = await api.post("/api/sales/", requestData, {
      headers: {
        Authorization: `Bearer ${access}`,
        "Content-Type": "application/json",
      },
    });
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
