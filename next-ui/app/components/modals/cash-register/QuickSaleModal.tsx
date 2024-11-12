import React, { useEffect, useState, useCallback } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Divider,
  message,
} from "antd";
import _ from "lodash";
import { fetchTaxRates } from "@/app/api/products/fetchTaxRates";
import { fetchProducts } from "@/app/api/products/fetchProducts";
import { useSession } from "next-auth/react";
import { ApiTypes, CustomSession } from "@/app/types/api";
import { createQuickSale } from "@/app/api/quick-sale/createQuickSale";

interface QuickSaleModalProps {
  visible: boolean;
  onCancel: () => void;
  onOk: (values: any) => void;
}

const QuickSaleModal = ({ visible, onCancel, onOk }: QuickSaleModalProps) => {
  const [form] = Form.useForm();
  const [taxRates, setTaxRates] = useState<ApiTypes.TaxRate[]>([]);
  const [eanExists, setEanExists] = useState(false);
  const { data: session }: { data: CustomSession } = useSession();

  const checkEan = useCallback(
    (ean: string) => {
      if (ean.length === 0) return;
      if (!session?.access) return;
      fetchProducts(session.access, undefined, 1, 1, ean).then(
        (productData) => {
          if (productData.results.length > 0) {
            message.error("EAN kód již v databázi existuje.");
            setEanExists(true);
          } else {
            setEanExists(false);
          }
        },
      );
    },
    [session?.access],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedCheckEan = useCallback(_.debounce(checkEan, 500), [checkEan]);

  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        form.getFieldInstance("ean").focus();
      }, 100);
    }
    if (!session?.access) return;
    fetchTaxRates(session.access).then((data) => {
      setTaxRates(data);
    });
  }, [visible, form, session?.access]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (eanExists) {
        message.error("Nelze pokračovat, EAN již existuje.");
        return;
      }
      if (!session?.access) return;
      await createQuickSale(session.access, values);
      onOk({ ...values });
    } catch (errorInfo) {
      console.log("Selhání:", errorInfo);
    }
  };

  return (
    <Modal
      title="Rychlý prodej"
      open={visible}
      onCancel={onCancel}
      onOk={handleOk}
      footer={[
        <Button key="back" onClick={onCancel}>
          Zrušit
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleOk}
          disabled={eanExists}
        >
          Přidat a uložit
        </Button>,
      ]}
    >
      <Divider orientation="left">Nový produkt</Divider>
      <Form form={form} layout="vertical">
        <Form.Item name="ean" label="EAN">
          <Input
            placeholder="EAN kód"
            onChange={(e) => debouncedCheckEan(e.target.value)}
          />
        </Form.Item>
        <Form.Item
          name="name"
          label="Název"
          rules={[
            { required: true, message: "Prosím, zadejte název produktu!" },
          ]}
        >
          <Input placeholder="Název produktu" />
        </Form.Item>
        <Form.Item
          name="tax_rate"
          label="Sazba DPH"
          rules={[{ required: true, message: "Prosím, vyberte sazbu DPH!" }]}
        >
          <Select placeholder="Vyberte sazbu DPH">
            {taxRates.map((taxRate) => (
              <Select.Option key={taxRate.value} value={taxRate.value}>
                {taxRate.label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name={"price_with_vat"}
          label="Cena s DPH"
          rules={[{ required: true, message: "Prosím, zadejte ceny s DPH!" }]}
        >
          <InputNumber
            min={0}
            step={0.01}
            precision={2}
            placeholder="Cena produktu"
          />
        </Form.Item>
        <Form.Item
          name="quantity"
          label="Počet"
          rules={[
            {
              required: true,
              message: "Prosím, zadejte počet kusů!",
            },
          ]}
        >
          <InputNumber min={1} max={1000} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default QuickSaleModal;
