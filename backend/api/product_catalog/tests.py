import csv
from datetime import timedelta
from io import StringIO

from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, TransactionTestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase, APIClient

from api.product_catalog.models import Category, Product, Voucher
from api.warehouse.models import Stockentry, StockMovementType
from authentication.models import CustomUser


class CategoryModelTests(TestCase):

    def test_category_creation(self):
        category = Category.objects.create(name="Test Category")
        self.assertEqual(category.name, "Test Category")
        self.assertIsNone(category.parent)

    def test_category_with_parent(self):
        parent_category = Category.objects.create(name="Parent Category")
        child_category = Category.objects.create(name="Child Category", parent=parent_category)

        self.assertEqual(child_category.name, "Child Category")
        self.assertEqual(child_category.parent, parent_category)

    def test_category_str_representation(self):
        category = Category.objects.create(name="Test Category")
        self.assertEqual(str(category), "Test Category")


class ProductModelTests(TestCase):

    def test_product_creation(self):
        category = Category.objects.create(name="Test Category")
        product = Product(
            name="Test Product",
            category=category,
            price_with_vat=100.0,
            price_without_vat=80.0,
            inventory_count=10,
            unit="pieces",
            measurement_of_quantity=1,
            tax_rate=20.0,
        )
        product.save()

        self.assertEqual(product.name, "Test Product")
        self.assertEqual(product.category, category)
        self.assertEqual(product.price_with_vat, 100.0)
        self.assertEqual(product.price_without_vat, 80.0)
        self.assertEqual(product.inventory_count, 10)
        self.assertEqual(product.unit, "pieces")
        self.assertEqual(product.tax_rate, 20.0)
        self.assertIsNone(product.ean_code)
        self.assertTrue(product.image in (None, ""))
        self.assertIsNone(product.color)
        self.assertIsNone(product.description)
        self.assertIsNotNone(product.date_created)
        self.assertIsNotNone(product.date_updated)

    def test_product_clean_method(self):
        category = Category.objects.create(name="Test Category")

        # Valid product should pass the clean method without raising ValidationError
        product = Product(
            name="Test Product",
            category=category,
            price_with_vat=100.0,
            price_without_vat=80.0,
            inventory_count=10,
            unit="pieces",
            tax_rate=20.0,
        )
        product.clean()

        # Invalid product with negative inventory count should raise ValidationError
        product.inventory_count = -1
        with self.assertRaises(ValidationError):
            product.clean()

        # Invalid product with negative tax rate should raise ValidationError
        product.inventory_count = 10
        product.tax_rate = -1
        with self.assertRaises(ValidationError):
            product.clean()

    def test_product_str_representation(self):
        category = Category.objects.create(name="Test Category")
        product = Product.objects.create(
            name="Test Product",
            category=category,
            price_with_vat=100.0,
            price_without_vat=80.0,
            inventory_count=10,
            unit="pieces",
            tax_rate=20.0,
            measurement_of_quantity=1,
        )

        self.assertEqual(str(product), "Test Product")

    def test_product_soft_delete(self):
        category = Category.objects.create(name="Test Category")
        product = Product.objects.create(
            name="Test Product",
            category=category,
            price_with_vat=100.0,
            price_without_vat=80.0,
            inventory_count=10,
            unit="pieces",
            measurement_of_quantity=1,
            tax_rate=20.0,
        )

        # Soft delete the product
        product.is_active = False
        product.save()

        # Check that the product still exists but is inactive
        self.assertFalse(Product.objects.get(id=product.id).is_active)

        # Check that the product is returned when explicitly querying for inactive products
        self.assertIn(product, Product.objects.filter(is_active=False))


class VoucherViewSetTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = CustomUser.objects.create_superuser(
            username="admin", password="adminpassword", role="AD", email="admin@example.com"
        )
        self.ca_user = CustomUser.objects.create_user(
            username="ca_user", password="capassword", role="CA", email="ca_user@example.com"
        )
        self.voucher_data = {
            "ean_code": "1234567890",
            "expiration_date": timezone.now() + timedelta(days=7),
            "discount_type": "Percentage",
            "discount_amount": 10.0,
            "is_active": True,
            "description": "Test Voucher",
            "title": "Test Voucher",
        }

    def create_voucher(self, user):
        self.client.force_authenticate(user=user)
        response = self.client.post(
            reverse("voucher-list"), self.voucher_data, format="json"
        )
        return response

    def assert_voucher_creation_failed(self, response):
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Voucher.objects.count(), 0)

    def test_create_voucher_with_valid_data(self):
        response = self.create_voucher(self.admin_user)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Voucher.objects.count(), 1)

    def test_create_voucher_with_unauthenticated_user(self):
        response = self.client.post(
            reverse("voucher-list"), self.voucher_data, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(Voucher.objects.count(), 0)

    def test_create_voucher_with_ca_user(self):
        response = self.create_voucher(self.ca_user)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Voucher.objects.count(), 0)

    def test_create_voucher_with_invalid_discount_type(self):
        self.voucher_data["discount_type"] = "InvalidType"
        response = self.create_voucher(self.admin_user)
        self.assert_voucher_creation_failed(response)

    def test_create_voucher_with_negative_discount_amount(self):
        self.voucher_data["discount_amount"] = -10.0
        response = self.create_voucher(self.admin_user)
        self.assert_voucher_creation_failed(response)

    def retrieve_voucher(self, user, voucher):
        self.client.force_authenticate(user=user)
        response = self.client.get(
            reverse("voucher-detail", args=[voucher.id]), format="json"
        )
        return response

    def test_retrieve_voucher_with_valid_id(self):
        voucher = Voucher.objects.create(**self.voucher_data)
        response = self.retrieve_voucher(self.admin_user, voucher)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], voucher.id)

    def test_retrieve_voucher_with_invalid_id(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(
            reverse("voucher-detail", args=[9999]), format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_voucher_with_unauthenticated_user(self):
        voucher = Voucher.objects.create(**self.voucher_data)
        response = self.client.get(
            reverse("voucher-detail", args=[voucher.id]), format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_voucher_with_ca_user(self):
        voucher = Voucher.objects.create(**self.voucher_data)
        response = self.retrieve_voucher(self.ca_user, voucher)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], voucher.id)

    def update_voucher(self, user, voucher, updated_data):
        self.client.force_authenticate(user=user)
        response = self.client.patch(
            reverse("voucher-detail", args=[voucher.id]), updated_data, format="json"
        )
        return response

    def test_update_voucher_with_valid_data(self):
        voucher = Voucher.objects.create(**self.voucher_data)
        updated_data = {
            "discount_amount": 20.0,
            "is_active": False,
        }
        response = self.update_voucher(self.admin_user, voucher, updated_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        voucher.refresh_from_db()
        self.assertEqual(voucher.discount_amount, 20.0)
        self.assertFalse(voucher.is_active)

    def test_update_voucher_with_unauthenticated_user(self):
        voucher = Voucher.objects.create(**self.voucher_data)
        updated_data = {
            "discount_amount": 20.0,
        }
        response = self.client.patch(
            reverse("voucher-detail", args=[voucher.id]), updated_data, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_voucher_with_ca_user(self):
        voucher = Voucher.objects.create(**self.voucher_data)
        updated_data = {
            "discount_amount": 20.0,
        }
        response = self.update_voucher(self.ca_user, voucher, updated_data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_voucher_with_invalid_discount_type(self):
        voucher = Voucher.objects.create(**self.voucher_data)
        updated_data = {
            "discount_type": "InvalidType",
        }
        response = self.update_voucher(self.admin_user, voucher, updated_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def delete_voucher(self, user, voucher):
        self.client.force_authenticate(user=user)
        response = self.client.delete(
            reverse("voucher-detail", args=[voucher.id]), format="json"
        )
        return response

    def test_delete_voucher_with_invalid_id(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.delete(
            reverse("voucher-detail", args=[9999]), format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_voucher_with_unauthenticated_user(self):
        voucher = Voucher.objects.create(**self.voucher_data)
        response = self.client.delete(
            reverse("voucher-detail", args=[voucher.id]), format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_soft_delete_voucher(self):
        voucher = Voucher.objects.create(**self.voucher_data)
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.delete(reverse("voucher-detail", args=[voucher.id]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Voucher successfully archived")

        # Refresh the voucher from the database
        voucher.refresh_from_db()

        # Check that the voucher still exists but is marked as deleted and inactive
        self.assertTrue(voucher.is_deleted)
        self.assertFalse(voucher.is_active)

    def test_list_vouchers_excludes_deleted(self):
        active_voucher = Voucher.objects.create(**self.voucher_data)
        deleted_voucher_data = self.voucher_data.copy()
        deleted_voucher_data['ean_code'] = '0987654321'
        deleted_voucher = Voucher.objects.create(**deleted_voucher_data)
        deleted_voucher.soft_delete()

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(reverse("voucher-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check that we only got one voucher in the response
        self.assertEqual(response.data['count'], 1)

        # Check that the results contain only one voucher
        self.assertEqual(len(response.data['results']), 1)

        # Get the voucher data from the results
        voucher_data = response.data['results'][0]

        # Check that the voucher in the response is the active one
        self.assertEqual(voucher_data['id'], active_voucher.id)
        self.assertEqual(voucher_data['ean_code'], active_voucher.ean_code)
        self.assertEqual(voucher_data['title'], active_voucher.title)

        # Check that the deleted voucher's id is not in the results
        deleted_voucher_ids = [v['id'] for v in response.data['results']]
        self.assertNotIn(deleted_voucher.id, deleted_voucher_ids)

    def test_retrieve_deleted_voucher_returns_404(self):
        voucher = Voucher.objects.create(**self.voucher_data)
        voucher.soft_delete()

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(reverse("voucher-detail", args=[voucher.id]))

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_deleted_voucher_returns_404(self):
        voucher = Voucher.objects.create(**self.voucher_data)
        voucher.soft_delete()

        self.client.force_authenticate(user=self.admin_user)
        updated_data = {"discount_amount": 20.0}
        response = self.client.patch(
            reverse("voucher-detail", args=[voucher.id]), updated_data, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_soft_delete_already_deleted_voucher(self):
        voucher = Voucher.objects.create(**self.voucher_data)
        voucher.soft_delete()

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.delete(reverse("voucher-detail", args=[voucher.id]))

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_voucher_with_deleted_ean_code(self):
        deleted_voucher = Voucher.objects.create(**self.voucher_data)
        deleted_voucher.soft_delete()

        new_voucher_data = self.voucher_data.copy()
        new_voucher_data['title'] = "New Voucher"

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(reverse("voucher-list"), new_voucher_data, format="json")
        print(response.data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Voucher.objects.filter(is_deleted=False).count(), 1)
        self.assertEqual(response.data['title'], "New Voucher")

    def test_export_catalog_excludes_deleted_vouchers(self):
        active_voucher = Voucher.objects.create(**self.voucher_data)
        deleted_voucher_data = self.voucher_data.copy()
        deleted_voucher_data['ean_code'] = '0987654321'
        deleted_voucher = Voucher.objects.create(**deleted_voucher_data)
        deleted_voucher.soft_delete()

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(reverse("catalog-export_catalog"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        content = response.content.decode('utf-8')
        reader = csv.reader(StringIO(content))
        rows = list(reader)

        voucher_rows = [row for row in rows if row[0] == 'voucher']
        self.assertEqual(len(voucher_rows), 1)  # Only the active voucher
        self.assertEqual(voucher_rows[0][8], active_voucher.ean_code)  # Assuming EAN code is in the 9th column


class CatalogViewSetTests(APITestCase):

    def setUp(self):
        self.client = APIClient()
        self.admin_user = CustomUser.objects.create_superuser(
            username="admin", password="adminpassword", role="AD", email="admin@example.com"
        )
        self.ca_user = CustomUser.objects.create_user(
            username="ca_user", password="capassword", role="CA", email="ca_user@example.com"
        )

        self.category_data = {
            "type": "category",
            "name": "Test Category",
            "parent": ""
        }

        self.product_data = {
            "type": "product",
            "name": "Test Product",
            "category": "Test Category",
            "price_with_vat": 100.0,
            "price_without_vat": 80.0,
            "inventory_count": 10,
            "unit": 1,
            "measurement_of_quantity": 1.0,
            "ean_code": "",
            "color": "",
            "description": "",
            "tax_rate": 20.0,
        }

        self.voucher_data = {
            "type": "voucher",
            "ean_code": "1234567890",
            "expiration_date": (timezone.now() + timedelta(days=7)).isoformat(),
            "discount_type": "Percentage",
            "discount_amount": 10.0,
            "is_active": True,
            "description": "Test Voucher",
            "title": "Test Voucher",
        }

    def test_import_catalog_with_valid_data_including_voucher(self):
        self.client.force_authenticate(user=self.admin_user)
        csv_file = StringIO()
        writer = csv.writer(csv_file)
        writer.writerow(self.category_data.values())
        writer.writerow(self.product_data.values())
        writer.writerow(self.voucher_data.values())
        csv_file.seek(0)

        response = self.client.post(
            reverse("catalog-import_catalog"),
            {'file': csv_file},
            format="multipart"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Category.objects.count(), 1)
        self.assertEqual(Product.objects.count(), 1)
        self.assertEqual(Voucher.objects.count(), 1)

    def test_export_catalog_includes_vouchers(self):
        self.client.force_authenticate(user=self.admin_user)
        category = Category.objects.create(name="Test Category")
        Product.objects.create(
            name="Test Product",
            category=category,
            price_with_vat=100.0,
            price_without_vat=80.0,
            inventory_count=10,
            unit="pieces",
            measurement_of_quantity=1.0,
            tax_rate=20.0,
        )
        Voucher.objects.create(
            ean_code="1234567890",
            expiration_date=timezone.now() + timedelta(days=7),
            discount_type="Percentage",
            discount_amount=10.0,
            is_active=True,
            description="Test Voucher",
            title="Test Voucher",
        )

        response = self.client.get(reverse("catalog-export_catalog"), format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        content = response.content.decode('utf-8')
        reader = csv.reader(StringIO(content))

        rows = list(reader)
        self.assertEqual(len(rows), 4)  # Header + 1 category + 1 product + 1 voucher
        self.assertEqual(rows[1][1], "Test Category")  # Check category name
        self.assertEqual(rows[2][1], "Test Product")  # Check product name
        self.assertEqual(rows[3][0], "voucher")  # Check voucher type
        self.assertEqual(rows[3][8], "1234567890")  # Check voucher EAN code

    def test_import_catalog_with_valid_data(self):
        self.client.force_authenticate(user=self.admin_user)
        csv_file = StringIO()
        writer = csv.writer(csv_file)
        writer.writerow(self.category_data.values())
        writer.writerow(self.product_data.values())
        csv_file.seek(0)

        response = self.client.post(
            reverse("catalog-import_catalog"),
            {'file': csv_file},
            format="multipart"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Category.objects.count(), 1)
        self.assertEqual(Product.objects.count(), 1)

    def test_import_catalog_with_unauthenticated_user(self):
        csv_file = StringIO()
        writer = csv.writer(csv_file)
        writer.writerow(self.category_data.values())
        writer.writerow(self.product_data.values())
        csv_file.seek(0)

        response = self.client.post(
            reverse("catalog-import_catalog"),
            {'file': csv_file},
            format="multipart"
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(Category.objects.count(), 0)
        self.assertEqual(Product.objects.count(), 0)

    def test_import_catalog_with_ca_user(self):
        self.client.force_authenticate(user=self.ca_user)
        csv_file = StringIO()
        writer = csv.writer(csv_file)
        writer.writerow(self.category_data.values())
        writer.writerow(self.product_data.values())
        csv_file.seek(0)

        response = self.client.post(
            reverse("catalog-import_catalog"),
            {'file': csv_file},
            format="multipart"
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Category.objects.count(), 0)
        self.assertEqual(Product.objects.count(), 0)

    def test_export_catalog(self):
        self.client.force_authenticate(user=self.admin_user)
        category = Category.objects.create(name="Test Category")
        Product.objects.create(
            name="Test Product",
            category=category,
            price_with_vat=100.0,
            price_without_vat=80.0,
            inventory_count=10,
            unit="pieces",
            measurement_of_quantity=1.0,
            tax_rate=20.0,
        )

        response = self.client.get(reverse("catalog-export_catalog"), format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        content = response.content.decode('utf-8')
        reader = csv.reader(StringIO(content))

        rows = list(reader)
        self.assertEqual(len(rows), 3)  # Header + 1 category + 1 product
        self.assertEqual(rows[1][1], "Test Category")  # Check category name
        self.assertEqual(rows[2][1], "Test Product")  # Check product name

    def test_export_catalog_with_unauthenticated_user(self):
        response = self.client.get(reverse("catalog-export_catalog"), format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_export_catalog_with_ca_user(self):
        self.client.force_authenticate(user=self.ca_user)
        response = self.client.get(reverse("catalog-export_catalog"), format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_import_catalog_with_inactive_product(self):
        self.client.force_authenticate(user=self.admin_user)
        csv_content = (
            "type,name,category,price_with_vat,price_without_vat,inventory_count,measurement_of_quantity,unit,ean_code,color,description,tax_rate,is_active\n"
            "category,Test Category,,,,,,,,,,,,\n"
            "product,Inactive Product,Test Category,100.0,80.0,10,1.0,pieces,,,Some description,20.0,false\n"
        )
        csv_file = SimpleUploadedFile("catalog.csv", csv_content.encode('utf-8'), content_type="text/csv")

        response = self.client.post(
            reverse("catalog-import_catalog"),
            {'file': csv_file},
            format="multipart"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Category.objects.count(), 1)
        self.assertEqual(Product.objects.count(), 1)
        inactive_product = Product.objects.first()
        self.assertFalse(inactive_product.is_active)
        self.assertEqual(inactive_product.name, "Inactive Product")

    def test_export_catalog_excludes_inactive_products(self):
        self.client.force_authenticate(user=self.admin_user)
        category = Category.objects.create(name="Test Category")
        Product.objects.create(
            name="Active Product",
            category=category,
            price_with_vat=100.0,
            price_without_vat=80.0,
            inventory_count=10,
            unit="pieces",
            measurement_of_quantity=1.0,
            tax_rate=20.0,
            is_active=True
        )
        Product.objects.create(
            name="Inactive Product",
            category=category,
            price_with_vat=50.0,
            price_without_vat=40.0,
            inventory_count=5,
            unit="pieces",
            measurement_of_quantity=1.0,
            tax_rate=20.0,
            is_active=False
        )

        response = self.client.get(reverse("catalog-export_catalog"), format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        content = response.content.decode('utf-8')
        reader = csv.reader(StringIO(content))

        rows = list(reader)
        self.assertEqual(len(rows), 3)  # Header + 1 category + 1 active product
        self.assertIn('is_active', rows[0])  # Check if 'is_active' is in the header
        is_active_index = rows[0].index('is_active')
        self.assertEqual(rows[1][1], "Test Category")  # Check category name
        self.assertEqual(rows[2][1], "Active Product")  # Check active product name
        self.assertEqual(rows[2][is_active_index], "True")  # Check active product is_active status

        # Ensure that inactive product is not included
        product_names = [row[1] for row in rows[1:]]
        self.assertNotIn("Inactive Product", product_names)

    def test_import_catalog_with_parent_category(self):
        self.client.force_authenticate(user=self.admin_user)
        csv_content = (
            "type,name,parent\n"
            "category,Parent Category,\n"
            "category,Child Category,Parent Category\n"
        )
        csv_file = SimpleUploadedFile("catalog.csv", csv_content.encode('utf-8'), content_type="text/csv")

        response = self.client.post(
            reverse("catalog-import_catalog"),
            {'file': csv_file},
            format="multipart"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Category.objects.count(), 2)
        parent_category = Category.objects.get(name="Parent Category")
        child_category = Category.objects.get(name="Child Category")
        self.assertEqual(child_category.parent, parent_category)


class ProductViewSetTests(TransactionTestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = CustomUser.objects.create_superuser(
            username="admin", password="adminpassword", role="AD", email="admin@example.com"
        )
        self.category = Category.objects.create(name="Test Category")
        self.active_product = Product.objects.create(
            name="Active Product",
            category=self.category,
            price_with_vat=100.0,
            price_without_vat=80.0,
            inventory_count=10,
            unit="pieces",
            measurement_of_quantity=1,
            tax_rate=20.0,
            is_active=True
        )
        self.inactive_product = Product.objects.create(
            name="Inactive Product",
            category=self.category,
            price_with_vat=50.0,
            price_without_vat=40.0,
            inventory_count=5,
            unit="pieces",
            measurement_of_quantity=1,
            tax_rate=20.0,
            is_active=False
        )
        self.product = Product.objects.create(
            name="Test Product",
            category=self.category,
            price_with_vat=100.0,
            price_without_vat=80.0,
            inventory_count=10,
            unit="pieces",
            measurement_of_quantity=1,
            tax_rate=20.0,
            is_active=True
        )

    def tearDown(self):
        # This will delete all data from the test database after each test
        Product.objects.all().delete()
        Category.objects.all().delete()
        CustomUser.objects.all().delete()

    def test_soft_delete_product(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.delete(reverse('product-detail', args=[self.product.id]))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # Refresh the product from the database
        self.product.refresh_from_db()

        # Check that the product still exists but is inactive
        self.assertFalse(self.product.is_active)

    def test_list_products_includes_inactive_by_default(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(reverse('product-list'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 3)  # All three products
        product_names = [product['name'] for product in response.data['results']]
        self.assertIn("Active Product", product_names)
        self.assertIn("Inactive Product", product_names)
        self.assertIn("Test Product", product_names)

    def test_list_products_excludes_inactive_when_show_active_true(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(reverse('product-list') + '?show_active=True')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)  # Only active products
        product_names = [product['name'] for product in response.data['results']]
        self.assertIn("Active Product", product_names)
        self.assertIn("Test Product", product_names)
        self.assertNotIn("Inactive Product", product_names)


class ProductStockEntryHistoryViewTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = CustomUser.objects.create_superuser(
            username="admin", password="adminpassword", role="AD", email="admin@example.com"
        )
        self.ca_user = CustomUser.objects.create_user(
            username="ca_user", password="capassword", role="CA", email="ca_user@example.com"
        )
        self.category = Category.objects.create(name="Test Category")
        self.product = Product.objects.create(
            name="Test Product",
            category=self.category,
            price_with_vat=100.0,
            price_without_vat=80.0,
            inventory_count=10,
            unit="pieces",
            measurement_of_quantity=1,
            tax_rate=20.0,
            is_active=True
        )
        self.stock_entry_old = Stockentry.objects.create(
            product=self.product,
            quantity=10,
            movement_type=StockMovementType.INCOMING,
            import_price=50.0,
            date_created=timezone.now() - timedelta(days=10)
        )
        self.stock_entry_latest = Stockentry.objects.create(
            product=self.product,
            quantity=5,
            movement_type=StockMovementType.INCOMING,
            import_price=60.0,
            date_created=timezone.now()
        )

    def test_get_latest_stock_entry_with_authenticated_user(self):
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("product-stock-entry-history", args=[self.product.id])
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.stock_entry_latest.id)
        self.assertEqual(response.data['import_price'], f"{self.stock_entry_latest.import_price:.2f}")

    def test_get_latest_stock_entry_with_unauthenticated_user(self):
        url = reverse("product-stock-entry-history", args=[self.product.id])
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_latest_stock_entry_for_non_existent_product(self):
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("product-stock-entry-history", args=[9999])
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, None)

    def test_get_latest_stock_entry_when_no_entries_exist(self):
        self.client.force_authenticate(user=self.admin_user)
        new_product = Product.objects.create(
            name="No Entry Product",
            category=self.category,
            price_with_vat=100.0,
            price_without_vat=80.0,
            inventory_count=10,
            unit="pieces",
            measurement_of_quantity=1,
            tax_rate=20.0,
            is_active=True
        )
        url = reverse("product-stock-entry-history", args=[new_product.id])
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, None)

    def test_get_latest_stock_entry_with_ca_user(self):
        self.client.force_authenticate(user=self.ca_user)
        url = reverse("product-stock-entry-history", args=[self.product.id])
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.stock_entry_latest.id)
        self.assertEqual(response.data['import_price'], f"{self.stock_entry_latest.import_price:.2f}")


class CategoryViewSetTests(APITestCase):
    def setUp(self):
        self.admin_user = CustomUser.objects.create_superuser(
            username="admin", password="adminpassword", role="AD", email="admin@example.com"
        )
        self.ca_user = CustomUser.objects.create_user(
            username="ca_user", password="capassword", role="CA", email="ca_user@example.com"
        )
        self.parent_category = Category.objects.create(name="Parent Category")
        self.child_category = Category.objects.create(name="Child Category", parent=self.parent_category)
        self.product = Product.objects.create(
            name="Test Product",
            category=self.child_category,
            price_with_vat=100.0,
            price_without_vat=80.0,
            inventory_count=10,
            unit="pieces",
            measurement_of_quantity=1,
            tax_rate=20.0,
        )

    def test_list_categories(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(reverse('category-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)  # Parent and child category

    def test_create_category(self):
        self.client.force_authenticate(user=self.admin_user)
        data = {'name': 'New Category', 'parent': self.parent_category.id}
        response = self.client.post(reverse('category-list'), data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Category.objects.count(), 3)

    def test_retrieve_category(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(reverse('category-detail', args=[self.child_category.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Child Category')

    def test_update_category(self):
        self.client.force_authenticate(user=self.admin_user)
        data = {'name': 'Updated Child Category'}
        response = self.client.patch(reverse('category-detail', args=[self.child_category.id]), data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.child_category.refresh_from_db()
        self.assertEqual(self.child_category.name, 'Updated Child Category')

    def test_smart_delete_category(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.delete(reverse('category-detail', args=[self.child_category.id]))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # Check that the category was deleted
        self.assertFalse(Category.objects.filter(id=self.child_category.id).exists())

        # Check that the product's category was set to the parent category
        self.product.refresh_from_db()
        self.assertEqual(self.product.category, self.parent_category)

    def test_delete_root_category(self):
        self.client.force_authenticate(user=self.admin_user)
        root_category = Category.objects.create(name="Root Category")
        response = self.client.delete(reverse('category-detail', args=[root_category.id]))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Category.objects.filter(id=root_category.id).exists())

    def test_create_category_unauthenticated(self):
        data = {'name': 'Unauthenticated Category'}
        response = self.client.post(reverse('category-list'), data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_categories_with_pagination(self):
        self.client.force_authenticate(user=self.admin_user)
        for i in range(10):
            Category.objects.create(name=f"Category {i}")

        response = self.client.get(reverse('category-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('count', response.data)
        self.assertIn('next', response.data)
        self.assertIn('previous', response.data)
        self.assertIn('results', response.data)

    def test_filter_categories(self):
        self.client.force_authenticate(user=self.admin_user)
        Category.objects.create(name="Test Filter Category")
        response = self.client.get(reverse('category-list') + '?name=Test Filter')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], "Test Filter Category")
