"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Card,
  Col,
  Row,
  Statistic,
  Spin,
  Table,
  Select,
  DatePicker,
  Divider,
  Typography,
  Button,
} from "antd";
import {
  LineChart,
  Line,
  XAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ApiTypes, CustomSession } from "@/app/types/api";
import { fetchSaleStatistics } from "@/app/api/stats/fetchSaleStatistics";
import moment from "moment";
import { useSession } from "next-auth/react";
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title } = Typography;

type DailyData = {
  date: string;
  total: number;
};

const StatisticsPage: React.FC = () => {
  const [statistics, setStatistics] = useState<ApiTypes.SaleStatistics | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [period, setPeriod] = useState<string>("monthly");
  const [, setInterval] = useState<string>("weekly");
  const [customDates, setCustomDates] = useState<
    [moment.Moment, moment.Moment] | null
  >(null);
  const { data: session }: { data: CustomSession } = useSession();

  const getStatistics = useCallback(
    async (
      selectedPeriod: string,
      selectedInterval: string,
      dates?: [moment.Moment, moment.Moment],
    ) => {
      try {
        if (!session?.access) {
          return null;
        }
        let data: ApiTypes.SaleStatistics;
        if (dates) {
          const [start, end] = dates;
          data = await fetchSaleStatistics(
            session.access,
            "custom",
            start.format("YYYY-MM-DD"),
            end.format("YYYY-MM-DD"),
          );
        } else {
          data = await fetchSaleStatistics(
            session.access,
            selectedPeriod,
            selectedInterval,
          );
        }
        return data;
      } catch (error) {
        console.error("Failed to fetch statistics", error);
        return null;
      }
    },
    [session?.access],
  );

  const fetchData = useCallback(
    async (
      selectedPeriod: string,
      selectedInterval: string,
      customDates?: [moment.Moment, moment.Moment],
    ) => {
      setLoading(true);
      const periodData = await getStatistics(
        selectedPeriod,
        selectedInterval,
        customDates,
      );
      if (periodData) {
        if (selectedPeriod === "daily") {
          // For daily data, use the interval data directly
          setStatistics({
            ...periodData,
            customRangeData: periodData.interval_data,
          });
        } else {
          const start = moment(periodData.start_date);
          const end = moment(periodData.end_date);
          const customRangeData = await getStatistics("custom", "daily", [
            start,
            end,
          ]);
          setStatistics({
            ...periodData,
            customRangeData: customRangeData?.interval_data || [],
          });
        }
      }
      setLoading(false);
    },
    [getStatistics],
  );

  useEffect(() => {
    let selectedInterval: string;
    switch (period) {
      case "daily":
        selectedInterval = "hourly";
        break;
      case "weekly":
        selectedInterval = "daily";
        break;
      case "monthly":
        selectedInterval = "weekly";
        break;
      case "yearly":
        selectedInterval = "monthly";
        break;
      default:
        selectedInterval = "daily";
    }
    setInterval(selectedInterval);

    fetchData(period, selectedInterval);
  }, [session?.access, period, fetchData]);

  const handlePeriodChange = (value: string) => {
    setPeriod(value);
    setCustomDates(null);
  };

  const handleDateChange = (dates: [moment.Moment, moment.Moment] | null) => {
    setCustomDates(dates);
  };

  const handleApplyCustomDates = async () => {
    if (customDates) {
      await fetchData("custom", "daily", customDates);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" tip="Načítání statistik..." />
      </div>
    );
  }

  const processChartData = (
    intervalData: ApiTypes.IntervalData[],
  ): DailyData[] => {
    return intervalData.map((item) => ({
      date:
        period === "daily"
          ? item.interval_range.split(" - ")[0].split(" ")[1] // This will get only the hour part
          : item.interval_range.split(" - ")[0],
      total: item.tax_rate_data.reduce(
        (sum, taxData) => sum + taxData.total_sales,
        0,
      ),
    }));
  };

  const chartData = processChartData(statistics?.customRangeData || []);

  const columns = [
    {
      title: "DPH",
      dataIndex: "product__tax_rate",
      key: "product__tax_rate",
      render: (value: number) => `${(value * 100).toFixed(0)}%`,
    },
    {
      title: "Počet transakcí",
      dataIndex: "transaction_count",
      key: "transaction_count",
    },
    {
      title: "Tržba s DPH",
      dataIndex: "total_sales",
      key: "total_sales",
      render: (value: number) => `${value.toLocaleString()} Kč`,
    },
    {
      title: "DPH",
      dataIndex: "vat_amount",
      key: "vat_amount",
      render: (value: number) => `${value.toLocaleString()} Kč`,
    },
  ];

  const compareValues = (current: number, previous: number) => {
    if (current > previous) {
      return {
        color: "green",
        icon: <ArrowUpOutlined />,
      };
    } else if (current < previous) {
      return {
        color: "red",
        icon: <ArrowDownOutlined />,
      };
    } else {
      return {
        color: "gray",
        icon: "-",
      };
    }
  };

  return (
    <Card style={{ padding: "24px" }}>
      <Row gutter={[16, 16]} style={{ marginBottom: "16px" }}>
        <Col xs={24} md={12}>
          <Select
            value={period}
            onChange={handlePeriodChange}
            style={{ width: "100%" }}
          >
            <Option value="daily">Denní</Option>
            <Option value="weekly">Týdenní</Option>
            <Option value="monthly">Měsíční</Option>
            <Option value="yearly">Roční</Option>
            <Option value="custom">Vlastní</Option>
          </Select>
        </Col>
        {period === "custom" && (
          <>
            <Col xs={24} md={9}>
              <RangePicker
                value={customDates as any}
                onChange={handleDateChange as any}
                style={{ width: "100%" }}
              />
            </Col>
            <Col xs={24} md={3}>
              <Button
                onClick={handleApplyCustomDates}
                style={{ width: "100%" }}
              >
                Použít
              </Button>
            </Col>
          </>
        )}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tržby celkem"
              value={statistics?.total_sales}
              precision={2}
              valueStyle={{
                color: compareValues(
                  statistics?.total_sales || 0,
                  statistics?.prev_total_sales || 0,
                ).color,
              }}
              prefix="Kč"
              suffix={
                compareValues(
                  statistics?.total_sales || 0,
                  statistics?.prev_total_sales || 0,
                ).icon
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Počet transakcí"
              value={statistics?.transaction_count}
              valueStyle={{
                color: compareValues(
                  statistics?.transaction_count || 0,
                  statistics?.prev_transaction_count || 0,
                ).color,
              }}
              suffix={
                compareValues(
                  statistics?.transaction_count || 0,
                  statistics?.prev_transaction_count || 0,
                ).icon
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Průměrná hodnota transakce"
              value={statistics?.average_transaction_value || 0}
              precision={2}
              valueStyle={{
                color: compareValues(
                  statistics?.average_transaction_value || 0,
                  statistics?.prev_average_transaction_value || 0,
                ).color,
              }}
              prefix="Kč"
              suffix={
                compareValues(
                  statistics?.average_transaction_value || 0,
                  statistics?.prev_average_transaction_value || 0,
                ).icon
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tržby bez DPH"
              value={statistics?.total_sales_without_vat || 0}
              precision={2}
              valueStyle={{
                color: compareValues(
                  statistics?.total_sales_without_vat || 0,
                  statistics?.prev_total_sales_without_vat || 0,
                ).color,
              }}
              prefix="Kč"
              suffix={
                compareValues(
                  statistics?.total_sales_without_vat || 0,
                  statistics?.prev_total_sales_without_vat || 0,
                ).icon
              }
            />
          </Card>
        </Col>
      </Row>

      <Divider />

      <Card>
        <Title level={4}>Prodeje v čase</Title>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(tick) =>
                period === "daily" ? tick : moment(tick).format("DD.MM")
              }
            />
            <Tooltip
              labelFormatter={(label) =>
                period === "daily"
                  ? `${statistics?.start_date} ${label}`
                  : moment(label).format("DD.MM.YYYY")
              }
              formatter={(value: number) => [
                `${value.toLocaleString()} Kč`,
                "Tržby",
              ]}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="total"
              name="Tržby"
              stroke="#8884d8"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Divider />

      <Title level={4}>Detailní přehled prodejů</Title>
      {statistics?.interval_data.map((intervalItem, index) => (
        <Card
          key={index}
          title={`${intervalItem.interval_range}`}
          style={{ marginBottom: "20px" }}
        >
          <Table
            columns={columns}
            dataSource={intervalItem.tax_rate_data.map((taxData, taxIndex) => ({
              key: taxIndex,
              ...taxData,
            }))}
            pagination={false}
          />
        </Card>
      ))}
    </Card>
  );
};

export default StatisticsPage;
