"use client";

import { Card, Col, Divider, Row, Typography } from "antd";
import { useRouter } from "next/navigation";
import { title } from "process";

export interface CardItem {
  title: string;
  icon: React.ReactNode;
  color: string;
  path: string;
}

interface MenuCard {
  items: CardItem[];
  title: string;
}

const { Title, Paragraph } = Typography;

const MenuCard: React.FC<MenuCard> = ({ items, title }) => {
  const router = useRouter();

  const handleCardClick = (path: string) => {
    router.push(path);
  };

  return (
    <Row justify="center" align="middle" style={{ minHeight: "100vh" }}>
      <Col span={24}>
        <Card style={{ margin: "24px", height: "100vh" }}>
          <Title style={{ textAlign: "center", marginBottom: "24px" }}>
            {title}
          </Title>
          <Divider />
          <Row gutter={[16, 16]} style={{ height: "100%" }}>
            {items.map((item, index) => (
              <Col key={index} xs={24} sm={24 / items.length}>
                <Card
                  style={{
                    backgroundColor: item.color,
                    textAlign: "center",
                    cursor: "pointer",
                    height: "100%",
                  }}
                  onClick={() => handleCardClick(item.path)}
                >
                  {item.icon}
                  <Paragraph
                    style={{
                      color: "#fff",
                      marginTop: "24px",
                      fontSize: "24px",
                    }}
                  >
                    {item.title}
                  </Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      </Col>
    </Row>
  );
};

export default MenuCard;
