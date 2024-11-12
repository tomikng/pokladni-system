"use client";

import {
  Popconfirm,
  Table,
  Input,
  Button,
  Space,
  Card,
  message,
  Typography,
  Divider,
  Select,
  Col,
  Row,
  Tooltip,
} from "antd";
import { useState, useEffect } from "react";
import { fetchSuppliers } from "@/app/api/suppliers/fetchSuppliers";
import { ApiTypes, CustomSession } from "@/app/types/api";
import { useSession } from "next-auth/react";
import AddSupplierModal from "@/app/components/modals/suppliers/AddSupplierModal";
import { createSupplier } from "@/app/api/suppliers/createSupplier";
import { deleteSupplierById } from "@/app/api/suppliers/deleteSupplierById";
import { useRouter } from "next/navigation";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { TablePaginationConfig } from "antd/lib/table";

const { Column } = Table;
const { Title } = Typography;

const Page = () => {
  const [suppliers, setSuppliers] = useState<ApiTypes.Supplier[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchField, setSearchField] = useState<string>("name");
  const [searchText, setSearchText] = useState<string>("");
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [updateCount, setUpdateCount] = useState<number>(0); // State to control updates, on update refetch suppliers
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10); // Default page size
  const [total, setTotal] = useState<number>(0); // Total count of suppliers

  const { data: session }: { data: CustomSession } = useSession();
  const router = useRouter();

  const fetchData = async () => {
    if (!session?.access) return;
    setLoading(true);
    try {
      const data = await fetchSuppliers(
        searchField,
        searchText,
        currentPage,
        pageSize,
        session?.access,
      );
      setSuppliers(data.results);
      setTotal(data.count);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [
    searchField,
    searchText,
    currentPage,
    pageSize,
    session?.access,
    updateCount,
  ]);

  const handleSearch = (field: string, value: string) => {
    setSearchField(field);
    setSearchText(value);
    setCurrentPage(1); // Reset to first page on search
  };

  const handleAddSupplier = () => {
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
  };

  const handleModalSubmit = async (values: ApiTypes.Supplier) => {
    console.log("Add Supplier:", values);
    if (session?.access) {
      await createSupplier(session?.access, values);
      message.success("Dodavatel byl úspěšně přidán.");
      setIsModalVisible(false);
      setUpdateCount((count) => count + 1);
    }
  };

  const handleDetail = (id: number) => {
    router.push(`/importers/${id}`);
  };

  const handleDelete = async (id: number) => {
    if (session?.access) {
      await deleteSupplierById(session?.access, id);
      message.success("Dodavatel byl úspěšně smazán.");
      setUpdateCount((count) => count + 1);
    }
  };

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setCurrentPage(pagination.current || 1);
    setPageSize(pagination.pageSize || 10);
  };

  return (
    <Card style={{ margin: "24px" }}>
      <Title level={1}>Dodavatelé</Title>
      <Divider />
      <Row gutter={[16, 16]} justify="space-between" align="middle">
        <Col flex="auto">
          <Input.Search
            prefix={<SearchOutlined />}
            placeholder="Hledat dodavatele"
            onSearch={(value) => handleSearch(searchField, value)}
          />
        </Col>
        <Col>
          <Select
            defaultValue={searchField}
            onChange={(value: string) => setSearchField(value)}
            style={{ width: 180 }}
          >
            <Select.Option value="name">Název</Select.Option>
            <Select.Option value="address">Sídlo</Select.Option>
            <Select.Option value="phone_number">Telefonní číslo</Select.Option>
            <Select.Option value="email">Email</Select.Option>
            <Select.Option value="ico">ICO</Select.Option>
            <Select.Option value="dic">DIC</Select.Option>
          </Select>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddSupplier}
          >
            Přidat dodavatele
          </Button>
        </Col>
      </Row>
      <Table
        dataSource={suppliers}
        loading={loading}
        rowKey="id"
        locale={{ emptyText: "Žádní dodavatelé" }}
        style={{ marginTop: "24px" }}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: total,
          showSizeChanger: true,
        }}
        onChange={handleTableChange}
      >
        <Column title="Název" dataIndex="name" key="name" />
        <Column title="Sídlo" dataIndex="address" key="address" />
        <Column
          title="Telefonní číslo"
          dataIndex="phone_number"
          key="phone_number"
        />
        <Column title="Email" dataIndex="email" key="email" />
        <Column title="ICO" dataIndex="ico" key="ico" />
        <Column title="DIC" dataIndex="dic" key="dic" />
        <Column
          title="Akce"
          key="action"
          render={(_, record: ApiTypes.Supplier) => (
            <Space size="middle">
              <Tooltip title="Upravit">
                <Button
                  icon={<EditOutlined />}
                  onClick={() => handleDetail(record.id)}
                />
              </Tooltip>
              <Popconfirm
                title="Jste si jisti, že chcete smazat tohoto dodavatele?"
                onConfirm={() => handleDelete(record.id)}
              >
                <Tooltip title="Smazat">
                  <Button danger icon={<DeleteOutlined />} />
                </Tooltip>
              </Popconfirm>
            </Space>
          )}
        />
      </Table>
      <AddSupplierModal
        visible={isModalVisible}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
      />
    </Card>
  );
};

export default Page;
