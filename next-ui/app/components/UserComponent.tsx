"use client";
import { Avatar, Flex, Typography } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useSession } from "next-auth/react";
import { CustomSession } from "@/app/types/api";

const { Text } = Typography;

type UserComponentProps = {
  onClick: () => void;
};

export const roleMapping = {
  AD: "Admin",
  MA: "Manažer",
  CA: "Pokladní",
};

export function UserComponent({ onClick }: UserComponentProps) {
  const { data: session }: { data: CustomSession } = useSession();
  return (
    <>
      <Flex
        style={{ marginRight: "20px", cursor: "pointer" }}
        gap={"small"}
        onClick={onClick}
      >
        <Avatar size={40} icon={<UserOutlined />} />
        <Flex vertical={true}>
          <Text>{session?.user?.name}</Text>
          <Text type={"secondary"}>
            {session?.user?.role
              ? roleMapping[session.user.role as keyof typeof roleMapping]
              : "Neznámá role"}
          </Text>
        </Flex>
      </Flex>
    </>
  );
}
