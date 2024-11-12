import React from "react";
import {
  Card,
  Table,
  Button,
  Input,
  Typography,
  Row,
  Col,
  TablePaginationConfig,
} from "antd";
import { ApiTypes } from "@/app/types/api";
import CategoryTreeSelect from "../../tree/CategoryTreeSelect";
import CategoryBreadcrumb from "../../breadcrumb/CategoryBreadcrumbs";
import { PlusCircleOutlined, MinusCircleOutlined } from "@ant-design/icons";

const { Title } = Typography;

interface ProductSelectionCardProps {
  loading: boolean;
  data: ApiTypes.Product[];
  onSelect: (record: any) => void;
  onCategoryChange: (categoryId: number) => void;
  onSearch: (value: string) => void;
  categories: ApiTypes.Category[];
  selectedCategory: number | undefined;
  searchEan: string;
  selectedProducts: ApiTypes.Product[];
  pagination: TablePaginationConfig;
  onPageChange: (page: number, pageSize: number) => void;
}

const ProductSelectionCard: React.FC<ProductSelectionCardProps> = ({
  loading,
  data,
  onSelect,
  onCategoryChange,
  onSearch,
  categories,
  selectedCategory,
  searchEan,
  selectedProducts,
  pagination,
  onPageChange,
}) => {
  const columns = [
    {
      title: "EAN",
      dataIndex: "ean_code",
      key: "ean_code",
    },
    {
      title: "Název",
      dataIndex: "name",
      key: "name",
      sorter: (a: ApiTypes.Product, b: ApiTypes.Product) =>
        a.name.localeCompare(b.name),
    },
    {
      title: "Skladem",
      dataIndex: "inventory_count",
      key: "inventory_count",
      sorter: (a: ApiTypes.Product, b: ApiTypes.Product) =>
        a.inventory_count - b.inventory_count,
      render: (text: any) => <>{text ?? 0}</>,
    },
    {
      title: "Akce",
      key: "action",
      render: (_: any, record: any) => {
        const isSelected = selectedProducts?.some(
          (product) => product.id === record.id
        );
        return (
          <Button
            onClick={() => onSelect(record)}
            icon={
              isSelected ? (
                <MinusCircleOutlined style={{ color: "red" }} />
              ) : (
                <PlusCircleOutlined style={{ color: "green" }} />
              )
            }
          />
        );
      },
    },
  ];

  return (
    <Card
      style={{ flex: 1, marginRight: "20px", height: "100%" }}
      loading={loading}
    >
      <Row align={"middle"} justify={"space-between"}>
        <Col span={12}>
          <Title level={3}> Výběr produktu </Title>
          <CategoryBreadcrumb
            categories={categories}
            selectedCategory={selectedCategory}
            onBreadcrumbClick={onCategoryChange}
          />
        </Col>
        <Col span={12}>
          <Row>
            <Col>
              <Input.Search
                placeholder="Hledat podle EAN kódu"
                onSearch={onSearch}
                defaultValue={searchEan}
                style={{ marginLeft: 16 }}
              />
            </Col>
          </Row>
        </Col>
      </Row>

      <CategoryTreeSelect
        onSelect={(_, id) => onCategoryChange(id)}
        selectedCategory={selectedCategory}
      />

      <Table
        columns={columns}
        dataSource={data}
        pagination={pagination}
        onChange={(newPagination) => {
          onPageChange(newPagination.current!, newPagination.pageSize!);
        }}
        locale={{
          emptyText: "Žádné položky",
          sortTitle: "Seřadit",
          cancelSort: "Zrušit řazení",
          filterReset: "Obnovit",
          triggerDesc: "Kliknutím seřadit sestupně",
          triggerAsc: "Kliknutím seřadit vzestupně",
        }}
      />
    </Card>
  );
};

export default ProductSelectionCard;
