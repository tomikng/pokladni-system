"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Form,
  Input,
  Button,
  Table,
  Typography,
  Row,
  Col,
  Divider,
  message,
  Card,
  Switch,
  Modal,
} from "antd";
import { useSession } from "next-auth/react";
import { ApiTypes, CustomSession } from "@/app/types/api";
import { fetchDailySummaries } from "@/app/api/daily-summary/fetchDailySummaries";
import { fetchEuroRate } from "@/app/api/settings/fetchEuroRate";
import { calculateDailySummary } from "@/app/api/daily-summary/calculateDailySummary";
import { createWithdrawal } from "@/app/api/withdrawal/createWithdrawal";

const { Title } = Typography;

const denominations = {
  czk: [5000, 2000, 1000, 500, 200, 100, 50, 20, 10, 5, 2, 1],
  euro: [500, 200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1],
};

const DailySummary = () => {
  const { data: session }: { data: CustomSession } = useSession();
  const [form] = Form.useForm();
  const [withdrawalForm] = Form.useForm();
  const [summaries, setSummaries] = useState<ApiTypes.DailySummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [euroRate, setEuroRate] = useState<number>(25);
  const [showEuro, setShowEuro] = useState(false);
  const [isWithdrawalModalVisible, setIsWithdrawalModalVisible] =
    useState(false);

  const fetchSummaries = useCallback(async () => {
    if (!session?.access) return;
    setLoading(true);
    try {
      const data = await fetchDailySummaries(session.access);
      setSummaries(data);
    } catch (error) {
      console.error("Nepodařilo se načíst denní souhrny", error);
      message.error("Nepodařilo se načíst denní souhrny");
    } finally {
      setLoading(false);
    }
  }, [session?.access]);

  const fetchRate = useCallback(async () => {
    if (!session?.access) return;
    try {
      const rate = await fetchEuroRate(session.access);
      setEuroRate(rate);
    } catch (error) {
      console.error("Nepodařilo se načíst kurz eura", error);
      message.error("Nepodařilo se načíst kurz eura");
    }
  }, [session?.access]);

  useEffect(() => {
    if (!session?.user) return;
    if (session?.user.role !== "CA") {
      fetchSummaries();
    }
    fetchRate();
  }, [session, fetchSummaries, fetchRate]);

  const handleCalculate = async (values: { [key: string]: number }) => {
    const totalCzk = denominations.czk.reduce((total, denomination) => {
      return total + denomination * (values[`czk_${denomination}`] || 0);
    }, 0);

    const totalEuro = denominations.euro.reduce((total, denomination) => {
      return total + denomination * (values[`euro_${denomination}`] || 0);
    }, 0);

    const totalCash = totalCzk + totalEuro * euroRate;

    try {
      if (!session?.access) return;
      await calculateDailySummary(session?.access, { actual_cash: totalCash });
      message.success("Denní souhrn byl úspěšně vypočítán");
      form.resetFields();
      fetchSummaries();
    } catch (error) {
      message.error("Nepodařilo se vypočítat denní souhrn");
    }
  };

  const handleAddWithdrawal = async (values: ApiTypes.CreateWithdrawal) => {
    try {
      if (!session?.access || !session?.user?.id) return;
      const withdrawalData = {
        ...values,
        cashier: session.user.id,
      };
      await createWithdrawal(session.access, withdrawalData);
      message.success("Výběr byl úspěšně přidán");
      withdrawalForm.resetFields();
      setIsWithdrawalModalVisible(false);
      fetchSummaries();
    } catch (error) {
      message.error("Nepodařilo se přidat výběr");
    }
  };

  const columns = [
    { title: "Datum", dataIndex: "date", key: "date" },
    { title: "Celkové tržby", dataIndex: "total_sales", key: "total_sales" },
    { title: "Hotovost", dataIndex: "total_cash", key: "total_cash" },
    { title: "Karta", dataIndex: "total_card", key: "total_card" },
    { title: "Spropitné", dataIndex: "total_tips", key: "total_tips" },
    {
      title: "Rozdíl hotovosti",
      dataIndex: "cash_difference",
      key: "cash_difference",
    },
    {
      title: "Konečná hotovost",
      dataIndex: "closing_cash",
      key: "closing_cash",
    },
    {
      title: "Výběry",
      dataIndex: "total_withdrawals",
      key: "total_withdrawals",
    },
  ];

  return (
    <Card>
      <Title level={3}>Denní souhrn</Title>
      <Card>
        <Form form={form} onFinish={handleCalculate}>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="Zahrnout Euro">
                <Switch checked={showEuro} onChange={setShowEuro} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={showEuro ? 12 : 24}>
              <Card title="České koruny">
                {denominations.czk.map((denomination) => (
                  <Form.Item
                    key={`czk_${denomination}`}
                    label={`${denomination} Kč`}
                    name={`czk_${denomination}`}
                  >
                    <Input type="number" min={0} />
                  </Form.Item>
                ))}
              </Card>
            </Col>
            {showEuro && (
              <Col span={12}>
                <Card title="Euro">
                  {denominations.euro.map((denomination) => (
                    <Form.Item
                      key={`euro_${denomination}`}
                      label={`${denomination} €`}
                      name={`euro_${denomination}`}
                    >
                      <Input type="number" min={0} />
                    </Form.Item>
                  ))}
                  <Form.Item label="Kurz Euro na CZK" initialValue={euroRate}>
                    <Input type="number" value={euroRate} disabled />
                  </Form.Item>
                </Card>
              </Col>
            )}
          </Row>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Vypočítat
            </Button>
            <Button
              style={{ marginLeft: "10px" }}
              onClick={() => setIsWithdrawalModalVisible(true)}
            >
              Přidat výběr
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {session?.user && session?.user.role !== "CA" && (
        <>
          <Divider />
          <Table
            columns={columns}
            dataSource={summaries}
            loading={loading}
            rowKey="date"
          />
        </>
      )}

      <Modal
        title="Přidat výběr"
        open={isWithdrawalModalVisible}
        onCancel={() => setIsWithdrawalModalVisible(false)}
        footer={null}
      >
        <Form form={withdrawalForm} onFinish={handleAddWithdrawal}>
          <Form.Item
            name="amount"
            label="Částka"
            rules={[
              {
                required: true,
                message: "Prosím zadejte částku výběru!",
              },
            ]}
          >
            <Input type="number" min={0} />
          </Form.Item>
          <Form.Item name="note" label="Poznámka">
            <Input.TextArea />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Přidat výběr
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default DailySummary;
