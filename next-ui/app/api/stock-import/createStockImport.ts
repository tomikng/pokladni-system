import api from "@/api";
import { ApiTypes } from "@/app/types/api";

export const createStockImport = async (
  access: string,
  stockImportData: ApiTypes.CreateStockImport,
) => {
  try {
    const formData = new FormData();
    if (stockImportData.supplier !== undefined) {
      formData.append("supplier", stockImportData.supplier.toString());
    }
    if (stockImportData.ico !== undefined) {
      formData.append("ico", stockImportData.ico);
    }
    if (stockImportData.invoice_number !== undefined) {
      formData.append("invoice_number", stockImportData.invoice_number);
    }
    if (stockImportData.note !== undefined) {
      formData.append("note", stockImportData.note);
    }

    if (stockImportData.invoice_pdf) {
      formData.append("invoice_pdf", stockImportData.invoice_pdf);
    }

    stockImportData.products.forEach((product, index) => {
      formData.append(
        `products[${index}].product_id`,
        product.product_id.toString(),
      );
      formData.append(
        `products[${index}].quantity`,
        product.quantity.toString(),
      );
      formData.append(
        `products[${index}].price_with_vat`,
        product.price_with_vat.toString(),
      );
      formData.append(
        `products[${index}].import_price`,
        product.import_price.toString(),
      );
    });

    console.log(formData);

    const response = await api.post("/api/stock-import/", formData, {
      headers: {
        Authorization: `Bearer ${access}`,
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
