import api from "@/api";

export const fetchTaxRates = async (access: string) => {
  try {
    const response = await api.get("/api/product/tax_rates/", {
      headers: {
        Authorization: `Bearer ${access}`,
      },
    });
    return response.data.tax_rates;
  } catch (error) {
    console.error("Chyba při načítání sazeb daně:", error);
  }
};
