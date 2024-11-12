import api from "@/api";

// Get all invoices
export const getInvoices = async (access: string) => {
  try {
    const response = await api.get("/api/invoices/", {
      headers: {
        Authorization: `Bearer ${access}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching invoices:", error);
    throw error;
  }
};

// Create a new invoice
export const createInvoice = async (invoiceData: any, access: string) => {
  try {
    const response = await api.post("/api/invoices/", invoiceData, {
      headers: {
        Authorization: `Bearer ${access}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error creating invoice:", error);
    throw error;
  }
};

// Get a specific invoice by ID
export const getInvoiceById = async (invoiceId: number, access: string) => {
  try {
    const response = await api.get(`/api/invoices/${invoiceId}/`, {
      headers: {
        Authorization: `Bearer ${access}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching invoice:", error);
    throw error;
  }
};

// Update an invoice
export const updateInvoice = async (
  invoiceId: number,
  invoiceData: any,
  access: string
) => {
  try {
    const response = await api.put(`/api/invoices/${invoiceId}/`, invoiceData, {
      headers: {
        Authorization: `Bearer ${access}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error updating invoice:", error);
    throw error;
  }
};

// Delete an invoice
export const deleteInvoice = async (invoiceId: number, access: string) => {
  try {
    await api.delete(`/api/invoices/${invoiceId}/`, {
      headers: {
        Authorization: `Bearer ${access}`,
      },
    });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    throw error;
  }
};
