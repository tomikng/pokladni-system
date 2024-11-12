"use client";

import React from "react";
import { Card, message, Form } from "antd";
import { useSession } from "next-auth/react";
import { registerUser } from "@/app/api/users/register";
import { CustomSession } from "@/app/types/api";
import UserRegistrationForm from "@/app/components/forms/users/RegisterUserForm";
import { showMessage } from "@/app/lib/showMessage";

const AddUserForm: React.FC = () => {
  const [form] = Form.useForm();
  const { data: session }: { data: CustomSession | any } = useSession();
  const [isAdding, setIsAdding] = React.useState(false);

  const [messageApi, contextHolder] = message.useMessage();

  const onFinish = async (values: any) => {
    const body = {
      ...values,
      password2: values.password,
    };
    try {
      setIsAdding(true);
      await registerUser(body, session.access);
      setIsAdding(false);
      showMessage("success", "Uživatel byl úspěšně zaregistrován", messageApi);
      form.resetFields();
    } catch (e: any) {
      showMessage("error", e.response.data.detail, messageApi);
    }
  };

  return (
    <>
      {contextHolder}
      <Card
        title="Registrace nového uživatele"
        bordered={false}
        style={{ maxWidth: 600, margin: "auto", marginTop: 20 }}
      >
        <UserRegistrationForm
          form={form}
          onFinish={onFinish}
          isLoading={isAdding}
        />
      </Card>
    </>
  );
};

export default AddUserForm;
