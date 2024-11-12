"use client";
import { Button, Card, Typography, Descriptions, Skeleton } from "antd";
import { signOut, useSession } from "next-auth/react";
import { UserOutlined } from "@ant-design/icons"; // Add an icon
import { CustomSession } from "@/app/types/api";
import { useState } from "react";
import { roleMapping } from "@/app/components/UserComponent";

const { Text, Title } = Typography;

const SignOut = () => {
  const { data: session, status }: { data: CustomSession; status: any } =
    useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    await signOut({ callbackUrl: "/" });
    setIsLoggingOut(false);
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "linear-gradient(to right, #f5f5f5, #fafaee)",
        backdropFilter: "blur(8px)",
      }}
    >
      <Card
        title={
          <div style={{ display: "flex", alignItems: "center" }}>
            <UserOutlined style={{ fontSize: "20px", marginRight: "10px" }} />
            Odhlásit se
          </div>
        }
        style={{
          width: 350,
          padding: "30px",
          borderRadius: "20px",
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.15)",
          border: "1px solid rgba(255, 255, 255, 0.4)",
        }}
      >
        {status === "loading" ? (
          <Skeleton active paragraph={{ rows: 2 }} />
        ) : session ? (
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label="Uživatel">
              {session?.user?.name ?? ""}
            </Descriptions.Item>
            <Descriptions.Item label="Role">
              {session?.user?.role
                ? roleMapping[session.user.role as keyof typeof roleMapping]
                : "Neznámá role"}
            </Descriptions.Item>
          </Descriptions>
        ) : null}

        <Title level={5} style={{ marginTop: "20px" }}>
          Odhlášení
        </Title>

        <Text style={{ marginTop: "16px" }}>
          Opravdu se chcete odhlásit ze svého účtu?
        </Text>
        <Button
          type="primary"
          danger // Use danger style for sign out
          onClick={handleSignOut}
          block
          style={{ marginTop: "20px" }}
          loading={isLoggingOut}
        >
          Odhlásit se
        </Button>
      </Card>
    </div>
  );
};

export default SignOut;
