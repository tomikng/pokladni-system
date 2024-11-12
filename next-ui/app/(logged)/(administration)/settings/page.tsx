"use client";
import React, { useState, useEffect } from "react";
import { Card, message } from "antd";
import { fetchBusinessSettings } from "@/app/api/settings/fetchBussinessSettings";
import { updateBusinessSettings } from "@/app/api/settings/updateBussinessSettings";
import { useSession } from "next-auth/react";
import { ApiTypes, CustomSession } from "@/app/types/api";
import BusinessSettingsForm from "@/app/components/forms/settings/BussinessSettingsForm";

const SettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState<ApiTypes.BusinessSettings>();
  const { data: session }: { data: CustomSession } = useSession();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!session?.access) {
          return;
        }
        const settingsData = await fetchBusinessSettings(session?.access);
        setInitialData(settingsData);
      } catch (error) {
        message.error("Nepodařilo se načíst data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session?.access]);

  const onSubmit = async (values: ApiTypes.BusinessSettings) => {
    try {
      if (!session?.access) {
        return;
      }
      await updateBusinessSettings(
        session?.access,
        values,
        initialData!.id.toString(),
      );
      message.success("Nastavení bylo úspěšně aktualizováno");
    } catch (error) {
      message.error("Nepodařilo se aktualizovat nastavení");
    }
  };

  return (
    <Card loading={loading}>
      <BusinessSettingsForm
        initialData={initialData}
        onSubmit={onSubmit}
        loading={loading}
      />
    </Card>
  );
};

export default SettingsPage;
