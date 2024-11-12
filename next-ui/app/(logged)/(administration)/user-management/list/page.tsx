"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Button,
  Card,
  message,
  Table,
  Switch,
  TableProps,
  Row,
  Col,
} from "antd";
import { useSession } from "next-auth/react";
import { CustomSession, CustomUser } from "@/app/types/api";
import { getUsers } from "@/app/api/users/getUsers";
import { toggleUserActive } from "@/app/api/users/toggleUserActive";
import { showMessage } from "@/app/lib/showMessage";
import { EditUserModal } from "@/app/components/modals/users/EditUserModal";
import { Typography } from "antd";

const { Title } = Typography;

const Page = () => {
  const { data: session }: { data: CustomSession } = useSession();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editedRecord, setEditedRecord] = useState<CustomUser>();
  const [userData, setUserData] = useState<CustomUser[]>([]);
  const [filteredUserData, setFilteredUserData] = useState<CustomUser[]>([]);
  const [messageApi, contextHolder] = message.useMessage();
  const [isActiveLoading, setIsActiveLoading] = useState(false);
  const [hideInactive, setHideInactive] = useState(false);

  const fetchUsers = useCallback(async () => {
    if (!session?.access) {
      return;
    }
    try {
      if (!session?.access) {
        return;
      }
      const users = await getUsers(session?.access);
      setUserData(users);
      setFilteredUserData(users);
    } catch (error) {
      showMessage("error", "Nepodařilo se načíst uživatele", messageApi);
      console.error("Error fetching users:", error);
    }
  }, [session?.access, messageApi]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (hideInactive) {
      setFilteredUserData(userData.filter((user) => user.is_active));
    } else {
      setFilteredUserData(userData);
    }
  }, [userData, hideInactive]);

  const handleEdit = (record: CustomUser) => {
    setEditedRecord(record);
    setIsModalVisible(true);
  };

  const handleToggleActive = async (user: CustomUser) => {
    if (user.id === session?.user?.id) {
      showMessage(
        "error",
        "Nemůžete deaktivovat svůj vlastní účet",
        messageApi,
      );
      return;
    }
    setIsActiveLoading(true);
    try {
      if (!session?.access) {
        return;
      }
      const updatedUser = await toggleUserActive(session?.access, user.id);
      setUserData((prevData: CustomUser[]) =>
        prevData.map((u: CustomUser) =>
          u.id === updatedUser.id ? updatedUser : u,
        ),
      );
      showMessage(
        "success",
        `Uživatel ${updatedUser.is_active ? "aktivován" : "deaktivován"}`,
        messageApi,
      );
    } catch (error) {
      console.error("Error toggling user active status:", error);
      showMessage("error", "Nepodařilo se změnit status uživatele", messageApi);
    }
    setIsActiveLoading(false);
  };

  const handleHideInactiveToggle = (checked: boolean) => {
    setHideInactive(checked);
  };

  const columns: TableProps<CustomUser>["columns"] = [
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "Křestní jméno",
      dataIndex: "first_name",
      key: "firstName",
    },
    {
      title: "Příjmení",
      dataIndex: "last_name",
      key: "lastName",
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
    },
    {
      title: "Aktivní",
      dataIndex: "is_active",
      key: "isActive",
      render: (isActive: boolean, record: CustomUser) => (
        <Switch
          checked={isActive}
          onChange={() => handleToggleActive(record)}
          checkedChildren="Aktivní"
          unCheckedChildren="Neaktivní"
          loading={isActiveLoading}
          disabled={record.id === session?.user?.id}
        />
      ),
    },
    {
      title: "Akce",
      render: (_, record) => (
        <Button type="primary" onClick={() => handleEdit(record)}>
          Upravit
        </Button>
      ),
    },
  ];

  return (
    <>
      {contextHolder}

      <Card style={{ margin: "20px" }}>
        <Row
          justify="space-between"
          align="middle"
          style={{ marginBottom: 16 }}
        >
          <Col>
            <Title level={3}>Uživatelé</Title>
          </Col>
          <Col>
            <Switch
              checked={hideInactive}
              onChange={handleHideInactiveToggle}
              unCheckedChildren="Skrýt neaktivní"
              checkedChildren="Zobrazit všechny"
            />
          </Col>
        </Row>
        <Table
          columns={columns}
          dataSource={filteredUserData.sort((a: CustomUser, b: CustomUser) => {
            return a.id - b.id;
          })}
        />
        <EditUserModal
          visible={isModalVisible}
          editedUser={editedRecord}
          setIsModalVisible={setIsModalVisible}
          messageApi={messageApi}
          onUserUpdate={fetchUsers}
        />
      </Card>
    </>
  );
};

export default Page;
