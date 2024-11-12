import React from "react";
import { Card, Row, Col } from "antd";
import { FolderOpenOutlined } from "@ant-design/icons";
import { ApiTypes } from "@/app/types/api";

interface ChildCategoriesCardProps {
  categories: ApiTypes.Category[];
  selectedCategory: number | undefined;
  onCategorySelect: (selectedKeys: React.Key[], info: any) => void;
}

const ChildCategoriesCard: React.FC<ChildCategoriesCardProps> = ({
  categories,
  selectedCategory,
  onCategorySelect,
}) => {
  if (selectedCategory) {
    const category = categories.find((cat) => cat.id === selectedCategory);
    if (category && category.children && category.children.length > 0) {
      return (
        <Card style={{ marginBottom: 16 }}>
          <h3 style={{ marginBottom: 16 }}>
            <FolderOpenOutlined style={{ marginRight: 8 }} />
            Podkategorie
          </h3>
          <div style={{ maxHeight: 300, overflow: "auto" }}>
            <Row gutter={[16, 16]}>
              {category.children.map((child) => (
                <Col key={child.id} span={8}>
                  <Card
                    hoverable
                    onClick={() =>
                      onCategorySelect([child.id.toString()], null)
                    }
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: 100,
                      borderRadius: 8,
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                      transition: "transform 0.3s",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      <FolderOpenOutlined
                        style={{ fontSize: 32, marginBottom: 8 }}
                      />
                      <span style={{ fontSize: 16, fontWeight: 500 }}>
                        {child.name}
                      </span>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        </Card>
      );
    }
  }
  return null;
};

export default ChildCategoriesCard;
