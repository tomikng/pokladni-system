import api from "@/api";
import { CustomSession } from "@/app/types/api";
import { message } from "antd";

export const exportCatalog = async (session: CustomSession): Promise<void> => {
  try {
    const response = await api.get(`/api/catalog/export_catalog`, {
      responseType: "blob",
      headers: {
        Authorization: `Bearer ${session?.access}`,
      },
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "catalog.csv");
    document.body.appendChild(link);
    link.click();
  } catch (error) {
    message.error(`Failed to export catalog`);
  }
};
