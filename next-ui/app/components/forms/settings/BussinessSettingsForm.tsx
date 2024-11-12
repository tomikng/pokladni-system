"use client";
import React from "react";
import { Form, Input, Button, InputNumber, Row, Col, Typography } from "antd";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  EuroOutlined,
} from "@ant-design/icons";
import { ApiTypes } from "@/app/types/api";

const { Title } = Typography;

interface BusinessSettingsFormProps {
  initialData?: ApiTypes.BusinessSettings;
  onSubmit: (values: ApiTypes.BusinessSettings) => Promise<void>;
  loading?: boolean;
  title?: string;
  submitButtonText?: string;
}

const BusinessSettingsForm: React.FC<BusinessSettingsFormProps> = ({
  initialData,
  onSubmit,
  loading = false,
  title = "Nastavení",
  submitButtonText = "Uložit nastavení",
}) => {
  const [form] = Form.useForm();

  React.useEffect(() => {
    if (initialData) {
      form.setFieldsValue(initialData);
    }
  }, [initialData, form]);

  return (
    <>
      <Title level={2}>{title}</Title>
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="business_name"
              label="Název firmy"
              rules={[
                { required: true, message: "Prosím zadejte název firmy" },
              ]}
            >
              <Input prefix={<UserOutlined />} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="ico"
              label="IČO"
              rules={[
                { required: true, message: "Prosím zadejte IČO" },
                { max: 10, message: "IČO nesmí být delší než 8 znaků" },
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="dic"
              label="DIČ"
              rules={[
                { required: true, message: "Prosím zadejte DIČ" },
                { max: 8, message: "DIČ nesmí být delší než 10 znaků" },
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="contact_email"
              label="Kontaktní email"
              rules={[
                { required: true, message: "Prosím zadejte kontaktní email" },
                { type: "email", message: "Prosím zadejte platný email" },
              ]}
            >
              <Input prefix={<MailOutlined />} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="contact_phone"
              label="Kontaktní telefon"
              rules={[
                { required: true, message: "Prosím zadejte kontaktní telefon" },
              ]}
            >
              <Input prefix={<PhoneOutlined />} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="address"
              label="Adresa"
              rules={[{ required: true, message: "Prosím zadejte adresu" }]}
            >
              <Input.TextArea />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="euro_rate"
              label="Kurz eura"
              rules={[{ required: true, message: "Prosím zadejte kurz eura" }]}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                precision={4}
                prefix={<EuroOutlined />}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            {submitButtonText}
          </Button>
        </Form.Item>
      </Form>
    </>
  );
};

export default BusinessSettingsForm;
