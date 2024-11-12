import React from "react";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import AuthContext from "./components/NextAuthProvider";
import Head from "next/head";

export const metadata = {
  title: "Point of Sale",
  description: "Created by Hai Hung Nguyen, Point of sale system",
  keywords: "Point of sale, POS, Hai Hung Nguyen",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <Head>
        <link rel="shortcut icon" href="/favicon.ico" sizes="any" />
      </Head>
      <body>
        <AntdRegistry>
          <AuthContext>{children}</AuthContext>
        </AntdRegistry>
      </body>
    </html>
  );
}
