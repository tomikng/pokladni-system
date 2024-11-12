import { ApiTypes } from "@/app/types/api";
import { Card } from "antd";
import { FolderOutlined, FolderOpenOutlined } from "@ant-design/icons";

export const CategoryCard: React.FC<{
  category: ApiTypes.Category;
  onCategorySelect: (categoryId: number) => void;
}> = ({ category, onCategorySelect }) => {
  return (
    <Card
      hoverable
      onClick={() => onCategorySelect(category.id)}
      style={{ marginBottom: "16px" }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        {category.children && category.children.length > 0 ? (
          <FolderOutlined style={{ fontSize: "24px", marginRight: "8px" }} />
        ) : (
          <FolderOpenOutlined
            style={{ fontSize: "24px", marginRight: "8px" }}
          />
        )}
        <span style={{ fontSize: "16px" }}>{category.name}</span>
      </div>
    </Card>
  );
};
