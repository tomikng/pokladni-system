import { NextRequestWithAuth, withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import axios from "axios";

export default withAuth(
    async function middleware(req: NextRequestWithAuth) {
        if (!req.nextauth.token) {
            return NextResponse.rewrite(new URL("/api/auth/signin", req.url));
        }

        const isTokenValid = await checkTokenValidity(req.nextauth.token.access as string);
        console.log("Token is valid:", isTokenValid)

        if (!isTokenValid) {
            return NextResponse.redirect(new URL("/api/auth/signin", req.url));
        }

        const settingsExist = await checkBusinessSettingsExist(req.nextauth.token.access as string);

        if (!settingsExist && req.nextUrl.pathname !== "/initial-setup" && req.nextauth.token) {
            return NextResponse.rewrite(new URL("/initial-setup", req.url));
        }
        else if (settingsExist && req.nextUrl.pathname === "/initial-setup") {
            return NextResponse.rewrite(new URL("/", req.url));
        }

        // Existing role-based route protection
        const protectedRoutes = ["/settings", "/statistics", "/user-management"];

        if (
            protectedRoutes.some((route) => req.nextUrl.pathname.startsWith(route)) &&
            !["AD", "MA"].includes(req.nextauth.token?.role as string)
        ) {
            return NextResponse.redirect(new URL("/", req.url));
        }
    },
    {
        callbacks: {
            authorized: () => true,
        },
    }
);

async function checkTokenValidity(accessToken: string): Promise<boolean> {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_PUBLIC_BASE_AUTH_URL}/auth/token/verify/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: accessToken }),
        });

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            const data = await response.json();
            if (data.code === "token_not_valid") {
                return false;
            }
        } else {
            console.error("Received non-JSON response:", await response.text());
            return false;
        }

        return response.ok;
    } catch (error) {
        console.error("Error checking token validity:", error);
        return false;
    }
}

async function checkBusinessSettingsExist(accessToken: string): Promise<boolean> {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_PUBLIC_BASE_AUTH_URL}/settings/business-settings/check_settings_exist/`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        const data = await response.json();
        return data.settings_exist;
    } catch (error) {
        console.error("Error checking business settings:", error);
        return false;
    }
}

export const config = { matcher: ["/((?!api/auth).*)"] };