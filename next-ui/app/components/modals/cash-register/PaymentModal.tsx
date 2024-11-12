import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  Form,
  InputNumber,
  Select,
  Button,
  Input,
  Row,
  Col,
  Typography,
  Divider,
  Checkbox,
  message,
  Alert,
} from "antd";
import { ApiTypes, CustomSession } from "@/app/types/api";
import { useSession } from "next-auth/react";
import { createSale } from "@/app/api/sales/createSale";
import { fetchEuroRate } from "@/app/api/settings/fetchEuroRate";
import PaymentSummaryModal from "./PaymentSummaryModal";
import ReceiptContent from "@/app/components/printing/ReceiptContent";
import BusinessSettings = ApiTypes.BusinessSettings;
import { fetchBusinessSettings } from "@/app/api/settings/fetchBussinessSettings";

const { Title } = Typography;

interface PaymentModalProps {
  visible: boolean;
  onCancel: () => void;
  onOk: () => void;
  totalDue: number;
  selectedProducts: {
    product: ApiTypes.Product;
    quantity: number;
  }[];
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  visible,
  onCancel,
  onOk,
  totalDue,
  selectedProducts,
}) => {
  const [form] = Form.useForm();
  const [received, setReceived] = useState(0);
  const [changeDue, setChangeDue] = useState(0);
  const [currency, setCurrency] = useState("CZK");
  const [convertedTotalDue, setConvertedTotalDue] = useState(totalDue);
  const [discountType, setDiscountType] = useState("percent");
  const [discountValue, setDiscountValue] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [printReceipt, setPrintReceipt] = useState(false);
  const [euroRate, setEuroRate] = useState<number>(25.5); // Default value
  const [isDefaultRate, setIsDefaultRate] = useState(true);
  const { data: session }: { data: CustomSession } = useSession();
  const [paymentSummaryVisible, setPaymentSummaryVisible] = useState(false);
  const [saleId, setSaleId] = useState<number | null>(null);
  const [businessSettings, setBusinessSettings] =
    useState<BusinessSettings | null>(null); // State to hold business settings

  const receiptRef = useRef<HTMLDivElement>(null); // Ref for the receipt

  const handleReceiptChange = (e: any) => {
    setPrintReceipt(e.target.checked);
  };

  const printReceiptFunction = () => {
    if (receiptRef.current) {
      const printWindow = window.open("", "_blank");
      printWindow?.document.write(receiptRef.current.innerHTML);
      printWindow?.document.close();
      printWindow?.focus();
      printWindow?.print();
      printWindow?.close();
    }
  };

  useEffect(() => {
    const getEuroRate = async () => {
      if (session?.access) {
        try {
          const rate = await fetchEuroRate(session.access);
          setEuroRate(rate);
          setIsDefaultRate(false);
        } catch (error) {
          console.error("Failed to fetch euro rate:", error);
          message.error("Nepodařilo se načíst kurz eura");
          setIsDefaultRate(true);
        }
      }
    };

    const getBusinessSettings = async () => {
      if (session?.access) {
        try {
          const settings = await fetchBusinessSettings(session.access);
          setBusinessSettings(settings);
        } catch (error) {
          console.error("Failed to fetch business settings:", error);
          message.error("Nepodařilo se načíst obchodní nastavení");
        }
      }
    };

    getEuroRate();
    getBusinessSettings();
  }, [session?.access]);

  useEffect(() => {
    const convertCurrency = (amount: number, currency: string) => {
      const rate = currency === "EUR" ? euroRate : 1;
      const convertedAmount = currency === "EUR" ? amount / rate : amount;
      const discountedAmount = applyDiscount(convertedAmount);
      const roundedAmount =
        paymentMethod === "Cash"
          ? Math.round(discountedAmount)
          : discountedAmount;
      setConvertedTotalDue(roundedAmount);
    };

    const applyDiscount = (amount: number) => {
      const numericValue = Number(discountValue) || 0;
      return discountType === "percent"
        ? amount - (amount * numericValue) / 100
        : amount - numericValue;
    };

    convertCurrency(totalDue, currency);
  }, [
    currency,
    totalDue,
    discountType,
    discountValue,
    paymentMethod,
    euroRate,
  ]);

  useEffect(() => {
    calculateChange(received, convertedTotalDue);
  }, [received, convertedTotalDue]);

  const handleReceivedChange = (value: number | null) => {
    const numericValue = value ?? 0;
    setReceived(numericValue);
  };

  const calculateChange = (received: number, total: number) => {
    const newChangeDue = received >= total ? received - total : 0;
    setChangeDue(newChangeDue);
  };

  const handleCurrencyChange = (value: string) => {
    setCurrency(value);
  };

  const handlePaymentMethodChange = (value: string) => {
    setPaymentMethod(value);
    if (value !== "Cash") {
      setReceived(0);
      setChangeDue(0);
    }
  };

  const handleDiscountChange = (value: number, type: string) => {
    setDiscountType(type);
    setDiscountValue(value);
  };

  const resetFields = () => {
    form.resetFields();
    setReceived(0);
    setChangeDue(0);
    setCurrency("CZK");
    setConvertedTotalDue(totalDue);
    setDiscountType("percent");
    setDiscountValue(0);
    setPaymentMethod("Cash");
    setPrintReceipt(false);
    setSaleId(null);
    setPaymentSummaryVisible(false);
  };

  const handleSubmit = async () => {
    try {
      await form.validateFields();

      if (!session?.user?.id) {
        message.error("Nepodařilo se získat údaje o uživateli");
        return;
      }
      const items = selectedProducts.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.price_with_vat,
      }));

      const saleData = {
        cashier: session?.user?.id,
        total_amount: convertedTotalDue,
        items: items,
        payment: {
          payment_type: paymentMethod,
        },
      };

      if (!session?.access) {
        message.error("Chyba při ukládaní prodeje, prosím zkuste znova");
        return;
      }
      const response = await createSale(session?.access, saleData);
      setSaleId(response.id);
      setPaymentSummaryVisible(true);
      if (printReceipt) {
        printReceiptFunction();
      }
      onOk();
      message.success("Platba byla úspěšně odeslána");
    } catch (errorInfo) {
      console.log("Failed:", errorInfo);
      message.error("Chyba při ukládaní prodeje, prosím zkuste znova");
    }
  };

  return (
    <>
      <Modal
        title="Platba"
        open={visible}
        onCancel={onCancel}
        onOk={handleSubmit}
        width={800}
        footer={[
          <Button key="back" onClick={onCancel}>
            Zrušit
          </Button>,
          <Button key="submit" type="primary" onClick={handleSubmit}>
            Odeslat platbu
          </Button>,
        ]}
      >
        <Divider />
        {isDefaultRate && (
          <Alert
            message="Upozornění"
            description="Používá se výchozí kurz eura. Aktuální kurz se nepodařilo načíst. Pokud jste ještě neaktualizovali kurz eura, doporučujeme to provést v nastavení."
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <Form form={form} layout="vertical">
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="amountDue" label="Celková částka">
                <Title level={3} style={{ marginBottom: 0 }}>
                  {convertedTotalDue.toFixed(paymentMethod === "cash" ? 0 : 2)}{" "}
                  {currency}
                </Title>
              </Form.Item>
              <Form.Item name="paymentMethod" label="Způsob platby">
                <Select
                  defaultValue="Cash"
                  onChange={handlePaymentMethodChange}
                >
                  <Select.Option value="Cash">Hotovost</Select.Option>
                  <Select.Option value="Card">Kreditní karta</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="currency" label="Měna">
                <Select defaultValue="CZK" onChange={handleCurrencyChange}>
                  <Select.Option value="CZK">CZK</Select.Option>
                  <Select.Option value="EUR">
                    EUR (Kurz: {euroRate?.toFixed(4) || "Načítání..."})
                  </Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="received" label="Přijatá částka">
                <InputNumber
                  min={0}
                  onChange={handleReceivedChange}
                  disabled={paymentMethod !== "Cash"}
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="discountType" label="Typ slevy">
                <Select
                  defaultValue="percent"
                  onChange={(value) =>
                    handleDiscountChange(discountValue, value)
                  }
                >
                  <Select.Option value="percent">Procentuální</Select.Option>
                  <Select.Option value="fixed">Pevná částka</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="discountValue" label="Hodnota slevy">
                <Input
                  onChange={(e) =>
                    handleDiscountChange(
                      parseFloat(e.target.value),
                      discountType,
                    )
                  }
                  addonAfter={discountType === "percent" ? "%" : currency}
                />
              </Form.Item>
              <Form.Item>
                <Checkbox
                  checked={printReceipt}
                  onChange={handleReceiptChange}
                  style={{ marginBottom: 16 }}
                >
                  Vytisknout účtenku
                </Checkbox>
              </Form.Item>
              <Form.Item>
                <Row justify="center">
                  <Col>
                    <Title level={4}>Vráceno</Title>
                    <Title level={2} style={{ marginBottom: 0 }}>
                      {changeDue.toFixed(paymentMethod === "Cash" ? 0 : 2)}{" "}
                      {currency}
                    </Title>
                  </Col>
                </Row>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
      {saleId && (
        <PaymentSummaryModal
          visible={paymentSummaryVisible}
          onCancel={() => {
            setPaymentSummaryVisible(false);
            resetFields(); // Reset fields after closing the payment summary modal
          }}
          received={received}
          saleId={saleId}
        />
      )}
      <div style={{ display: "none" }}>
        {businessSettings && (
          <ReceiptContent
            ref={receiptRef}
            saleDetails={{
              selectedProducts,
              totalDue: convertedTotalDue,
              received,
              changeDue,
              currency,
            }}
            businessSettings={businessSettings}
          />
        )}
      </div>
    </>
  );
};

export default PaymentModal;
