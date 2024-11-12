from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.urls import reverse
from api.warehouse.models import StockMovementType, Stockentry
from api.product_catalog.models import Product, Category, Voucher
from .models import Sale, SaleItem, Payment
from authentication.models import CustomUser
from datetime import timedelta
from django.utils import timezone
import decimal


class SaleViewSetTests(APITestCase):
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
            price_with_vat=11.2,
            price_without_vat=10.0,
            tax_rate=0.12,
            inventory_count=10,
            measurement_of_quantity=2,
            category=self.category,
        )
        self.voucher = Voucher.objects.create(
            ean_code="1234567890",
            expiration_date=timezone.now() + timedelta(days=7),
            discount_type="Percentage",
            discount_amount=10.0,
            is_active=True,
            description="Test Voucher",
            title="Test Voucher",
        )
        self.sale_data = {
            "total_amount": 22.4,
            "payment": {
                "payment_type": "Cash",
            },
            "voucher_id": self.voucher.id,
        }

    def tearDown(self):
        Sale.objects.all().delete()
        SaleItem.objects.all().delete()
        Payment.objects.all().delete()
        Stockentry.objects.all().delete()
        Product.objects.all().delete()
        Category.objects.all().delete()
        Voucher.objects.all().delete()
        CustomUser.objects.all().delete()

    def create_sale_items(self, quantity):
        return [
            {
                "product_id": self.product.id,
                "quantity": quantity,
                "price": 11.2,
            }
        ]

    def assert_sale_creation_failed(self, response, exit_status_code=status.HTTP_400_BAD_REQUEST):
        self.assertEqual(response.status_code, exit_status_code)
        self.assertEqual(Sale.objects.count(), 0)
        self.assertEqual(SaleItem.objects.count(), 0)
        self.assertEqual(Payment.objects.count(), 0)
        self.assertEqual(Stockentry.objects.count(), 0)

    def test_create_sale_with_valid_data(self):
        self.client.force_authenticate(user=self.ca_user)
        self.sale_data["items"] = self.create_sale_items(2)
        self.sale_data["cashier"] = self.ca_user.id
        response = self.client.post(reverse("sale-list"), self.sale_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Sale.objects.count(), 1)
        self.assertEqual(SaleItem.objects.count(), 1)
        self.assertEqual(Payment.objects.count(), 1)
        self.assertEqual(Stockentry.objects.count(), 1)

        # Check if the product inventory count is updated
        self.product.refresh_from_db()
        self.assertEqual(self.product.inventory_count, 8)

    def test_create_sale_with_unauthenticated_user(self):
        self.sale_data["items"] = self.create_sale_items(2)
        response = self.client.post(reverse("sale-list"), self.sale_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(Sale.objects.count(), 0)
        self.assertEqual(SaleItem.objects.count(), 0)
        self.assertEqual(Payment.objects.count(), 0)
        self.assertEqual(Stockentry.objects.count(), 0)

    def test_create_sale_with_admin_user(self):
        self.client.force_authenticate(user=self.admin_user)
        self.sale_data["items"] = self.create_sale_items(2)
        self.sale_data["cashier"] = self.admin_user.id
        del self.sale_data["voucher_id"]  # Remove the voucher_id from the sale data

        response = self.client.post(reverse("sale-list"), self.sale_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Sale.objects.count(), 1)
        self.assertEqual(SaleItem.objects.count(), 1)
        self.assertEqual(Payment.objects.count(), 1)
        self.assertEqual(Stockentry.objects.count(), 1)

    def test_create_sale_with_invalid_payment_type(self):
        self.client.force_authenticate(user=self.ca_user)
        self.sale_data["payment"]["payment_type"] = "InvalidType"
        self.sale_data["items"] = self.create_sale_items(2)
        self.sale_data["cashier"] = self.ca_user.id

        response = self.client.post(reverse("sale-list"), self.sale_data, format="json")
        self.assert_sale_creation_failed(response)

    def test_create_sale_with_negative_quantity(self):
        self.client.force_authenticate(user=self.ca_user)
        self.sale_data["items"] = self.create_sale_items(-2)
        self.sale_data["cashier"] = self.ca_user.id

        response = self.client.post(reverse("sale-list"), self.sale_data, format="json")
        self.assert_sale_creation_failed(response)

    def test_create_sale_with_zero_quantity(self):
        self.client.force_authenticate(user=self.ca_user)
        self.sale_data["items"] = self.create_sale_items(0)
        self.sale_data["cashier"] = self.ca_user.id
        del self.sale_data["voucher_id"]

        response = self.client.post(reverse("sale-list"), self.sale_data, format="json")
        self.assert_sale_creation_failed(response)

    def test_create_sale_with_expired_voucher(self):
        self.client.force_authenticate(user=self.ca_user)
        expired_voucher = Voucher.objects.create(
            ean_code="9876543210",
            expiration_date=timezone.now() - timedelta(days=1),
            discount_type="Percentage",
            discount_amount=10.0,
            is_active=True,
            description="Expired Voucher",
            title="Expired Voucher",
        )
        self.sale_data["items"] = self.create_sale_items(2)
        self.sale_data["cashier"] = self.ca_user.id
        self.sale_data["voucher_id"] = expired_voucher.id

        response = self.client.post(reverse("sale-list"), self.sale_data, format="json")
        self.assert_sale_creation_failed(response)

    def test_create_sale_with_inactive_voucher(self):
        self.client.force_authenticate(user=self.ca_user)
        inactive_voucher = Voucher.objects.create(
            ean_code="9876543210",
            expiration_date=timezone.now() + timedelta(days=7),
            discount_type="Percentage",
            discount_amount=10.0,
            is_active=False,
            description="Inactive Voucher",
            title="Inactive Voucher",
        )
        self.sale_data["items"] = self.create_sale_items(2)
        self.sale_data["cashier"] = self.ca_user.id
        self.sale_data["voucher_id"] = inactive_voucher.id

        response = self.client.post(reverse("sale-list"), self.sale_data, format="json")
        self.assert_sale_creation_failed(response)

    def test_create_sale_with_non_existent_voucher(self):
        self.client.force_authenticate(user=self.ca_user)
        self.sale_data["voucher_id"] = 9999
        self.sale_data["items"] = self.create_sale_items(2)
        self.sale_data["cashier"] = self.ca_user.id

        response = self.client.post(reverse("sale-list"), self.sale_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(Sale.objects.count(), 0)
        self.assertEqual(SaleItem.objects.count(), 0)
        self.assertEqual(Payment.objects.count(), 0)
        self.assertEqual(Stockentry.objects.count(), 0)

    def retrieve_sale(self, user):
        self.client.force_authenticate(user=user)
        sale = Sale.objects.create(
            cashier=user,
            total_amount=22.4,
        )
        SaleItem.objects.create(
            sale=sale,
            product=self.product,
            quantity=2,
            price=11.2,
        )
        response = self.client.get(
            reverse("sale-detail", args=[sale.id]), format="json"
        )
        return response

    def test_retrieve_sale_with_valid_id(self):
        response = self.retrieve_sale(self.ca_user)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_sale_with_invalid_id(self):
        self.client.force_authenticate(user=self.ca_user)
        response = self.client.get(reverse("sale-detail", args=[9999]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_sale_with_unauthenticated_user(self):
        sale = Sale.objects.create(
            cashier=self.ca_user,
            total_amount=22.4,
        )
        SaleItem.objects.create(
            sale=sale,
            product=self.product,
            quantity=2,
            price=11.2,
        )
        response = self.client.get(
            reverse("sale-detail", args=[sale.id]), format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_sale_with_admin_user(self):
        response = self.retrieve_sale(self.admin_user)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_order_sales_by_date_created(self):
        self.client.force_authenticate(user=self.admin_user)
        Sale.objects.all().delete()
        sale1 = Sale.objects.create(
            cashier=self.ca_user,
            total_amount=22.4,
            date_created=timezone.now() - timedelta(days=10)
        )
        sale2 = Sale.objects.create(
            cashier=self.ca_user,
            total_amount=44.8,
            date_created=timezone.now() - timedelta(days=5)
        )
        SaleItem.objects.create(
            sale=sale1,
            product=self.product,
            quantity=2,
            price=11.2,
        )
        SaleItem.objects.create(
            sale=sale2,
            product=self.product,
            quantity=4,
            price=11.2,
        )
        response = self.client.get(
            reverse("sale-list"),
            {'ordering': 'date_created'},
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
        self.assertEqual(decimal.Decimal(response.data['results'][0]['total_amount']), decimal.Decimal('22.4'))
        self.assertEqual(decimal.Decimal(response.data['results'][1]['total_amount']), decimal.Decimal('44.8'))

    def test_order_sales_by_total_amount(self):
        self.client.force_authenticate(user=self.admin_user)
        Sale.objects.all().delete()
        sale1 = Sale.objects.create(
            cashier=self.ca_user,
            total_amount=22.4,
            date_created=timezone.now() - timedelta(days=10)
        )
        sale2 = Sale.objects.create(
            cashier=self.ca_user,
            total_amount=44.8,
            date_created=timezone.now() - timedelta(days=5)
        )
        SaleItem.objects.create(
            sale=sale1,
            product=self.product,
            quantity=2,
            price=11.2,
        )
        SaleItem.objects.create(
            sale=sale2,
            product=self.product,
            quantity=4,
            price=11.2,
        )
        response = self.client.get(
            reverse("sale-list"),
            {'ordering': 'total_amount'},
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
        self.assertEqual(decimal.Decimal(response.data['results'][0]['total_amount']), decimal.Decimal('22.4'))
        self.assertEqual(decimal.Decimal(response.data['results'][1]['total_amount']), decimal.Decimal('44.8'))

    def test_set_tip_valid(self):
        self.client.force_authenticate(user=self.ca_user)
        sale = Sale.objects.create(
            cashier=self.ca_user,
            total_amount=22.4,
        )
        response = self.client.post(reverse('sale-set-tip', args=[sale.id]), {"tip": 5.0}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        sale.refresh_from_db()
        self.assertEqual(sale.tip, decimal.Decimal('5.0'))

    def test_set_tip_invalid(self):
        self.client.force_authenticate(user=self.ca_user)
        sale = Sale.objects.create(
            cashier=self.ca_user,
            total_amount=22.4,
        )
        response = self.client.post(reverse('sale-set-tip', args=[sale.id]), {"tip": -5.0}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
