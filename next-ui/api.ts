import axios, { AxiosRequestConfig } from "axios";
import { signIn } from "next-auth/react";
import { getSession } from "./app/lib/helpers/getSession";
import { CustomSession } from "@/app/types/api";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_PUBLIC_BASE_URL,
  headers: {
    "content-type": "application/json",
  },
} as AxiosRequestConfig);

const isPageReload = (): boolean => {
  if (typeof window !== "undefined" && window.performance) {
    const navigationEntries = performance.getEntriesByType(
      "navigation",
    ) as PerformanceNavigationTiming[];
    if (navigationEntries.length > 0) {
      return navigationEntries[0].type === "reload";
    }
  }
  return false;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    console.log("Interceptor triggered:", error.response.status);

    if (
      error.response.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== "/auth/token/refresh/"
    ) {
      console.log("Token expired. Attempting to refresh...");
      originalRequest._retry = true;

      let session: CustomSession;
      try {
        session = await getSession();
      } catch (error) {
        console.error("Error getting session:", error);

        // Check if the error is from a page reload
        if (!isPageReload()) {
          await signIn();
        }
        return Promise.reject(error);
      }

      if (session && session.refresh) {
        if (!session.refreshTokenExpires) {
          console.log("No refresh token expiry date. Redirecting to login...");
          if (!isPageReload()) {
            await signIn();
          }
          return Promise.reject(error);
        }
        if (Date.now() >= session.refreshTokenExpires) {
          console.log("Refresh token expired. Redirecting to login...");
          if (!isPageReload()) {
            await signIn();
          }
          return Promise.reject(error);
        }

        try {
          const response = await api.post(
            process.env.NEXT_PUBLIC_PUBLIC_BASE_AUTH_URL +
              "/auth/token/refresh/",
            { refresh: session.refresh },
          );

          if (response && response.data.access) {
            console.log("Token refreshed successfully");
            await signIn("credentials", {
              redirect: false,
              access: response.data.access,
              refresh: session.refresh,
            });

            originalRequest.headers["Authorization"] =
              `Bearer ${response.data.access}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error("Token refresh failed", refreshError);
          if (!isPageReload()) {
            await signIn();
          }
        }
      } else {
        console.log("No refresh token available.");
        if (!isPageReload()) {
          await signIn();
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;
