import React from "react";
import { Button, Form, FormInstance, Input } from "antd";
import { validateICO } from "@/app/lib/validators/validateICO";
import { validateDIC } from "@/app/lib/validators/validateDIC";
import { validatePhoneNumber } from "@/app/lib/validators/validatePhoneNumber";

interface SupplierFormProps {
  form: FormInstance;
  onFinish?: (values: any) => void;
}

const SupplierForm: React.FC<SupplierFormProps> = ({ form, onFinish }) => {
  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Form.Item
        name="name"
        label="Název dodavatele"
        rules={[{ required: true, message: "Prosím zadejte název dodavatele" }]}
      >
        <Input />
      </Form.Item>
      <Form.Item name="address" label="Sídlo dodavatele">
        <Input />
      </Form.Item>
      <Form.Item
        name="phone_number"
        label="Telefonní číslo"
        rules={[
          () => ({
            validator(_, value) {
              if (!value || validatePhoneNumber(value)) {
                return Promise.resolve();
              }
              return Promise.reject(new Error("Neplatné telefonní číslo"));
            },
          }),
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="email"
        label="Email"
        rules={[{ type: "email", message: "Neplatný formát emailu" }]}
      >
        <Input type="email" />
      </Form.Item>
      <Form.Item
        name="ico"
        label="ICO"
        rules={[
          { required: true, message: "Prosím zadejte ICO dodavatele" },
          () => ({
            validator(_, value) {
              if (!value || validateICO(value)) {
                return Promise.resolve();
              }
              return Promise.reject(new Error("Neplatné ICO"));
            },
          }),
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="dic"
        label="DIC"
        rules={[
          { required: true, message: "Prosím zadejte DIC dodavatele" },
          () => ({
            validator(_, value) {
              if (!value || validateDIC(value)) {
                return Promise.resolve();
              }
              return Promise.reject(new Error("Neplatné DIC"));
            },
          }),
        ]}
      >
        <Input />
      </Form.Item>
      {onFinish && (
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Uložit
          </Button>
        </Form.Item>
      )}
    </Form>
  );
};

export default SupplierForm;
