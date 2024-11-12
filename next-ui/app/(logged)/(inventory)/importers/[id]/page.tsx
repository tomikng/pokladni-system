"use client";

import React, { useState, useEffect } from "react";
import { Form, Card, message, Typography, Divider } from "antd";
import { useRouter } from "next/navigation";
import api from "@/api";
import { getSupplierById } from "@/app/api/suppliers/getSupplierById";
import { useSession } from "next-auth/react";
import { ApiTypes, CustomSession } from "@/app/types/api";
import SupplierForm from "@/app/components/forms/suppliers/SupplierForm";
import { putSupplierById } from "@/app/api/suppliers/putSupplierById";

const { Title } = Typography;

const Page = ({ params }: { params: { id: string } }) => {
  const [form] = Form.useForm();
  const router = useRouter();
  const id = parseInt(params.id);
  const [loading, setLoading] = useState(false);
  const { data: session }: { data: CustomSession } = useSession();

  useEffect(() => {
    const fetchSupplierDetails = async () => {
      if (!id) return;
      setLoading(true);
      try {
        if (!session?.access) return;
        const data = await getSupplierById(session?.access, id);
        form.setFieldsValue(data);
      } catch (error) {
        message.error("Failed to fetch supplier details.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchSupplierDetails();
  }, [form, id, session?.access]);

  const handleFormSubmit = async (values: ApiTypes.Supplier) => {
    setLoading(true);
    try {
      if (!session?.access) return;
      await putSupplierById(session?.access, id, values);
      message.success("Supplier updated successfully!");
      router.push("/importers/list/");
    } catch (error) {
      message.error("Failed to update supplier.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card loading={loading} style={{ margin: "24px" }}>
      <Title level={2}>Detail dodavatele</Title>
      <Divider />
      <SupplierForm form={form} onFinish={handleFormSubmit} />
    </Card>
  );
};

export default Page;
