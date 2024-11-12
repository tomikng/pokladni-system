from decimal import Decimal

from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.urls import reverse
from django.utils import timezone
from datetime import timedelta
from api.sales.models import Sale, SaleItem
from authentication.models import CustomUser
from api.product_catalog.models import Product, Category


class SaleStatisticsViewTests(APITestCase):
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
        self.create_sales()

    def create_sales(self):
        now = timezone.now()
        sale1 = Sale.objects.create(
            cashier=self.ca_user,
            total_amount=22.4,
            date_created=now - timedelta(days=1)
        )
        sale2 = Sale.objects.create(
            cashier=self.ca_user,
            total_amount=44.8,
            date_created=now - timedelta(days=2)
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

    def test_get_daily_statistics(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(reverse('sale_statistics', args=['daily']), format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_sales', response.data)
        self.assertIn('transaction_count', response.data)
        self.assertIn('average_transaction_value', response.data)

    def test_get_weekly_statistics(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(reverse('sale_statistics', args=['weekly']), format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_sales', response.data)
        self.assertIn('transaction_count', response.data)
        self.assertIn('average_transaction_value', response.data)

    def test_get_monthly_statistics(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(reverse('sale_statistics', args=['monthly']), format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_sales', response.data)
        self.assertIn('transaction_count', response.data)
        self.assertIn('average_transaction_value', response.data)

    def test_get_yearly_statistics(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(reverse('sale_statistics', args=['yearly']), format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_sales', response.data)
        self.assertIn('transaction_count', response.data)
        self.assertIn('average_transaction_value', response.data)

    def test_get_custom_date_range_statistics(self):
        self.client.force_authenticate(user=self.admin_user)
        now = timezone.now()
        start_date = (now - timedelta(days=3)).strftime('%Y-%m-%d')
        end_date = now.strftime('%Y-%m-%d')
        response = self.client.get(reverse('custom_sale_statistics'), {'start_date': start_date, 'end_date': end_date},
                                   format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_sales', response.data)
        self.assertIn('transaction_count', response.data)
        self.assertIn('average_transaction_value', response.data)

    def test_get_statistics_with_invalid_period(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(reverse('sale_statistics', args=['invalid']), format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    def test_get_statistics_with_invalid_date_format(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(reverse('custom_sale_statistics'), {'start_date': 'invalid-date'}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    def test_get_statistics_with_unauthenticated_user(self):
        response = self.client.get(reverse('sale_statistics', args=['daily']), format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_statistics_no_sales_data(self):
        self.client.force_authenticate(user=self.admin_user)
        Sale.objects.all().delete()  # Ensure there are no sales
        response = self.client.get(reverse('sale_statistics', args=['daily']), format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_sales'], 0)
        self.assertEqual(response.data['transaction_count'], 0)
        self.assertEqual(response.data['average_transaction_value'], 0)

    def test_get_statistics_with_large_volume_of_data(self):
        self.client.force_authenticate(user=self.admin_user)
        now = timezone.now()
        for i in range(1000):
            sale = Sale.objects.create(
                cashier=self.ca_user,
                total_amount=22.4,
                date_created=now - timedelta(days=i)
            )
            SaleItem.objects.create(
                sale=sale,
                product=self.product,
                quantity=2,
                price=11.2,
            )
        response = self.client.get(reverse('sale_statistics', args=['yearly']), format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(response.data['total_sales'], 0)
        self.assertGreater(response.data['transaction_count'], 0)

    def test_get_statistics_with_boundary_dates(self):
        self.client.force_authenticate(user=self.admin_user)
        now = timezone.now()
        start_date = now.strftime('%Y-%m-%d')
        end_date = (now + timedelta(days=1)).strftime('%Y-%m-%d')
        response = self.client.get(reverse('custom_sale_statistics'), {'start_date': start_date, 'end_date': end_date},
                                   format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_sales', response.data)
        self.assertIn('transaction_count', response.data)
        self.assertIn('average_transaction_value', response.data)

    def test_get_statistics_with_future_dates(self):
        self.client.force_authenticate(user=self.admin_user)
        now = timezone.now()
        start_date = (now + timedelta(days=1)).strftime('%Y-%m-%d')
        end_date = (now + timedelta(days=2)).strftime('%Y-%m-%d')
        response = self.client.get(reverse('custom_sale_statistics'), {'start_date': start_date, 'end_date': end_date},
                                   format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_sales'], 0)
        self.assertEqual(response.data['transaction_count'], 0)
        self.assertEqual(response.data['average_transaction_value'], 0)

    def test_get_statistics_with_combined_filters(self):
        self.client.force_authenticate(user=self.admin_user)
        now = timezone.now()
        start_date = (now - timedelta(days=10)).strftime('%Y-%m-%d')
        end_date = now.strftime('%Y-%m-%d')
        response = self.client.get(reverse('sale_statistics', args=['weekly']),
                                   {'start_date': start_date, 'end_date': end_date}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_sales', response.data)
        self.assertIn('transaction_count', response.data)
        self.assertIn('average_transaction_value', response.data)

    def test_get_statistics_vat_calculation_edge_case(self):
        self.client.force_authenticate(user=self.admin_user)
        high_tax_product = Product.objects.create(
            name="High Tax Product",
            price_with_vat=112.0,
            price_without_vat=100.0,
            tax_rate=1.12,  # 112% VAT
            inventory_count=10,
            measurement_of_quantity=2,
            category=self.category,
        )
        sale = Sale.objects.create(
            cashier=self.ca_user,
            total_amount=112.0,
            date_created=timezone.now()
        )
        SaleItem.objects.create(
            sale=sale,
            product=high_tax_product,
            quantity=1,
            price=112.0,
        )
        response = self.client.get(reverse('sale_statistics', args=['daily']), format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_sales', response.data)
        self.assertIn('total_vat_amount', response.data)
        self.assertGreater(response.data['total_sales_without_vat'], 0)

    def test_interval_data_structure(self):
        self.client.force_authenticate(user=self.admin_user)
        for period in ['daily', 'weekly', 'monthly', 'yearly']:
            response = self.client.get(reverse('sale_statistics', args=[period]), format="json")
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertIn('interval_data', response.data)
            self.assertTrue(len(response.data['interval_data']) > 0)
            interval_item = response.data['interval_data'][0]
            self.assertIn('interval_range', interval_item)
            self.assertIn('tax_rate_data', interval_item)
            self.assertTrue(len(interval_item['tax_rate_data']) > 0)
            tax_rate_item = interval_item['tax_rate_data'][0]
            self.assertIn('product__tax_rate', tax_rate_item)
            self.assertIn('total_sales', tax_rate_item)
            self.assertIn('total_quantity', tax_rate_item)
            self.assertIn('transaction_count', tax_rate_item)
            self.assertIn('vat_amount', tax_rate_item)

    def test_multiple_tax_rates_in_interval_data(self):
        # Create a product with a different tax rate
        different_tax_product = Product.objects.create(
            name="Different Tax Product",
            price_with_vat=110.0,
            price_without_vat=100.0,
            tax_rate=0.10,
            inventory_count=10,
            measurement_of_quantity=2,
            category=self.category,
        )

        # Create sales for both products
        now = timezone.now()
        for _ in range(3):
            sale = Sale.objects.create(
                cashier=self.ca_user,
                total_amount=121.2,
                date_created=now - timedelta(days=_)
            )
            SaleItem.objects.create(sale=sale, product=self.product, quantity=1, price=11.2)
            SaleItem.objects.create(sale=sale, product=different_tax_product, quantity=1, price=110.0)

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(reverse('sale_statistics', args=['weekly']), format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        for interval in response.data['interval_data']:
            tax_rates = [item['product__tax_rate'] for item in interval['tax_rate_data']]
            self.assertIn(Decimal('0.12'), tax_rates)
            self.assertIn(Decimal('0.10'), tax_rates)

    def test_detailed_calculations(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(reverse('sale_statistics', args=['monthly']), format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Calculate expected values
        sales = Sale.objects.filter(date_created__gte=timezone.now() - timedelta(days=30))
        expected_total_sales = sum(sale.total_amount for sale in sales)
        expected_transaction_count = sales.count()
        expected_average_transaction_value = expected_total_sales / expected_transaction_count if expected_transaction_count > 0 else 0

        self.assertAlmostEqual(Decimal(response.data['total_sales']), expected_total_sales, places=2)
        self.assertEqual(response.data['transaction_count'], expected_transaction_count)
        self.assertAlmostEqual(Decimal(response.data['average_transaction_value']), expected_average_transaction_value,
                               places=2)

    def test_custom_date_range_data(self):
        self.client.force_authenticate(user=self.admin_user)
        start_date = (timezone.now() - timedelta(days=5)).strftime('%Y-%m-%d')
        end_date = timezone.now().strftime('%Y-%m-%d')
        response = self.client.get(reverse('custom_sale_statistics'), {'start_date': start_date, 'end_date': end_date},
                                   format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check if all sales are within the specified date range
        sales = Sale.objects.filter(date_created__gte=start_date, date_created__lte=end_date)
        self.assertEqual(response.data['transaction_count'], sales.count())

    def test_previous_period_comparisons(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(reverse('sale_statistics', args=['weekly']), format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('prev_total_sales', response.data)
        self.assertIn('prev_transaction_count', response.data)
        self.assertIn('prev_average_transaction_value', response.data)

    def test_top_selling_products(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(reverse('sale_statistics', args=['monthly']), format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('top_selling_products', response.data)
        self.assertTrue(len(response.data['top_selling_products']) <= 5)  # Should return at most 5 products
        if len(response.data['top_selling_products']) > 0:
            self.assertIn('product__name', response.data['top_selling_products'][0])
            self.assertIn('total_quantity', response.data['top_selling_products'][0])

    def test_sales_by_category(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(reverse('sale_statistics', args=['monthly']), format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('sales_by_category', response.data)
        if len(response.data['sales_by_category']) > 0:
            self.assertIn('product__category__name', response.data['sales_by_category'][0])
            self.assertIn('total_sales', response.data['sales_by_category'][0])

    def test_sales_by_tax_rate(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(reverse('sale_statistics', args=['monthly']), format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('sales_by_tax_rate', response.data)
        if len(response.data['sales_by_tax_rate']) > 0:
            self.assertIn('product__tax_rate', response.data['sales_by_tax_rate'][0])
            self.assertIn('total_sales', response.data['sales_by_tax_rate'][0])
            self.assertIn('total_quantity', response.data['sales_by_tax_rate'][0])
            self.assertIn('transaction_count', response.data['sales_by_tax_rate'][0])

    def test_interval_data_completeness(self):
        self.client.force_authenticate(user=self.admin_user)
        for period in ['daily', 'weekly', 'monthly', 'yearly']:
            response = self.client.get(reverse('sale_statistics', args=[period]), format="json")
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertIn('interval_data', response.data)

            # Check that each interval has data for all tax rates
            tax_rates = set(item['product__tax_rate'] for interval in response.data['interval_data'] for item in
                            interval['tax_rate_data'])
            for interval in response.data['interval_data']:
                interval_tax_rates = set(item['product__tax_rate'] for item in interval['tax_rate_data'])
                self.assertEqual(tax_rates, interval_tax_rates, f"Mismatch in tax rates for {period} period")

    def test_interval_data_sorting(self):
        self.client.force_authenticate(user=self.admin_user)
        for period in ['daily', 'weekly', 'monthly', 'yearly']:
            response = self.client.get(reverse('sale_statistics', args=[period]), format="json")
            self.assertEqual(response.status_code, status.HTTP_200_OK)

            intervals = [interval['interval_range'] for interval in response.data['interval_data']]
            self.assertEqual(intervals, sorted(intervals), f"Intervals not sorted for {period} period")

            for interval in response.data['interval_data']:
                tax_rates = [item['product__tax_rate'] for item in interval['tax_rate_data']]
                self.assertEqual(tax_rates, sorted(tax_rates), f"Tax rates not sorted for {period} period")

    def test_empty_intervals(self):
        # Delete all sales
        Sale.objects.all().delete()

        self.client.force_authenticate(user=self.admin_user)
        for period in ['daily', 'weekly', 'monthly', 'yearly']:
            response = self.client.get(reverse('sale_statistics', args=[period]), format="json")
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(len(response.data['interval_data']), 0,
                             f"Interval data not empty for {period} period with no sales")

    def test_interval_data_precision(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(reverse('sale_statistics', args=['monthly']), format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        for interval in response.data['interval_data']:
            for tax_rate_data in interval['tax_rate_data']:
                self.assertIsInstance(tax_rate_data['total_sales'], Decimal)
                self.assertIsInstance(tax_rate_data['vat_amount'], Decimal)
                # Check that there are no more than 2 decimal places
                self.assertEqual(tax_rate_data['total_sales'], round(tax_rate_data['total_sales'], 2))
                self.assertEqual(tax_rate_data['vat_amount'], round(tax_rate_data['vat_amount'], 2))
