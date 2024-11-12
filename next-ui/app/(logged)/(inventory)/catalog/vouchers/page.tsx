"use client";

import React, { useState, useEffect } from "react";
import { Table, Button, Card, Space, Typography, message } from "antd";
import { useSession } from "next-auth/react";
import { ApiTypes, CustomSession } from "@/app/types/api";
import { getVouchers } from "@/app/api/vouchers/getVouchers";
import { createVoucher } from "@/app/api/vouchers/createVoucher";
import { updateVoucher } from "@/app/api/vouchers/updateVoucher";
import { deleteVoucher } from "@/app/api/vouchers/deleteVoucher";
import moment from "moment";
import Voucher = ApiTypes.Voucher;
import VoucherModal from "@/app/components/modals/voucher/VoucherModal";

const { Title } = Typography;

const VoucherManagement: React.FC = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [editingVoucherId, setEditingVoucherId] = useState<number | null>(null);
  const [initialValues, setInitialValues] = useState<Voucher>();
  const { data: session } = useSession() as { data: CustomSession | null };
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.access) {
      fetchVouchers();
    }
  }, [session?.access]);

  const fetchVouchers = async (
    page = pagination.current,
    pageSize = pagination.pageSize,
  ) => {
    if (!session?.access) return;
    setLoading(true);
    try {
      const data = await getVouchers("", "", page, pageSize, session.access);
      setVouchers(data.results);
      setPagination({
        ...pagination,
        current: page,
        pageSize: pageSize,
        total: data.count,
      });
    } catch (error) {
      message.error("Chyba při načítání voucherů");
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (pagination: any) => {
    fetchVouchers(pagination.current, pagination.pageSize);
  };

  const showModal = (voucher: Voucher | null = null) => {
    if (voucher) {
      setEditingVoucherId(voucher.id);
      setInitialValues(voucher);
    } else {
      setEditingVoucherId(null);
      setInitialValues(undefined);
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleSubmit = async (values: Voucher) => {
    if (!session?.access) return;
    try {
      const formattedValues = {
        ...values,
        expiration_date: values.expiration_date,
      };

      if (editingVoucherId) {
        await updateVoucher(session.access, editingVoucherId, formattedValues);
        message.success("Voucher byl úspěšně aktualizován");
      } else {
        await createVoucher(session.access, formattedValues);
        message.success("Voucher byl úspěšně vytvořen");
      }
      setIsModalVisible(false);
      fetchVouchers();
    } catch (error) {
      message.error("Chyba při ukládání voucheru");
    }
  };

  const handleDelete = async (id: number) => {
    if (!session?.access) return;
    try {
      await deleteVoucher(session.access, id);
      message.success("Voucher byl úspěšně smazán");
      fetchVouchers();
    } catch (error) {
      message.error("Chyba při mazání voucheru");
    }
  };

  const columns = [
    { title: "EAN kód", dataIndex: "ean_code", key: "ean_code" },
    { title: "Název", dataIndex: "title", key: "title" },
    {
      title: "Platnost do",
      dataIndex: "expiration_date",
      key: "expiration_date",
      render: (date: string) => moment(date).format("DD.MM.YYYY HH:mm"),
    },
    {
      title: "Typ slevy",
      dataIndex: "discount_type",
      key: "discount_type",
      render: (type: string) =>
        type === "Percentage" ? "Procenta" : "Fixní částka",
    },
    {
      title: "Hodnota slevy",
      dataIndex: "discount_amount",
      key: "discount_amount",
      render: (amount: number, record: Voucher) =>
        record.discount_type === "Percentage" ? `${amount}%` : `${amount} Kč`,
    },
    {
      title: "Aktivní",
      dataIndex: "is_active",
      key: "is_active",
      render: (isActive: boolean) => (isActive ? "Ano" : "Ne"),
    },
    {
      title: "Akce",
      key: "action",
      render: (_: any, record: Voucher) => (
        <Space>
          <Button onClick={() => showModal(record)}>Upravit</Button>
          <Button onClick={() => handleDelete(record.id)} danger>
            Smazat
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={<Title level={1}>Slevové poukazy</Title>}
      extra={
        <Button onClick={() => showModal()} type="primary">
          Přidat nový voucher
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={vouchers}
        rowKey="id"
        pagination={pagination}
        loading={loading}
        onChange={handleTableChange}
        locale={{ emptyText: "Žádné slevové poukazy" }}
      />
      <VoucherModal
        visible={isModalVisible}
        onCancel={handleCancel}
        onSubmit={handleSubmit}
        initialValues={initialValues}
        editingVoucherId={editingVoucherId}
      />
    </Card>
  );
};

export default VoucherManagement;
