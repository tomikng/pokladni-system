import React, { useEffect } from "react";
import { Form, Input, Button, message, Card, Row, Col, Modal } from "antd";
import { useSession } from "next-auth/react";
import { ApiTypes, CustomSession } from "@/app/types/api";
import { updateCategory } from "@/app/api/categories/updateCategory";
import { createCategory } from "@/app/api/categories/createCategory";
import { deleteCategory } from "@/app/api/categories/deleteCategory";
import CategoryTreeSelect from "../../tree/CategoryTreeSelect";

interface CategoryFormProps {
  initialValues?: ApiTypes.Category;
  onFormFinish?: () => void;
}

const CategoryForm: React.FC<CategoryFormProps> = ({
  initialValues,
  onFormFinish,
}) => {
  const [form] = Form.useForm();
  const { data: session }: { data: CustomSession } = useSession();

  useEffect(() => {
    form.resetFields();
    form.setFieldsValue(initialValues);
  }, [initialValues, form]);

  const onFinish = async (values: ApiTypes.Category) => {
    try {
      let response;
      if (initialValues?.id) {
        response = await updateCategory(
          session?.access!,
          initialValues.id,
          values
        );
        if (onFormFinish) onFormFinish();
      } else {
        response = await createCategory(session?.access!, values);
      }
      if (response) {
        form.resetFields();
      }
    } catch (error: any) {
      console.error("Chyba při zpracování kategorie:", error);
    }
  };

  const confirmDelete = () => {
    Modal.confirm({
      title: "Jste si jisti, že chcete smazat tuto kategorii?",
      content: "Smažou se i všechny podřízené kategorie a produkty.",
      onOk() {
        deleteCategoryAction();
      },
    });
  };

  const deleteCategoryAction = async () => {
    if (initialValues?.id) {
      try {
        await deleteCategory(session?.access!, initialValues.id);
        message.success("Smazání kategorie proběhlo úspěšně.");
        if (onFormFinish) onFormFinish();
      } catch (error) {
        message.error("Chyba při mazání kategorie.");
      }
    }
  };

  return (
    <Row justify="center">
      <Col xs={24} sm={20} md={16} lg={12}>
        <Card
          title={`${initialValues?.id ? "Editovat" : "Vytvořit novou"} kategorii `}
          bordered={false}
          style={{ marginTop: 16 }}
        >
          <Form
            form={form}
            onFinish={onFinish}
            layout="vertical"
            initialValues={initialValues}
          >
            <Form.Item
              name="name"
              label="Název kategorie"
              rules={[
                { required: true, message: "Zadejte prosím název kategorie" },
              ]}
            >
              <Input placeholder="Zadejte název kategorie" />
            </Form.Item>
            <Form.Item name="parent" label="Nadřazená kategorie">
              <CategoryTreeSelect
                onSelect={(_, id) => {
                  form.setFieldsValue({ parent: id });
                }}
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                {initialValues?.id ? "Aktualizovat" : "Vytvořit"}
              </Button>
              {initialValues?.id && (
                <Button
                  danger
                  block
                  style={{ marginTop: "8px" }}
                  onClick={confirmDelete}
                >
                  Smazat kategorii
                </Button>
              )}
            </Form.Item>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

export default CategoryForm;
