from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from api.product_catalog.models import Category, Product
from .models import Invoice, SelectedProduct
from authentication.models import CustomUser
from decimal import Decimal


class InvoiceViewSetTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = CustomUser.objects.create_superuser(
            username="admin", password="adminpassword", role="AD", email="admin@example.com"
        )
        self.ca_user = CustomUser.objects.create_user(
            username="ca_user", password="capassword", role="CA", email="ca_user@example.com"
        )
        self.category = Category.objects.create(name="Test Category")
        self.product1 = Product.objects.create(
            name="Product 1",
            category=self.category,
            price_with_vat=100.0,
            price_without_vat=80.0,
            inventory_count=10,
            unit="pieces",
            measurement_of_quantity=1,
            tax_rate=20.0,
        )
        self.product2 = Product.objects.create(
            name="Product 2",
            category=self.category,
            price_with_vat=50.0,
            price_without_vat=40.0,
            inventory_count=20,
            unit="pieces",
            measurement_of_quantity=1,
            tax_rate=20.0,
        )

    def test_create_invoice_with_valid_data(self):
        self.client.force_authenticate(user=self.admin_user)
        data = {
            "name": "Test Invoice",
            "selected_products": [
                {"product": self.product1.id, "quantity": 2},
                {"product": self.product2.id, "quantity": 3},
            ]
        }
        response = self.client.post(reverse('invoice-list'), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Invoice.objects.count(), 1)
        self.assertEqual(SelectedProduct.objects.count(), 2)

    def test_create_invoice_with_invalid_product(self):
        self.client.force_authenticate(user=self.admin_user)
        data = {
            "name": "Test Invoice",
            "selected_products": [
                {"product": 9999, "quantity": 2},
            ]
        }
        response = self.client.post(reverse('invoice-list'), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_invoice_with_negative_quantity(self):
        self.client.force_authenticate(user=self.admin_user)
        data = {
            "name": "Test Invoice",
            "selected_products": [
                {"product": self.product1.id, "quantity": -2},
            ]
        }
        response = self.client.post(reverse('invoice-list'), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_invoice_with_zero_quantity(self):
        self.client.force_authenticate(user=self.admin_user)
        data = {
            "name": "Test Invoice",
            "selected_products": [
                {"product": self.product1.id, "quantity": 0},
            ]
        }
        response = self.client.post(reverse('invoice-list'), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_invoice_with_no_products(self):
        self.client.force_authenticate(user=self.admin_user)
        data = {
            "name": "Test Invoice",
            "selected_products": []
        }
        response = self.client.post(reverse('invoice-list'), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_invoice_unauthenticated(self):
        data = {
            "name": "Test Invoice",
            "selected_products": [
                {"product": self.product1.id, "quantity": 2},
            ]
        }
        response = self.client.post(reverse('invoice-list'), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_invoice(self):
        self.client.force_authenticate(user=self.admin_user)
        invoice = Invoice.objects.create(name="Test Invoice")
        selected_product = SelectedProduct.objects.create(product=self.product1, quantity=2)
        invoice.selected_products.add(selected_product)

        response = self.client.get(reverse('invoice-detail', args=[invoice.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], "Test Invoice")
        self.assertEqual(len(response.data['selected_products']), 1)

    def test_partial_update_invoice(self):
        self.client.force_authenticate(user=self.admin_user)
        invoice = Invoice.objects.create(name="Test Invoice")
        selected_product = SelectedProduct.objects.create(product=self.product1, quantity=2)
        invoice.selected_products.add(selected_product)

        data = {
            "name": "Partially Updated Invoice",
        }
        response = self.client.patch(reverse('invoice-detail', args=[invoice.id]), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        invoice.refresh_from_db()
        self.assertEqual(invoice.name, "Partially Updated Invoice")
        self.assertEqual(invoice.selected_products.count(), 1)

    def test_delete_invoice(self):
        self.client.force_authenticate(user=self.admin_user)
        invoice = Invoice.objects.create(name="Test Invoice")
        selected_product = SelectedProduct.objects.create(product=self.product1, quantity=2)
        invoice.selected_products.add(selected_product)

        response = self.client.delete(reverse('invoice-detail', args=[invoice.id]))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Invoice.objects.count(), 0)
        self.assertEqual(SelectedProduct.objects.count(), 0)

    def test_list_invoices(self):
        self.client.force_authenticate(user=self.admin_user)
        Invoice.objects.create(name="Invoice 1")
        Invoice.objects.create(name="Invoice 2")

        response = self.client.get(reverse('invoice-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_create_invoice_with_decimal_quantity(self):
        self.client.force_authenticate(user=self.admin_user)
        data = {
            "name": "Test Invoice",
            "selected_products": [
                {"product": self.product1.id, "quantity": 2.5},
            ]
        }
        response = self.client.post(reverse('invoice-list'), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_invoice_with_inactive_product(self):
        self.client.force_authenticate(user=self.admin_user)
        inactive_product = Product.objects.create(
            name="Inactive Product",
            category=self.category,
            price_with_vat=75.0,
            price_without_vat=60.0,
            inventory_count=5,
            unit="pieces",
            measurement_of_quantity=1,
            tax_rate=20.0,
            is_active=False
        )
        data = {
            "name": "Test Invoice",
            "selected_products": [
                {"product": inactive_product.id, "quantity": 2},
            ]
        }
        response = self.client.post(reverse('invoice-list'), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class InvoiceModelTests(TestCase):
    def setUp(self):
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
        )

    def test_invoice_creation(self):
        invoice = Invoice.objects.create(name="Test Invoice")
        selected_product = SelectedProduct.objects.create(product=self.product, quantity=2)
        invoice.selected_products.add(selected_product)

        self.assertEqual(str(invoice), "Test Invoice")
        self.assertEqual(invoice.selected_products.count(), 1)
        self.assertEqual(invoice.selected_products.first().product, self.product)
        self.assertEqual(invoice.selected_products.first().quantity, 2)

    def test_selected_product_str_representation(self):
        selected_product = SelectedProduct.objects.create(product=self.product, quantity=2)
        self.assertEqual(str(selected_product), "Test Product (2)")

    def test_invoice_total_price(self):
        invoice = Invoice.objects.create(name="Test Invoice")
        selected_product1 = SelectedProduct.objects.create(product=self.product, quantity=2)
        invoice.selected_products.add(selected_product1)

        product2 = Product.objects.create(
            name="Product 2",
            category=self.category,
            price_with_vat=50.0,
            price_without_vat=40.0,
            inventory_count=20,
            unit="pieces",
            measurement_of_quantity=1,
            tax_rate=20.0,
        )
        selected_product2 = SelectedProduct.objects.create(product=product2, quantity=3)
        invoice.selected_products.add(selected_product2)

        expected_total = (2 * 100.0) + (3 * 50.0)
        self.assertEqual(invoice.total_price(), Decimal(str(expected_total)))

    def test_invoice_total_price_with_no_products(self):
        invoice = Invoice.objects.create(name="Empty Invoice")
        self.assertEqual(invoice.total_price(), Decimal('0'))


class SelectedProductModelTests(TestCase):
    def setUp(self):
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
        )

    def test_selected_product_creation(self):
        selected_product = SelectedProduct.objects.create(product=self.product, quantity=2)
        self.assertEqual(selected_product.product, self.product)
        self.assertEqual(selected_product.quantity, 2)

    def test_selected_product_subtotal(self):
        selected_product = SelectedProduct.objects.create(product=self.product, quantity=2)
        expected_subtotal = 2 * 100.0
        self.assertEqual(selected_product.subtotal(), Decimal(str(expected_subtotal)))
