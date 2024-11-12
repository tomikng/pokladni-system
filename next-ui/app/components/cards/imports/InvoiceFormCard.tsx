import React from "react";
import { Card, Divider, FormInstance, Typography } from "antd";
import InvoiceForm from "../../forms/import/InvoiceForms";

const { Title } = Typography;

interface InvoiceFormCardProps {
  form: FormInstance;
  onFinish: (values: any) => void;
  style?: React.CSSProperties;
}

const InvoiceFormCard: React.FC<InvoiceFormCardProps> = ({
  form,
  onFinish,
  style,
}) => {
  return (
    <Card style={style}>
      <Title level={3}>Nový import</Title>
      <Divider />
      <InvoiceForm form={form} />
    </Card>
  );
};

export default InvoiceFormCard;
