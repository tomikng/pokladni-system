import React from "react";
import { Form, Input, Select, Button } from "antd";
import { NamePath } from "rc-field-form/es/interface";
import { MessageInstance, NoticeType } from "antd/es/message/interface";

const { Option } = Select;

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 8 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 16 },
  },
};

const tailFormItemLayout = {
  wrapperCol: {
    xs: {
      span: 24,
      offset: 0,
    },
    sm: {
      span: 16,
      offset: 8,
    },
  },
};

export type UserRegistrationFormProps = {
  form: any;
  onFinish: (values: any) => void;
  isLoading?: boolean;
};

const UserRegistrationForm = ({
  form,
  onFinish,
  isLoading,
}: UserRegistrationFormProps) => {
  return (
    <Form
      {...formItemLayout}
      form={form}
      name="register"
      onFinish={onFinish}
      scrollToFirstError
    >
      <Form.Item
        name="username"
        label="Username"
        tooltip="Uživatelské jméno nesmí obsahovat mezery!"
        rules={[
          {
            required: true,
            message: "Prosím zadejte uživatelské jméno!",
          },
          {
            validator: async (_, value) =>
              !value.includes(" ")
                ? Promise.resolve()
                : Promise.reject(
                    new Error("Uživatelské jméno nesmí obsahovat mezery!")
                  ),
          },
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="first_name"
        label="Křestní jméno"
        rules={[
          {
            required: true,
            message: "Prosím zadejte křestní jméno!",
          },
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="last_name"
        label="Příjmení"
        rules={[
          {
            required: true,
            message: "Prosím zadejte příjmení!",
          },
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="email"
        label="E-mail"
        rules={[
          {
            type: "email",
            message: "Zadaný e-mail není platný!",
          },
          {
            required: true,
            message: "Prosím zadejte e-mail!",
          },
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="password"
        label="Heslo"
        rules={[
          {
            required: true,
            message: "Prosím zadejte heslo!",
          },
        ]}
        hasFeedback
      >
        <Input.Password />
      </Form.Item>
      <Form.Item
        name="password2"
        label="Potvrzení hesla"
        dependencies={["password"] as NamePath[]}
        hasFeedback
        rules={[
          {
            required: true,
            message: "Prosím potvrďte heslo!",
          },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue("password") === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error("Zadaná hesla se neshodují!"));
            },
          }),
        ]}
      >
        <Input.Password />
      </Form.Item>
      <Form.Item
        name="role"
        label="Role"
        rules={[{ required: true, message: "Posím vyberte roli" }]}
      >
        <Select placeholder="Vyberte roli">
          <Option value="CA">Pokladní</Option>
          <Option value="MA">Manažer</Option>
        </Select>
      </Form.Item>
      <Form.Item {...tailFormItemLayout}>
        <Button type="primary" htmlType="submit" loading={isLoading}>
          Přidat uživatele
        </Button>
      </Form.Item>
    </Form>
  );
};

export default UserRegistrationForm;
