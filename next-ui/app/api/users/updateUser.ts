import api from "@/api";

export async function updateUser(
  accessToken: string,
  userId: number,
  data: any
) {
  try {
    const response = await api.put(`/auth/users/${userId}/`, data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
}
