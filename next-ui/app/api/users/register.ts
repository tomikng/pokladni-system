import api from "@/api";
import { RegistrationBody } from "@/app/types/api";

export const registerUser = async (body: RegistrationBody, token: string) => {
  try {
    const response = await api.post("/auth/register/", body, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: any) {
    throw error.response.data;
  }
};
