from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIClient, APITestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from api.warehouse.models import Supplier, Stockentry, StockImport, StockMovementType
from api.product_catalog.models import Category, Product
from django.urls import reverse
from rest_framework import status

from authentication.models import CustomUser


class SupplierTests(TestCase):
    def test_create_supplier_with_valid_data(self):
        supplier = Supplier.objects.create(
            name="Test Supplier",
            address="123 Test St",
            phone_number="1234567890",
            email="test@example.com",
            ico="12345678",
            dic="1234567890",
        )
        self.assertEqual(supplier.name, "Test Supplier")
        self.assertEqual(supplier.address, "123 Test St")
        self.assertEqual(supplier.phone_number, "1234567890")
        self.assertEqual(supplier.email, "test@example.com")
        self.assertEqual(supplier.ico, "12345678")
        self.assertEqual(supplier.dic, "1234567890")

    def test_retrieve_supplier_by_valid_id(self):
        supplier = Supplier.objects.create(
            name="Test Supplier", ico="12345678", dic="1234567890"
        )
        retrieved_supplier = Supplier.objects.get(id=supplier.id)
        self.assertEqual(retrieved_supplier, supplier)

    def test_retrieve_supplier_by_invalid_id(self):
        with self.assertRaises(Supplier.DoesNotExist):
            Supplier.objects.get(id=9999)

    def test_update_supplier_details(self):
        supplier = Supplier.objects.create(
            name="Test Supplier", ico="12345678", dic="1234567890"
        )
        supplier.name = "Updated Supplier"
        supplier.save()
        updated_supplier = Supplier.objects.get(id=supplier.id)
        self.assertEqual(updated_supplier.name, "Updated Supplier")

    def test_delete_supplier(self):
        supplier = Supplier.objects.create(
            name="Test Supplier", ico="12345678", dic="1234567890"
        )
        supplier_id = supplier.id
        supplier.delete()
        with self.assertRaises(Supplier.DoesNotExist):
            Supplier.objects.get(id=supplier_id)


