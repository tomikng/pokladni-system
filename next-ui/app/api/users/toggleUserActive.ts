import api from "@/api";

export async function toggleUserActive(accessToken: string, userId: number) {
  try {
    const response = await api.patch(
      `/auth/users/${userId}/toggle_active/`,
      null,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error toggling user active status:", error);
    throw error;
  }
}
