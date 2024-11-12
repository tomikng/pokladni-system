import React, { useEffect, useState } from "react";
import {
  Modal,
  Button,
  Typography,
  Row,
  Col,
  InputNumber,
  message,
} from "antd";
import { CustomSession } from "@/app/types/api";
import { useSession } from "next-auth/react";
import { setTip } from "@/app/api/sales/setTip";
import { fetchSaleDetail } from "@/app/api/sales/fetchSaleDetail";

const { Title, Text } = Typography;

interface PaymentSummaryModalProps {
  visible: boolean;
  onCancel: () => void;
  received: number;
  saleId: number; // Assuming you get the sale ID after creating a sale
}

const PaymentSummaryModal: React.FC<PaymentSummaryModalProps> = ({
  visible,
  onCancel,
  received,
  saleId,
}) => {
  const [tip, setTipAmount] = useState(0);
  const [totalDue, setTotalDue] = useState<number>(0);
  const [changeDue, setChangeDue] = useState<number>(0);
  const { data: session }: { data: CustomSession } = useSession();

  useEffect(() => {
    const fetchDetails = async () => {
      if (session?.access && saleId) {
        try {
          const saleDetail = await fetchSaleDetail(
            session.access,
            saleId.toString(),
          );
          setTotalDue(parseFloat(saleDetail.total_amount.toString()));
        } catch (error) {
          console.error("Failed to fetch sale details:", error);
          message.error(
            "Nepodařilo se načíst podrobnosti o prodeji. Zkuste to prosím znovu.",
          );
        }
      }
    };

    if (visible) {
      fetchDetails();
    }
  }, [visible, saleId, session?.access]);

  useEffect(() => {
    const newChangeDue = received - totalDue;
    setChangeDue(newChangeDue >= 0 ? newChangeDue : 0);
  }, [received, totalDue]);

  const handleTipChange = (value: number | null) => {
    const numericValue = value ?? 0;
    setTipAmount(numericValue);
  };

  const handleTipSubmit = async () => {
    if (!session?.access) {
      message.error("Chyba: Uživatel není autentizován");
      return;
    }
    try {
      await setTip(session.access, saleId, tip);
      message.success("Spropitné úspěšně přidáno");
      onCancel(); // Close the modal after setting the tip
    } catch (error) {
      console.error("Nepodařilo se nastavit spropitné:", error);
      message.error(
        "Nepodařilo se nastavit spropitné. Zkuste to prosím znovu.",
      );
    } finally {
      setTipAmount(0); // Reset the tip amount
    }
  };

  useEffect(() => {
    if (!visible) {
      setTipAmount(0); // Reset the tip amount when the modal is closed
    }
  }, [visible]);

  return (
    <Modal
      title="Shrnutí Platby"
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel} autoFocus>
          Hotovo
        </Button>,
        <Button key="submit" type="primary" onClick={handleTipSubmit}>
          Odeslat spropitné
        </Button>,
      ]}
    >
      <Row gutter={16}>
        <Col span={12}>
          <Text>Celková částka:</Text>
        </Col>
        <Col span={12}>
          <Title level={4}>{totalDue.toFixed(2)}</Title>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Text>Přijato:</Text>
        </Col>
        <Col span={12}>
          <Title level={4}>{received.toFixed(2)}</Title>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Text>Vráceno:</Text>
        </Col>
        <Col span={12}>
          <Title level={4}>{changeDue.toFixed(2)}</Title>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Text>Spropitné:</Text>
        </Col>
        <Col span={12}>
          <InputNumber
            min={0}
            value={tip}
            onChange={handleTipChange}
            style={{ width: "100%" }}
          />
        </Col>
      </Row>
    </Modal>
  );
};

export default PaymentSummaryModal;
