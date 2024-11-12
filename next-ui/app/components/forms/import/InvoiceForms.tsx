import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Upload,
  Row,
  Col,
  Typography,
  Space,
  FormInstance,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import SupplierSelect from "../../selects/SupplierSellect";
import { ApiTypes } from "@/app/types/api";

const { Text } = Typography;

interface InvoiceFormProps {
  form: FormInstance;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ form }) => {
  const [selectedSupplier, setSelectedSupplier] =
    useState<ApiTypes.Supplier | null>(null);
  const [fileList, setFileList] = useState([]);

  useEffect(() => {
    form.setFieldsValue({
      ico: selectedSupplier?.ico || "",
      supplier: selectedSupplier?.id || "",
    });
  }, [selectedSupplier, form]);

  const handleFileChange = (info: any) => {
    let newFileList = [...info.fileList];

    newFileList = newFileList.slice(-1);

    setFileList(newFileList as any);

    form.setFieldsValue({ pdf: newFileList });
  };

  return (
    <Form form={form}>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="supplier">
            <Space
              direction="vertical"
              style={{ width: "100%" }}
              size={"small"}
            >
              <Text type="secondary">Dodavatel</Text>
              <SupplierSelect
                form={form}
                setSelectedSupplier={setSelectedSupplier}
              />
            </Space>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="ico">
            <Space
              direction="vertical"
              style={{ width: "100%" }}
              size={"small"}
            >
              <Text type="secondary">IČO</Text>
              <Form.Item name="ico" noStyle>
                <Input
                  disabled={!!selectedSupplier}
                  placeholder="Zadejte IČO"
                />
              </Form.Item>
            </Space>
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="invoice_number">
            <Space
              direction="vertical"
              style={{ width: "100%" }}
              size={"small"}
            >
              <Text type="secondary">Číslo dokladu</Text>
              <Input placeholder="Zadejte číslo dokladu" />
            </Space>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="pdf"
            valuePropName="fileList"
            getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
          >
            <Space
              direction="vertical"
              style={{ width: "100%" }}
              size={"small"}
            >
              <Text type="secondary">Faktura</Text>
              <Upload
                accept=".pdf"
                beforeUpload={() => false}
                fileList={fileList}
                onChange={handleFileChange}
                maxCount={1}
                style={{ width: "100%" }}
              >
                <Button icon={<UploadOutlined />} style={{ width: "100%" }}>
                  Nahrát složku
                </Button>
              </Upload>
            </Space>
          </Form.Item>
        </Col>
      </Row>
      <Form.Item name="note" labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}>
        <Space direction="vertical" style={{ width: "100%" }} size={"small"}>
          <Text type="secondary">Poznámka</Text>
          <Input.TextArea rows={1} placeholder="Zadejte poznámku" />
        </Space>
      </Form.Item>
    </Form>
  );
};

export default InvoiceForm;
