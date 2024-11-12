"use client";
import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Upload,
  Row,
  Col,
  message,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ApiTypes, CustomSession } from "@/app/types/api";
import CategoryTree from "../../tree/CategoryTree";
import { fetchTaxRates } from "@/app/api/products/fetchTaxRates";
import { fetchAllCategories } from "@/app/api/categories/fetchCategories";
import { deleteQuickSaleById } from "@/app/api/quick-sale/deleteQuickSaleById";
import { fetchColors } from "@/app/api/products/fetchColors";
import { createProduct } from "@/app/api/products/createProduct";
import { updateProductFormData } from "@/app/api/products/updateProductFormData";
const { Option } = Select;
const { TextArea } = Input;

interface ProductFormProps {
  product?: ApiTypes.Product;
}

const ProductForm = ({ product }: ProductFormProps) => {
  const [categories, setCategories] = useState<ApiTypes.Category[]>([]);
  const [colors, setColors] = useState<any>([]);
  const [taxRates, setTaxRates] = useState<ApiTypes.TaxRate[]>([]);
  const [isTaxRateSet, setIsTaxRateSet] = useState(false);
  const [isCategoriesLoading, setCategoriesLoading] = useState(true);
  const [form] = Form.useForm();
  const router = useRouter();
  const { data: session }: { data: CustomSession } = useSession();
  const searchParams = useSearchParams();

  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchColorsData = async () => {
      try {
        if (!session?.access) {
          return;
        }
        const colorsData = await fetchColors(session?.access);
        setColors(colorsData);
      } catch (error) {
        console.error("Error fetching colors:", error);
      }
    };

    fetchColorsData();

    setCategoriesLoading(true);
    if (!session?.access) {
      return;
    }
    fetchAllCategories(session?.access).then((categories) =>
      setCategories(categories),
    );
    setCategoriesLoading(false);

    if (!session?.access) {
      return;
    }
    fetchTaxRates(session?.access).then((taxRates) => setTaxRates(taxRates));

    if (product) {
      form.setFieldsValue({
        ...product,
        price_without_vat: product.price_without_vat,
        price_with_vat: product.price_with_vat,
        image: product.image ? [{ url: product.image }] : [],
      });
      setIsTaxRateSet(true);
    }

    const quickSaleDataParam = searchParams.get("quickSaleData");
    if (quickSaleDataParam) {
      const quickSaleData = JSON.parse(decodeURIComponent(quickSaleDataParam));

      let priceWithoutVat;
      if (quickSaleData.tax_rate === 0) {
        priceWithoutVat = quickSaleData.price_with_vat;
      } else {
        priceWithoutVat =
          quickSaleData.price_with_vat /
          (1 + parseFloat(quickSaleData.tax_rate));
      }

      form.setFieldsValue({
        name: quickSaleData.name,
        ean_code: quickSaleData.ean_code,
        price_with_vat: quickSaleData.price_with_vat,
        price_without_vat: priceWithoutVat.toFixed(2),
        tax_rate: quickSaleData.tax_rate,
      });
      setIsTaxRateSet(true);
    }
  }, [session, product, form, searchParams]);

  const onFinish = async (values: any) => {
    const formData = new FormData();
    Object.keys(values).forEach((key) => {
      if (key !== "image" && key !== "color") {
        formData.append(key, values[key]);
      }
    });

    if (values.color) {
      formData.append("color", values.color);
    }

    if (values.description) {
      formData.append("description", values.description);
    }

    if (values.image && values.image.length > 0) {
      const file = values.image[0].originFileObj;
      if (file) {
        formData.append("image", file);
      }
    }

    try {
      setIsUploading(true);
      if (product) {
        if (!session?.access) {
          return;
        }
        await updateProductFormData(
          product.id.toString(),
          formData,
          session?.access,
        );
        message.success("Produkt byl úspěšně aktualizován");
      } else {
        if (!session?.access) {
          return;
        }
        await createProduct(formData, session?.access);
        message.success("Produkt byl úspěšně vytvořen");

        const quickSaleDataParam = searchParams.get("quickSaleData");
        if (quickSaleDataParam) {
          const quickSaleData = JSON.parse(
            decodeURIComponent(quickSaleDataParam),
          );
          if (quickSaleData && quickSaleData.id) {
            if (!session?.access) {
              return;
            }
            await deleteQuickSaleById(session?.access, quickSaleData.id);
          }
        }
      }
      setIsUploading(false);
      router.push("/catalog/list/");
    } catch (error: any) {
      setIsUploading(false);
      console.error("Chyba při ukládání produktu:", error);
      message.error(error.response?.data?.name || "An error occurred");
    }
  };

  const handleTaxRateChange = (value: number) => {
    form.setFieldsValue({ tax_rate: value });
    setIsTaxRateSet(true);
  };

  const handlePriceWithoutVatChange = (value: number | undefined) => {
    const taxRate = form.getFieldValue("tax_rate");
    if (value !== undefined && taxRate !== undefined) {
      const priceWithVat =
        taxRate === 0 ? value : value * (1 + parseFloat(taxRate));
      form.setFieldsValue({
        price_with_vat: Math.floor(priceWithVat * 100) / 100, // Ensure rounding to two decimal places
      });
    } else {
      form.setFieldsValue({ price_with_vat: undefined });
    }
  };

  const handlePriceWithVatChange = (value: number | undefined) => {
    const taxRate = form.getFieldValue("tax_rate");
    if (value !== undefined && taxRate !== undefined) {
      const priceWithoutVat =
        taxRate === 0 ? value : value / (1 + parseFloat(taxRate));
      form.setFieldsValue({
        price_without_vat: Math.floor(priceWithoutVat * 100) / 100, // Ensure rounding to two decimal places
      });
    } else {
      form.setFieldsValue({ price_without_vat: undefined });
    }
  };

  const eitherColorOrImageValidator = (_: any, value: any) => {
    if (
      !value &&
      !form.getFieldValue("image") &&
      !form.getFieldValue("color")
    ) {
      return Promise.reject(
        new Error("Prosím vyberte barvu nebo nahrajte obrázek produktu"),
      );
    }
    return Promise.resolve();
  };

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e && e.fileList;
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Row gutter={16}>
        <Col span={24}>
          <Form.Item name="ean_code" label="EAN kód">
            <Input maxLength={200} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="name"
            label="Název"
            rules={[
              { required: true, message: "Zadejte prosím název produktu" },
            ]}
          >
            <Input maxLength={200} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="color"
            label="Barva"
            rules={[{ validator: eitherColorOrImageValidator }]}
          >
            <Select>
              {colors.map((color: any) => (
                <Option key={color.value} value={color.value}>
                  {color.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={24}>
          {taxRates && taxRates.length > 0 && (
            <Form.Item
              name="tax_rate"
              label="Sazba daně"
              rules={[{ required: true, message: "Zadejte prosím sazbu daně" }]}
            >
              <Select onChange={handleTaxRateChange}>
                {taxRates.map((taxRate: any) => (
                  <Option
                    key={parseFloat(taxRate.value)}
                    value={parseFloat(taxRate.value)}
                  >
                    {taxRate.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="price_without_vat"
            label="Cena bez DPH"
            dependencies={["tax_rate"]}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (getFieldValue("tax_rate") && !value) {
                    return Promise.reject("Zadejte prosím cenu bez DPH");
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <InputNumber
              style={{ width: "100%" }}
              disabled={!isTaxRateSet}
              onChange={(value: number | null) =>
                handlePriceWithoutVatChange(value as number | undefined)
              }
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="price_with_vat"
            label="Cena s DPH"
            dependencies={["tax_rate"]}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (getFieldValue("tax_rate") && !value) {
                    return Promise.reject("Zadejte prosím cenu s DPH");
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <InputNumber
              style={{ width: "100%" }}
              disabled={!isTaxRateSet}
              onChange={(value: number | null) =>
                handlePriceWithVatChange(value as number | undefined)
              }
            />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="unit"
            label="Jednotka"
            rules={[{ required: true, message: "Zadejte prosím jednotku" }]}
          >
            <Input maxLength={200} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="measurement_of_quantity"
            label="Množství v měrné jednotce"
            tooltip="Počet kilogramů, litrů, ... v balném produktu. Příklad 1.5l vody tak množství v měrné jednotce je 1.5 v jendnotce l"
            rules={[{ required: true, message: "Zadejte prosím množství" }]}
          >
            <InputNumber maxLength={200} style={{ width: "100%" }} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={24}>
          <Form.Item
            name="category"
            label="Kategorie"
            rules={[{ required: true, message: "Vyberte prosím kategorii" }]}
          >
            <CategoryTree
              categories={categories}
              onSelect={(selectedKeys, _) => {
                form.setFieldsValue({ category: selectedKeys[0] });
              }}
              loading={isCategoriesLoading}
              canAddCategory={true}
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="description" label="Popis">
        <TextArea rows={4} />
      </Form.Item>
      <Form.Item
        name="image"
        label="Obrázek"
        valuePropName="fileList"
        getValueFromEvent={normFile}
        rules={[{ validator: eitherColorOrImageValidator }]}
      >
        <Upload
          listType="picture-card"
          beforeUpload={() => false}
          maxCount={1}
          action=""
        >
          <div>
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>Nahrát</div>
          </div>
        </Upload>
      </Form.Item>
      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          style={{ marginTop: "16px" }}
          loading={isUploading}
        >
          Odeslat
        </Button>
      </Form.Item>
    </Form>
  );
};
export default ProductForm;
