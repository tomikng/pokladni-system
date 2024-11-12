import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { CustomSession } from "@/app/types/api";
import axios from "axios";

const day = 86400; // Number of seconds in one day

async function verifyToken(token: string): Promise<boolean> {
  try {
    const url =
      process.env.NEXT_PUBLIC_PUBLIC_BASE_AUTH_URL + "/auth/token/verify/";
    const response = await axios.post(url, { token });
    return response.status === 200;
  } catch (error) {
    console.error("Token verification failed:", error);
    return false;
  }
}

async function refreshAccessToken(token: any) {
  try {
    const url =
      process.env.NEXT_PUBLIC_PUBLIC_BASE_AUTH_URL + "/auth/token/refresh/";
    const response = await axios.post(url, {
      refresh: token.refresh,
    });

    if (!response.data.access) {
      throw new Error("RefreshAccessTokenError");
    }

    return {
      ...token,
      access: response.data.access,
      accessTokenExpires: Date.now() + day * 1000,
    };
  } catch (error) {
    console.error("Error refreshing access token", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "username" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const body = {
          username: credentials?.username,
          password: credentials?.password,
        };
        let response: any;
        const url =
          process.env.NEXT_PUBLIC_PUBLIC_BASE_AUTH_URL + "/auth/login/";
        try {
          response = await axios.post(url, body);
          console.log(response.data);
        } catch (error) {
          console.error(error);
          return null;
        }
        if (response && response.data.access) {
          return {
            ...response.data,
            name: response.data.first_name + " " + response.data.last_name,
            accessTokenExpires: Date.now() + day * 1000,
          };
        } else {
          console.error("Invalid credentials");
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        // This is sign in
        return {
          ...token,
          ...user,
          accessTokenExpires: Date.now() + day * 1000,
        };
      }

      // Check if the token is still valid
      const isValid = await verifyToken(token.access);

      if (isValid) {
        return token;
      }

      // Token is not valid, try to refresh it
      return refreshAccessToken(token);
    },
    async session({ session, token }: { session: any; token: any }) {
      (session as CustomSession)!.access = token.access as string;
      (session as CustomSession)!.refresh = token.refresh as string;
      (session as CustomSession)!.user!.role = token.role as string;
      (session as CustomSession)!.user!.id = token.id;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/api/auth/login",
    signOut: "/api/auth/logout",
  },
};

const handlers = {
  GET: NextAuth(authOptions),
  POST: NextAuth(authOptions),
};

const auth = NextAuth(authOptions);

export { handlers, auth };
