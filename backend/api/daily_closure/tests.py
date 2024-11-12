from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.urls import reverse

from api.daily_closure.models import DailySummary, Withdrawal
from api.product_catalog.models import Category, Product, Voucher
from api.sales.models import Sale, Payment
from authentication.models import CustomUser
from datetime import datetime, timedelta
from django.utils import timezone
import decimal


class DailySummaryViewSetTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = CustomUser.objects.create_superuser(
            username="admin", password="adminpassword", role="AD", email="admin@example.com"
        )
        self.cashier_user = CustomUser.objects.create_user(
            username="cashier", password="cashierpassword", role="CA", email="cashier@example.com"
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

    def tearDown(self):
        DailySummary.objects.all().delete()
        Sale.objects.all().delete()
        Payment.objects.all().delete()
        Withdrawal.objects.all().delete()
        Product.objects.all().delete()
        Category.objects.all().delete()
        Voucher.objects.all().delete()
        CustomUser.objects.all().delete()

    def create_sales_and_payments(self, future=False):
        date = timezone.now()
        if future:
            date += timedelta(days=1)
        sale1 = Sale.objects.create(
            cashier=self.cashier_user,
            total_amount=22.4,
            tip=2.0,
            date_created=date
        )
        Payment.objects.create(
            sale_id=sale1,
            payment_type="Cash"
        )
        sale2 = Sale.objects.create(
            cashier=self.cashier_user,
            total_amount=33.6,
            tip=3.0,
            date_created=date
        )
        Payment.objects.create(
            sale_id=sale2,
            payment_type="Card"
        )

    def test_calculate_daily_summary_with_previous_closing_cash(self):
        self.client.force_authenticate(user=self.cashier_user)

        # Create a previous day's summary
        DailySummary.objects.create(
            cashier=self.cashier_user,
            date=timezone.now().date() - timedelta(days=1),
            total_sales=100,
            total_cash=100,
            total_card=100,
            total_tips=10,
            cash_difference=0,
            closing_cash=20
        )

        self.create_sales_and_payments()
        Withdrawal.objects.create(cashier=self.cashier_user, amount=20, note="Owner took cash")

        response = self.client.post(reverse("dailysummary-calculate-daily-summary"), {"actual_cash": "70.00"},
                                    format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(DailySummary.objects.count(), 2)
        summary = DailySummary.objects.filter(date=timezone.now().date()).first()
        self.assertEqual(summary.total_sales, decimal.Decimal('56.0'))
        self.assertEqual(summary.total_cash, decimal.Decimal('22.4'))
        self.assertEqual(summary.total_card, decimal.Decimal('33.6'))
        self.assertEqual(summary.total_tips, decimal.Decimal('5.0'))
        self.assertEqual(summary.cash_difference, decimal.Decimal('42.6'))  # 70 - (20 + 22.4 + 5 - 20)

    def test_calculate_daily_summary_no_sales(self):
        self.client.force_authenticate(user=self.cashier_user)

        response = self.client.post(reverse("dailysummary-calculate-daily-summary"), {"actual_cash": "0.00"},
                                    format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(DailySummary.objects.count(), 1)
        summary = DailySummary.objects.first()
        self.assertEqual(summary.total_sales, decimal.Decimal('0.0'))
        self.assertEqual(summary.total_cash, decimal.Decimal('0.0'))
        self.assertEqual(summary.total_card, decimal.Decimal('0.0'))
        self.assertEqual(summary.total_tips, decimal.Decimal('0.0'))
        self.assertEqual(summary.cash_difference, decimal.Decimal('0.0'))

    def test_calculate_daily_summary_invalid_cash_value(self):
        self.client.force_authenticate(user=self.cashier_user)
        self.create_sales_and_payments()

        response = self.client.post(reverse("dailysummary-calculate-daily-summary"), {"actual_cash": "invalid"},
                                    format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(DailySummary.objects.count(), 0)

    def test_calculate_daily_summary_unauthenticated(self):
        self.create_sales_and_payments()

        response = self.client.post(reverse("dailysummary-calculate-daily-summary"), {"actual_cash": "50.00"},
                                    format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(DailySummary.objects.count(), 0)

    def test_calculate_daily_summary_with_zero_actual_cash(self):
        self.client.force_authenticate(user=self.cashier_user)
        self.create_sales_and_payments()

        response = self.client.post(reverse("dailysummary-calculate-daily-summary"), {"actual_cash": "0.00"},
                                    format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        summary = DailySummary.objects.first()
        self.assertEqual(summary.cash_difference, decimal.Decimal('-27.4'))

    def test_calculate_daily_summary_with_multiple_payment_types(self):
        self.client.force_authenticate(user=self.cashier_user)
        sale1 = Sale.objects.create(
            cashier=self.cashier_user,
            total_amount=22.4,
            tip=2.0,
            date_created=timezone.now()
        )
        Payment.objects.create(
            sale_id=sale1,
            payment_type="Cash"
        )
        Payment.objects.create(
            sale_id=sale1,
            payment_type="Card"
        )

        response = self.client.post(reverse("dailysummary-calculate-daily-summary"), {"actual_cash": "24.4"},
                                    format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        summary = DailySummary.objects.first()
        self.assertEqual(summary.total_sales, decimal.Decimal('22.4'))
        self.assertEqual(summary.total_cash, decimal.Decimal('22.4'))
        self.assertEqual(summary.total_card, decimal.Decimal('22.4'))
        self.assertEqual(summary.total_tips, decimal.Decimal('2.0'))
        self.assertEqual(summary.cash_difference, decimal.Decimal('0.0'))

    def test_list_daily_summaries(self):
        self.client.force_authenticate(user=self.admin_user)
        self.create_sales_and_payments()
        self.client.post(reverse("dailysummary-calculate-daily-summary"), {"actual_cash": "50.00"}, format="json")

        response = self.client.get(reverse("dailysummary-list-daily-summaries"), format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_list_daily_summaries_unauthenticated(self):
        response = self.client.get(reverse("dailysummary-list-daily-summaries"), format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_daily_summaries_no_summaries(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(reverse("dailysummary-list-daily-summaries"), format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)
