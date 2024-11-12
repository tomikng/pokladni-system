"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Typography,
  Skeleton,
  Button,
  Space,
  Form,
  Input,
  DatePicker,
  Upload,
  message,
} from "antd";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import dayjs, { Dayjs } from "dayjs";
import {
  DownloadOutlined,
  SaveOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { ApiTypes, CustomSession } from "@/app/types/api";
import StockImport = ApiTypes.StockImport;
import { fetchImport } from "@/app/api/stock-import/fetchImportById";
import { updateImport } from "@/app/api/stock-import/updateImport";

const { Title } = Typography;

const ImportDetail: React.FC = () => {
  const [importData, setImportData] = useState<StockImport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { id } = useParams<{ id: string }>();
  const { data: session }: { data: CustomSession } = useSession();
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await fetchImport(session?.access!, id);
        setImportData(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.access) {
      fetchData();
    }
  }, [session?.access, id]);

  const handleSave = async (values: any) => {
    try {
      await updateImport(session?.access!, id, values);
      message.success("Import úspěšně aktualizován");
    } catch (error) {
      console.error("Nepodařilo se aktualizovat import:", error);
      message.error("Nepodařilo se aktualizovat import");
    }
  };

  const handleDownload = () => {
    if (importData?.invoice_pdf) {
      const link = document.createElement("a");
      if (typeof importData.invoice_pdf === "string") {
        link.href = importData.invoice_pdf;
      }
      link.download = "faktura.pdf";
      link.click();
    }
  };

  return (
    <Card>
      {loading ? (
        <Skeleton active />
      ) : (
        <Form
          layout="vertical"
          initialValues={{
            ...importData,
            date_created: importData ? dayjs(importData.date_created) : null,
          }}
          onFinish={handleSave}
        >
          <Title level={2}>Detail Importu</Title>
          <Form.Item label="Název Dodavatele" name="supplier_name">
            <Input disabled />
          </Form.Item>
          <Form.Item label="Datum Vytvoření" name="date_created">
            <DatePicker
              defaultValue={importData ? dayjs(importData.date_created) : null}
              disabled
            />
          </Form.Item>
          <Form.Item label="Poznámka" name="note">
            <Input.TextArea />
          </Form.Item>
          <Form.Item label="Faktura PDF" name="invoice_pdf">
            {importData?.invoice_pdf && (
              <Button icon={<DownloadOutlined />} onClick={handleDownload}>
                Stáhnout Fakturu
              </Button>
            )}
          </Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
              Uložit
            </Button>
            <Button onClick={() => router.back()}>Zrušit</Button>
          </Space>
        </Form>
      )}
    </Card>
  );
};

export default ImportDetail;
