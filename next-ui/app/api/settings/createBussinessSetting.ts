import api from "@/api";

export const createBusinessSettings = async (
    accessToken: string,
    data: any
): Promise<any> => {
    try {
        const response = await api.post("/settings/business-settings/", data, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error creating business settings:", error);
        throw error;
    }
};