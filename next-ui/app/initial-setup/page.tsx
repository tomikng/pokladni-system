"use client";
import React, { useState } from "react";
import { Card, message } from "antd";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ApiTypes, CustomSession } from "@/app/types/api";
import BusinessSettingsForm from "@/app/components/forms/settings/BussinessSettingsForm";
import {createBusinessSettings} from "@/app/api/settings/createBussinessSetting";

const InitialSetupPage: React.FC = () => {
    const router = useRouter();
    const { data: session }: { data: CustomSession } = useSession();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const onSubmit = async (values: ApiTypes.BusinessSettings) => {
        setIsSubmitting(true);
        try {
            if (!session?.access) { return }
            await createBusinessSettings(session.access, values);
            message.success("Nastavení bylo úspěšně vytvořeno");
            // Use a slight delay to ensure the message is seen
            setTimeout(() => {
                router.replace('/');
            }, 1000);
        } catch (error) {
            console.error("Error creating business settings:", error);
            message.error("Nepodařilo se vytvořit nastavení");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card>
            <BusinessSettingsForm
                onSubmit={onSubmit}
                title="Počáteční nastavení"
                submitButtonText="Dokončit nastavení"
                loading={isSubmitting}
            />
        </Card>
    );
};

export default InitialSetupPage;