import React, { useState } from "react";
import {
  Button,
  DatePicker,
  Flex,
  Select,
  Space,
  Switch,
  Table,
  Typography,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { ColumnsType } from "antd/es/table";

const { RangePicker } = DatePicker;
const { Option } = Select;

const { Text } = Typography;

type CustomTableProp<T> = {
  title: string;
  dataSource: T[];
  columns: ColumnsType<T>;
};

const CustomTable = <T extends unknown>({
  title,
  dataSource,
  columns,
}: CustomTableProp<T>) => {
  const [pageSize, setPageSize] = useState(10);
  const [isRange, setIsRange] = useState(false);

  const handlePageSizeChange = (value: number) => {
    setPageSize(value);
  };

  const toggleDateRange = (checked: boolean) => {
    setIsRange(checked);
  };

  return (
    <>
      <Flex
        justify={"space-between"}
        style={{ background: "white", padding: "20px" }}
      >
        <Flex vertical={true}>
          <h2>{title}</h2>
          <Flex gap={"small"} align={"center"}>
            <Text type={"secondary"}>Zobrazit po</Text>
            <Select defaultValue={10} onChange={handlePageSizeChange}>
              <Option value={10}>10</Option>
              <Option value={20}>20</Option>
              <Option value={30}>30</Option>
              <Option value={50}>50</Option>
            </Select>
            <Text type={"secondary"}>záznamech</Text>
          </Flex>
        </Flex>
        <Space>
          <Flex vertical={true} gap={"small"} align={"flex-end"}>
            <Switch
              checkedChildren="Rozsah"
              unCheckedChildren="Datum"
              onChange={toggleDateRange}
              style={{ width: "fit-content" }}
            />

            {isRange ? <RangePicker /> : <DatePicker />}
          </Flex>

          <Button type="primary" icon={<SearchOutlined />}>
            Hledat
          </Button>
        </Space>
      </Flex>

      <Table
        dataSource={dataSource as any}
        columns={columns as any}
        pagination={{ pageSize: pageSize }}
        scroll={{ y: "100%" }}
      />
    </>
  );
};

export default CustomTable;
