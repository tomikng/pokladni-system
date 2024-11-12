import api from "@/api";

export async function getUsers(accessToken: string) {
  try {
    const response = await api.get("/auth/users/", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
}
