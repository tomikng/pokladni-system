"use client";

import React, { useState } from "react";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { Button, Layout, Popover } from "antd";
import dynamic from "next/dynamic";
import Image from "next/image";
import { UserComponent } from "./UserComponent";
import { useRouter } from "next/navigation";

const MenuBar = dynamic(() => import("@/app/components/MenuBar"), {
  ssr: false,
});

const { Header, Sider, Content } = Layout;

export default function LayoutComponent({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [openLogoutPopover, setOpenLogoutPopover] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    setOpenLogoutPopover(false);
    router.push("/api/auth/signout");
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpenLogoutPopover(newOpen);
  };

  return (
    <Layout>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{ background: "white" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "64px", // Set a fixed height for the logo container
          }}
        >
          <Image
            src="/logo.png"
            alt="logo"
            width={collapsed ? 40 : 80}
            height={collapsed ? 40 : 80}
          />
        </div>
        <MenuBar collapsed={collapsed} />
      </Sider>
      <Layout>
        <Header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0",
            background: "white",
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: "16px",
              width: 64,
              height: 64,
            }}
          />
          <Popover
            content={
              <Button
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                danger
                type={"text"}
              >
                Odhlásit se
              </Button>
            }
            trigger="click"
            open={openLogoutPopover}
            onOpenChange={handleOpenChange}
          >
            <UserComponent onClick={() => {}} />
          </Popover>
        </Header>
        <Content
          style={{
            background: "linear-gradient(to right, #f5f5f5, #fafaee)",
            padding: 24,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