class StockentryTests(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Test Category")
        self.product = Product.objects.create(
            name="Test Product",
            price_with_vat=11.2,
            price_without_vat=10.0,
            tax_rate=0.12,
            inventory_count=0,
            measurement_of_quantity=2,
            category=self.category,
            average_price=0.0
        )
        self.supplier = Supplier.objects.create(
            name="Test Supplier", ico="12345678", dic="1234567890"
        )

    def test_create_stockentry_with_valid_data(self):
        stockentry = Stockentry.objects.create(
            product=self.product,
            quantity=10,
            movement_type=StockMovementType.INCOMING,
            supplier=self.supplier,
            import_price=15.0
        )
        self.assertEqual(stockentry.product, self.product)
        self.assertEqual(stockentry.quantity, 10)
        self.assertEqual(stockentry.movement_type, StockMovementType.INCOMING)
        self.assertEqual(stockentry.supplier, self.supplier)
        self.assertEqual(stockentry.import_price, 15.0)

    def test_create_stockentry_missing_required_fields(self):
        with self.assertRaises(Exception):
            Stockentry.objects.create()

    def test_retrieve_stockentry_by_valid_id(self):
        stockentry = Stockentry.objects.create(
            product=self.product,
            quantity=10,
            movement_type=StockMovementType.INCOMING,
            supplier=self.supplier,
            import_price=15.0
        )
        retrieved_stockentry = Stockentry.objects.get(id=stockentry.id)
        self.assertEqual(retrieved_stockentry, stockentry)

    def test_retrieve_stockentry_by_invalid_id(self):
        with self.assertRaises(Stockentry.DoesNotExist):
            Stockentry.objects.get(id=9999)

    def test_update_stockentry_details(self):
        stockentry = Stockentry.objects.create(
            product=self.product,
            quantity=10,
            movement_type=StockMovementType.INCOMING,
            supplier=self.supplier,
            import_price=15.0
        )
        stockentry.quantity = 20
        stockentry.save()
        updated_stockentry = Stockentry.objects.get(id=stockentry.id)
        self.assertEqual(updated_stockentry.quantity, 20)

    def test_delete_stockentry(self):
        stockentry = Stockentry.objects.create(
            product=self.product,
            quantity=10,
            movement_type=StockMovementType.INCOMING,
            supplier=self.supplier,
            import_price=15.0
        )
        stockentry_id = stockentry.id
        stockentry.delete()
        with self.assertRaises(Stockentry.DoesNotExist):
            Stockentry.objects.get(id=stockentry_id)

    def test_incoming_stockentry_increases_product_inventory(self):
        self.assertEqual(self.product.inventory_count, 0)
        Stockentry.objects.create(
            product=self.product,
            quantity=10,
            movement_type=StockMovementType.INCOMING,
            supplier=self.supplier,
            import_price=15.0
        )
        self.product.refresh_from_db()
        self.assertEqual(self.product.inventory_count, 10)

    def test_outgoing_stockentry_decreases_product_inventory(self):
        self.product.inventory_count = 20
        self.product.save()
        Stockentry.objects.create(
            product=self.product,
            quantity=5,
            movement_type=StockMovementType.OUTGOING,
            supplier=self.supplier,
            import_price=15.0
        )
        self.product.refresh_from_db()
        self.assertEqual(self.product.inventory_count, 15)

    def test_delete_incoming_stockentry_decreases_product_inventory(self):
        stockentry = Stockentry.objects.create(
            product=self.product,
            quantity=10,
            movement_type=StockMovementType.INCOMING,
            supplier=self.supplier,
            import_price=15.0
        )
        self.product.refresh_from_db()
        self.assertEqual(self.product.inventory_count, 10)
        stockentry.delete()
        self.product.refresh_from_db()
        self.assertEqual(self.product.inventory_count, 0)

    def test_delete_outgoing_stockentry_increases_product_inventory(self):
        self.product.inventory_count = 20
        self.product.save()
        stockentry = Stockentry.objects.create(
            product=self.product,
            quantity=5,
            movement_type=StockMovementType.OUTGOING,
            supplier=self.supplier,
            import_price=15.0
        )
        self.product.refresh_from_db()
        self.assertEqual(self.product.inventory_count, 15)
        stockentry.delete()
        self.product.refresh_from_db()
        self.assertEqual(self.product.inventory_count, 20)

    def test_average_price_calculation_on_incoming_stockentry(self):
        # Initial stock entry
        Stockentry.objects.create(
            product=self.product,
            quantity=10,
            movement_type=StockMovementType.INCOMING,
            supplier=self.supplier,
            import_price=10
        )
        self.product.refresh_from_db()
        self.assertEqual(float(self.product.average_price), 10.0)

        # Second stock entry with a different price
        Stockentry.objects.create(
            product=self.product,
            quantity=10,
            movement_type=StockMovementType.INCOMING,
            supplier=self.supplier,
            import_price=20
        )
        self.product.refresh_from_db()
        self.assertEqual(float(self.product.average_price), 15.0)

    def test_average_price_calculation_on_deleting_incoming_stockentry(self):
        # Initial stock entry
        stockentry = Stockentry.objects.create(
            product=self.product,
            quantity=10,
            movement_type=StockMovementType.INCOMING,
            supplier=self.supplier,
            import_price=10
        )
        self.product.refresh_from_db()
        self.assertEqual(float(self.product.average_price), 10.0)

        # Second stock entry with a different price
        Stockentry.objects.create(
            product=self.product,
            quantity=10,
            movement_type=StockMovementType.INCOMING,
            supplier=self.supplier,
            import_price=20
        )
        self.product.refresh_from_db()
        self.assertEqual(float(self.product.average_price), 15.0)

        # Delete the first stock entry
        stockentry.delete()
        self.product.refresh_from_db()
        self.assertEqual(float(self.product.average_price), 20.0)

    def test_stockentry_precision_with_different_prices(self):
        # Initial import of 10 units at $10 each
        Stockentry.objects.create(
            product=self.product,
            quantity=10,
            movement_type=StockMovementType.INCOMING,
            supplier=self.supplier,
            import_price=10.0
        )
        self.product.refresh_from_db()
        self.assertEqual(self.product.inventory_count, 10)
        self.assertEqual(float(self.product.average_price), 10.0)

        # Second import of 5 units at $12 each
        Stockentry.objects.create(
            product=self.product,
            quantity=5,
            movement_type=StockMovementType.INCOMING,
            supplier=self.supplier,
            import_price=12.0
        )
        self.product.refresh_from_db()
        self.assertEqual(self.product.inventory_count, 15)
        expected_average_price = (10 * 10 + 5 * 12) / 15
        self.assertAlmostEqual(float(self.product.average_price), expected_average_price, places=2)

        # Sell 8 units
        Stockentry.objects.create(
            product=self.product,
            quantity=8,
            movement_type=StockMovementType.OUTGOING,
            supplier=self.supplier,
            import_price=self.product.average_price
        )
        self.product.refresh_from_db()
        self.assertEqual(self.product.inventory_count, 7)

        # The average price should remain the same after selling
        self.assertAlmostEqual(float(self.product.average_price), expected_average_price, places=2)

        # Verify the total value of inventory
        expected_inventory_value = 7 * expected_average_price
        actual_inventory_value = self.product.inventory_count * float(self.product.average_price)
        self.assertAlmostEqual(actual_inventory_value, expected_inventory_value, places=2)


class SupplierViewSetTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = CustomUser.objects.create_superuser(
            username="admin", password="adminpassword", role="AD"
        )
        self.ca_user = CustomUser.objects.create_user(
            username="ca_user", password="capassword", role="CA"
        )
        self.ma_user = CustomUser.objects.create_user(
            username="ma_user", password="mapassword", role="MA"
        )

        self.supplier_data = {
            "name": "Test Supplier",
            "address": "123 Test St",
            "phone_number": "1234567890",
            "email": "test@example.com",
            "ico": "12345678",
            "dic": "1234567890",
        }

    def test_ma_user_create_supplier(self):
        self.client.force_authenticate(user=self.ma_user)
        response = self.client.post(reverse("supplier-list"), self.supplier_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_ma_user_retrieve_supplier(self):
        supplier = Supplier.objects.create(**self.supplier_data)
        self.client.force_authenticate(user=self.ma_user)
        response = self.client.get(reverse("supplier-detail", args=[supplier.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], supplier.id)

    def test_ma_user_update_supplier(self):
        supplier = Supplier.objects.create(**self.supplier_data)
        self.client.force_authenticate(user=self.ma_user)
        updated_data = {"name": "Updated Supplier"}
        response = self.client.patch(
            reverse("supplier-detail", args=[supplier.id]), updated_data
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        supplier.refresh_from_db()
        self.assertEqual(supplier.name, "Updated Supplier")

    def test_ma_user_delete_supplier(self):
        supplier = Supplier.objects.create(**self.supplier_data)
        self.client.force_authenticate(user=self.ma_user)
        response = self.client.delete(reverse("supplier-detail", args=[supplier.id]))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Supplier.objects.count(), 0)


class StockentryViewSetTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = CustomUser.objects.create_superuser(
            username="admin", password="adminpassword", role="AD"
        )
        self.ca_user = CustomUser.objects.create_user(
            username="ca_user", password="capassword", role="CA"
        )
        self.ma_user = CustomUser.objects.create_user(
            username="ma_user", password="mapassword", role="MA"
        )
        self.category = Category.objects.create(name="Test Category")
        self.product = Product.objects.create(
            name="Test Product",
            price_with_vat=11.2,
            price_without_vat=10.0,
            tax_rate=0.12,
            inventory_count=0,
            measurement_of_quantity=2,
            category=self.category,
            average_price=0.0
        )
        self.supplier = Supplier.objects.create(
            name="Test Supplier", ico="12345678", dic="1234567890"
        )
        self.stockentry_data = {
            "product": self.product.id,
            "quantity": 10,
            "movement_type": StockMovementType.INCOMING,
            "supplier": self.supplier.id,
            "import_price": 15.0
        }

    def test_create_stockentry_missing_required_fields(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(reverse("stockentry-list"), {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Stockentry.objects.count(), 0)

    def test_create_stockentry_with_negative_quantity(self):
        self.client.force_authenticate(user=self.admin_user)
        self.stockentry_data["quantity"] = -10
        response = self.client.post(reverse("stockentry-list"), self.stockentry_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Stockentry.objects.count(), 0)

    def test_retrieve_stockentry_by_valid_id(self):
        self.client.force_authenticate(user=self.admin_user)
        stockentry = Stockentry.objects.create(
            product=self.product,
            quantity=10,
            movement_type=StockMovementType.INCOMING,
            supplier=self.supplier,
            import_price=15.0
        )
        response = self.client.get(reverse("stockentry-detail", args=[stockentry.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], stockentry.id)

    def test_retrieve_stockentry_by_invalid_id(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(reverse("stockentry-detail", args=[9999]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_stockentry_details(self):
        self.client.force_authenticate(user=self.admin_user)
        stockentry = Stockentry.objects.create(
            product=self.product,
            quantity=10,
            movement_type=StockMovementType.INCOMING,
            supplier=self.supplier,
            import_price=15.0
        )
        updated_data = {"quantity": 20}
        response = self.client.patch(
            reverse("stockentry-detail", args=[stockentry.id]), updated_data
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        stockentry.refresh_from_db()
        self.assertEqual(stockentry.quantity, 20)

    def test_delete_stockentry(self):
        self.client.force_authenticate(user=self.admin_user)
        stockentry = Stockentry.objects.create(
            product=self.product,
            quantity=10,
            movement_type=StockMovementType.INCOMING,
            supplier=self.supplier,
            import_price=15.0
        )
        response = self.client.delete(
            reverse("stockentry-detail", args=[stockentry.id])
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Stockentry.objects.count(), 0)

    def test_ma_user_retrieve_stockentry(self):
        self.client.force_authenticate(user=self.ma_user)
        stockentry = Stockentry.objects.create(
            product=self.product,
            quantity=10,
            movement_type=StockMovementType.INCOMING,
            supplier=self.supplier,
            import_price=15.0
        )
        response = self.client.get(reverse("stockentry-detail", args=[stockentry.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], stockentry.id)

    def test_ma_user_update_stockentry(self):
        self.client.force_authenticate(user=self.ma_user)
        stockentry = Stockentry.objects.create(
            product=self.product,
            quantity=10,
            movement_type=StockMovementType.INCOMING,
            supplier=self.supplier,
            import_price=15.0
        )
        updated_data = {"quantity": 20}
        response = self.client.patch(
            reverse("stockentry-detail", args=[stockentry.id]), updated_data
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        stockentry.refresh_from_db()
        self.assertEqual(stockentry.quantity, 20)

    def test_ma_user_delete_stockentry(self):
        self.client.force_authenticate(user=self.ma_user)
        stockentry = Stockentry.objects.create(
            product=self.product,
            quantity=10,
            movement_type=StockMovementType.INCOMING,
            supplier=self.supplier,
            import_price=15.0
        )
        response = self.client.delete(
            reverse("stockentry-detail", args=[stockentry.id])
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Stockentry.objects.count(), 0)


class StockImportViewSetTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = CustomUser.objects.create_superuser(
            username="admin", password="adminpassword", role="AD"
        )
        self.ca_user = CustomUser.objects.create_user(
            username="ca_user", password="capassword", role="CA"
        )
        self.ma_user = CustomUser.objects.create_user(
            username="ma_user", password="mapassword", role="MA"
        )
        self.supplier = Supplier.objects.create(
            name="Test Supplier", ico="12345678", dic="1234567890"
        )
        self.category = Category.objects.create(name="Test Category")
        self.product1 = Product.objects.create(
            name="Test Product 1",
            price_with_vat=10.0,
            price_without_vat=11.2,
            inventory_count=0,
            measurement_of_quantity=2,
            tax_rate=0.12,
            category=self.category,
            average_price=0.0
        )
        self.product2 = Product.objects.create(
            name="Test Product 2",
            price_with_vat=20.0,
            price_without_vat=22.4,
            inventory_count=0,
            measurement_of_quantity=2,
            tax_rate=0.12,
            category=self.category,
            average_price=0.0
        )
        self.stock_import_data = {
            "supplier": self.supplier.id,
            "invoice_pdf": SimpleUploadedFile(
                "test_invoice.pdf", b"file_content", content_type="application/pdf"
            ),
            "products": [
                {
                    "product_id": self.product1.id,
                    "quantity": 10,
                    "price_with_vat": 10.0,
                    "import_price": 8.0
                },
                {
                    "product_id": self.product2.id,
                    "quantity": 20,
                    "price_with_vat": 22.4,
                    "import_price": 18.0
                },
            ],
        }

    def test_create_stock_import_with_valid_data(self):
        self.client.force_authenticate(user=self.admin_user)
        data = {
            "supplier": self.stock_import_data["supplier"],
            "invoice_pdf": self.stock_import_data["invoice_pdf"],
            "products[0].product_id": self.stock_import_data["products"][0]["product_id"],
            "products[0].quantity": self.stock_import_data["products"][0]["quantity"],
            "products[0].price_with_vat": self.stock_import_data["products"][0]["price_with_vat"],
            "products[0].import_price": self.stock_import_data["products"][0]["import_price"],
            "products[1].product_id": self.stock_import_data["products"][1]["product_id"],
            "products[1].quantity": self.stock_import_data["products"][1]["quantity"],
            "products[1].price_with_vat": self.stock_import_data["products"][1]["price_with_vat"],
            "products[1].import_price": self.stock_import_data["products"][1]["import_price"],
        }
        response = self.client.post(
            reverse("stock-import-list"), data, format="multipart"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(StockImport.objects.count(), 1)
        stock_import = StockImport.objects.first()
        self.assertEqual(stock_import.supplier, self.supplier)
        self.assertEqual(stock_import.stock_entries.count(), 2)
        stock_import.delete()

    def test_create_stock_import_missing_required_fields(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(reverse("stock-import-list"), {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(StockImport.objects.count(), 0)

    def test_create_stock_import_with_invalid_supplier_id(self):
        self.client.force_authenticate(user=self.admin_user)
        self.stock_import_data["supplier"] = 9999
        response = self.client.post(reverse("stock-import-list"), self.stock_import_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(StockImport.objects.count(), 0)

    def test_create_stock_import_with_invalid_product_id(self):
        self.client.force_authenticate(user=self.admin_user)
        self.stock_import_data["products"][0]["product_id"] = 9999
        response = self.client.post(reverse("stock-import-list"), self.stock_import_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(StockImport.objects.count(), 0)

    def test_retrieve_stock_import_by_valid_id(self):
        self.client.force_authenticate(user=self.admin_user)
        stock_import = StockImport.objects.create(supplier=self.supplier)
        response = self.client.get(reverse("stock-import-detail", args=[stock_import.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], stock_import.id)
        stock_import.delete()

    def test_retrieve_stock_import_by_invalid_id(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(reverse("stock-import-detail", args=[9999]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_ma_user_create_stock_import(self):
        self.client.force_authenticate(user=self.ma_user)
        data = {
            "supplier": self.stock_import_data["supplier"],
            "invoice_pdf": self.stock_import_data["invoice_pdf"],
            "products[0].product_id": self.stock_import_data["products"][0]["product_id"],
            "products[0].quantity": self.stock_import_data["products"][0]["quantity"],
            "products[0].price_with_vat": self.stock_import_data["products"][0]["price_with_vat"],
            "products[0].import_price": self.stock_import_data["products"][0]["import_price"],
            "products[1].product_id": self.stock_import_data["products"][1]["product_id"],
            "products[1].quantity": self.stock_import_data["products"][1]["quantity"],
            "products[1].price_with_vat": self.stock_import_data["products"][1]["price_with_vat"],
            "products[1].import_price": self.stock_import_data["products"][1]["import_price"],
        }
        response = self.client.post(
            reverse("stock-import-list"), data, format="multipart"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(StockImport.objects.count(), 1)

    def test_ma_user_retrieve_stock_import(self):
        stock_import = StockImport.objects.create(supplier=self.supplier)
        self.client.force_authenticate(user=self.ma_user)
        response = self.client.get(reverse("stock-import-detail", args=[stock_import.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], stock_import.id)
        stock_import.delete()

    def test_create_stock_import_with_non_existent_supplier(self):
        self.client.force_authenticate(user=self.admin_user)
        self.stock_import_data["supplier"] = 9999
        response = self.client.post(reverse("stock-import-list"), self.stock_import_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(StockImport.objects.count(), 0)

    def test_create_stock_import_with_non_existent_product(self):
        self.client.force_authenticate(user=self.admin_user)
        self.stock_import_data["products"][0]["product_id"] = 9999
        response = self.client.post(reverse("stock-import-list"), self.stock_import_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(StockImport.objects.count(), 0)

    def test_create_stock_import_with_negative_quantity(self):
        self.client.force_authenticate(user=self.admin_user)
        self.stock_import_data["products"][0]["quantity"] = -10
        response = self.client.post(reverse("stock-import-list"), self.stock_import_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(StockImport.objects.count(), 0)

    def test_create_stock_import_with_zero_quantity(self):
        self.client.force_authenticate(user=self.admin_user)
        self.stock_import_data["products"][0]["quantity"] = 0
        response = self.client.post(reverse("stock-import-list"), self.stock_import_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(StockImport.objects.count(), 0)

    def test_create_stock_import_with_duplicate_product(self):
        self.client.force_authenticate(user=self.admin_user)
        self.stock_import_data["products"].append(
            {"product_id": self.product1.id, "quantity": 5, "price_with_vat": 10.0, "import_price": 8.0}
        )
        response = self.client.post(reverse("stock-import-list"), self.stock_import_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(StockImport.objects.count(), 0)

    def test_create_stock_import_with_invalid_invoice_pdf(self):
        self.client.force_authenticate(user=self.admin_user)
        self.stock_import_data["invoice_pdf"] = SimpleUploadedFile(
            "test_invoice.txt", b"file_content", content_type="text/plain"
        )
        response = self.client.post(reverse("stock-import-list"), self.stock_import_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(StockImport.objects.count(), 0)

    def test_create_stock_import_with_missing_invoice_pdf(self):
        self.client.force_authenticate(user=self.admin_user)
        del self.stock_import_data["invoice_pdf"]
        response = self.client.post(reverse("stock-import-list"), self.stock_import_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(StockImport.objects.count(), 0)

    def test_create_stock_import_with_empty_products_list(self):
        self.client.force_authenticate(user=self.admin_user)
        self.stock_import_data["products"] = []
        response = self.client.post(reverse("stock-import-list"), self.stock_import_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(StockImport.objects.count(), 0)

    def test_create_stock_import_with_missing_products_field(self):
        self.client.force_authenticate(user=self.admin_user)
        del self.stock_import_data["products"]
        response = self.client.post(reverse("stock-import-list"), self.stock_import_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(StockImport.objects.count(), 0)

    def test_create_stock_import_with_invalid_product_data(self):
        self.client.force_authenticate(user=self.admin_user)
        self.stock_import_data["products"][0] = {"invalid_field": "invalid_value"}
        response = self.client.post(reverse("stock-import-list"), self.stock_import_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(StockImport.objects.count(), 0)

    def test_retrieve_stock_import_with_unauthenticated_user(self):
        stock_import = StockImport.objects.create(supplier=self.supplier)
        response = self.client.get(reverse("stock-import-detail", args=[stock_import.id]))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        stock_import.delete()

    def test_list_stock_imports_with_admin_user(self):
        self.client.force_authenticate(user=self.admin_user)
        StockImport.objects.create(supplier=self.supplier)
        StockImport.objects.create(supplier=self.supplier)
        response = self.client.get(reverse("stock-import-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 2)
        StockImport.objects.all().delete()

    def test_list_stock_imports_with_ma_user(self):
        self.client.force_authenticate(user=self.ma_user)
        StockImport.objects.create(supplier=self.supplier)
        StockImport.objects.create(supplier=self.supplier)
        response = self.client.get(reverse("stock-import-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 2)
        StockImport.objects.all().delete()

    def test_list_stock_imports_with_unauthenticated_user(self):
        StockImport.objects.create(supplier=self.supplier)
        StockImport.objects.create(supplier=self.supplier)
        response = self.client.get(reverse("stock-import-list"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        StockImport.objects.all().delete()

    def test_create_stock_import_with_valid_ico_missing_supplier(self):
        self.client.force_authenticate(user=self.admin_user)
        data = {
            "ico": "12345678",
            "invoice_pdf": self.stock_import_data["invoice_pdf"],
            "products[0].product_id": self.stock_import_data["products"][0]["product_id"],
            "products[0].quantity": self.stock_import_data["products"][0]["quantity"],
            "products[0].price_with_vat": self.stock_import_data["products"][0]["price_with_vat"],
            "products[0].import_price": self.stock_import_data["products"][0]["import_price"],
        }
        response = self.client.post(
            reverse("stock-import-list"), data, format="multipart"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(StockImport.objects.count(), 1)
        stock_import = StockImport.objects.first()
        self.assertEqual(stock_import.ico, "12345678")
        stock_import.delete()

    def test_create_stock_import_with_supplier_and_ico(self):
        self.client.force_authenticate(user=self.admin_user)
        data = {
            "supplier": self.stock_import_data["supplier"],
            "ico": "12345678",
            "invoice_pdf": self.stock_import_data["invoice_pdf"],
            "products[0].product_id": self.stock_import_data["products"][0]["product_id"],
            "products[0].quantity": self.stock_import_data["products"][0]["quantity"],
            "products[0].price_with_vat": self.stock_import_data["products"][0]["price_with_vat"],
            "products[0].import_price": self.stock_import_data["products"][0]["import_price"],
        }
        response = self.client.post(
            reverse("stock-import-list"), data, format="multipart"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(StockImport.objects.count(), 1)
        stock_import = StockImport.objects.first()
        self.assertEqual(stock_import.supplier, self.supplier)
        self.assertEqual(stock_import.ico, "12345678")
        stock_import.delete()

    def test_create_stock_import_missing_supplier_and_ico(self):
        self.client.force_authenticate(user=self.admin_user)
        data = {
            "invoice_pdf": self.stock_import_data["invoice_pdf"],
            "products[0].product_id": self.stock_import_data["products"][0]["product_id"],
            "products[0].quantity": self.stock_import_data["products"][0]["quantity"],
            "products[0].price_with_vat": self.stock_import_data["products"][0]["price_with_vat"],
            "products[0].import_price": self.stock_import_data["products"][0]["import_price"],
        }
        response = self.client.post(
            reverse("stock-import-list"), data, format="multipart"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(StockImport.objects.count(), 0)

    def test_create_stock_import_with_note_and_invoice_number(self):
        self.client.force_authenticate(user=self.admin_user)
        data = {
            "supplier": self.stock_import_data["supplier"],
            "invoice_pdf": self.stock_import_data["invoice_pdf"],
            "products[0].product_id": self.stock_import_data["products"][0]["product_id"],
            "products[0].quantity": self.stock_import_data["products"][0]["quantity"],
            "products[0].price_with_vat": self.stock_import_data["products"][0]["price_with_vat"],
            "products[0].import_price": self.stock_import_data["products"][0]["import_price"],
            "note": "Test note",
            "invoice_number": "INV-123",
        }
        response = self.client.post(
            reverse("stock-import-list"), data, format="multipart"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(StockImport.objects.count(), 1)
        stock_import = StockImport.objects.first()
        self.assertEqual(stock_import.note, "Test note")
        self.assertEqual(stock_import.invoice_number, "INV-123")
        stock_import.delete()


class StockImportUpdateProductPricesTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = CustomUser.objects.create_superuser(
            username="admin", password="adminpassword", role="AD"
        )
        self.supplier = Supplier.objects.create(
            name="Test Supplier", ico="12345678", dic="1234567890"
        )
        self.category = Category.objects.create(name="Test Category")
        self.product = Product.objects.create(
            name="Test Product",
            price_with_vat=11.2,
            price_without_vat=10.0,
            tax_rate=0.12,
            inventory_count=0,
            measurement_of_quantity=2,
            category=self.category,
            average_price=0.0
        )
        self.stock_import_data = {
            "supplier": self.supplier.id,
            "invoice_pdf": SimpleUploadedFile(
                "test_invoice.pdf", b"file_content", content_type="application/pdf"
            ),
            "products[0].product_id": self.product.id,
            "products[0].quantity": 10,
            "products[0].price_with_vat": 22.4,
            "products[0].import_price": 20.0,
        }

    def test_create_stock_import_updates_product_prices(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            reverse("stock-import-list"), self.stock_import_data, format="multipart"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Refresh the product to get the updated prices
        self.product.refresh_from_db()

        self.assertEqual(float(self.product.price_with_vat), 22.4)
        self.assertEqual(
            float(self.product.price_without_vat), 20.0  # 22.4 / (1 + 0.12) = 20.0
        )

        # Ensure average price is updated correctly
        self.assertEqual(float(self.product.average_price), 20.0)
