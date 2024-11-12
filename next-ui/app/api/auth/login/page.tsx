"use client";
import { useRouter } from "next/navigation";
import { Button, Card, Form, Input, message, Typography } from "antd";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { useState } from "react";
import { LockOutlined, UserOutlined } from "@ant-design/icons";

const { Title } = Typography;

const SignIn = () => {
  const router = useRouter();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSignIn = async (values: any) => {
    setIsLoggingIn(true);
    const result = await signIn("credentials", {
      redirect: false,
      username: values.username,
      password: values.password,
    });
    setIsLoggingIn(false);

    if (result?.ok) {
      router.push("/");
    } else {
      if (result?.error === "CredentialsSignin") {
        message.error("Neplatné přihlašovací údaje. Prosím zkuste znovu.");
      } else {
        message.error(
          result?.error ||
            "Neočekávaná chyba při přihlašování. Prosím zkuste znovu."
        );
      }
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background:
          "linear-gradient(to right, #f5f5f5, #fafaee)",
        backdropFilter: "blur(8px)",
      }}
    >
      <Card
        title={
          <Title level={4} style={{ textAlign: "center" }}>
            <LockOutlined style={{ marginRight: "8px" }} />
            Přihlášení
          </Title>
        }
        style={{
          width: 380,
          padding: "30px",
          borderRadius: "20px",
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.15)",
          border: "1px solid rgba(255, 255, 255, 0.4)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <Image src="/logo.png" alt="POS Logo" width={120} height={120} />
        </div>
        <Form onFinish={handleSignIn}>
          <Form.Item
            name="username"
            rules={[
              { required: true, message: "Prosím vyplňte uživatelské jméno!" },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="Uživatelské jméno" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: "Prosím vyplňte heslo!" }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Heslo" />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={isLoggingIn}
            >
              Přihlásit se
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default SignIn;
