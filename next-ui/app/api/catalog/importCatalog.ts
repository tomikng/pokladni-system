import api from "@/api";
import { CustomSession } from "@/app/types/api";
import { message } from "antd";

export const importCatalog = async (
  file: File,
  session: CustomSession,
): Promise<void> => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    await api.post(`/api/catalog/import_catalog/`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${session?.access}`,
      },
    });
    message.success(`Catalog imported successfully`);
  } catch (error) {
    message.error(`Failed to import catalog`);
  }
};
