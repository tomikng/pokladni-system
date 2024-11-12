"use client";

import React from "react";
import { Form, Input, DatePicker, Select, Switch, Button } from "antd";
import moment from "moment";
import Voucher = ApiTypes.Voucher;
import { ApiTypes } from "@/app/types/api";

const { Option } = Select;

interface VoucherFormProps {
  initialValues?: Voucher;
  onSubmit: (values: Voucher) => Promise<void>;
  editingVoucherId?: number | null;
}

const VoucherForm: React.FC<VoucherFormProps> = ({
  initialValues,
  onSubmit,
  editingVoucherId,
}) => {
  const [form] = Form.useForm<Voucher>();

  React.useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
        expiration_date: moment(initialValues.expiration_date) as any,
        is_active: initialValues.is_active,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ is_active: true }); // Default value for new voucher
    }
  }, [initialValues, form]);

  const handleSubmit = async (values: Voucher) => {
    await onSubmit(values);
  };

  return (
    <Form<Voucher> form={form} onFinish={handleSubmit} layout="vertical">
      <Form.Item
        name="ean_code"
        label="EAN kód"
        rules={[{ required: true, message: "Zadejte EAN kód" }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="title"
        label="Název"
        rules={[{ required: true, message: "Zadejte název" }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="expiration_date"
        label="Platnost do"
        rules={[{ required: true, message: "Zadejte datum platnosti" }]}
      >
        <DatePicker showTime format="DD.MM.YYYY HH:mm" />
      </Form.Item>
      <Form.Item
        name="discount_type"
        label="Typ slevy"
        rules={[{ required: true, message: "Vyberte typ slevy" }]}
      >
        <Select>
          <Option value="Percentage">Procenta</Option>
          <Option value="Fixed">Fixní částka</Option>
        </Select>
      </Form.Item>
      <Form.Item
        name="discount_amount"
        label="Hodnota slevy"
        rules={[{ required: true, message: "Zadejte hodnotu slevy" }]}
      >
        <Input type="number" />
      </Form.Item>
      <Form.Item name="is_active" label="Aktivní" valuePropName="checked">
        <Switch defaultChecked />
      </Form.Item>
      <Form.Item name="description" label="Popis">
        <Input.TextArea />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit">
          {editingVoucherId ? "Aktualizovat" : "Vytvořit"}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default VoucherForm;
