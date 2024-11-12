from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Sum, Count, F, ExpressionWrapper, DecimalField
from django.db.models.functions import TruncHour, TruncDay, TruncWeek, TruncMonth
from datetime import datetime, timedelta
from collections import defaultdict

from api.sales.models import Sale, SaleItem
from authentication.permissions import IsAdminOrManager


class SaleStatisticsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrManager]

    @staticmethod
    def get_interval_data(period, start_date, end_date):
        if period == 'daily':
            trunc_func = TruncHour
            interval_format = '%Y-%m-%d %H:00'
            delta = timedelta(hours=1)
        elif period == 'weekly':
            trunc_func = TruncDay
            interval_format = '%Y-%m-%d'
            delta = timedelta(days=1)
        elif period == 'monthly':
            trunc_func = TruncWeek
            interval_format = '%Y-%m-%d'
            delta = timedelta(days=7)
        elif period == 'yearly':
            trunc_func = TruncMonth
            interval_format = '%Y-%m'
            delta = timedelta(days=32)
        else:
            raise ValueError("Invalid period specified")

        all_data = SaleItem.objects.filter(
            sale__date_created__gte=start_date,
            sale__date_created__lte=end_date
        ).annotate(
            interval=trunc_func('sale__date_created')
        ).values('interval', 'product__tax_rate').annotate(
            total_sales=Sum('price'),
            total_quantity=Sum('quantity'),
            transaction_count=Count('sale', distinct=True),
            vat_amount=Sum(ExpressionWrapper(
                F('price') * F('quantity') * F('product__tax_rate') / (1 + F('product__tax_rate')),
                output_field=DecimalField()
            ))
        ).order_by('interval', 'product__tax_rate')

        grouped_data = defaultdict(list)
        for item in all_data:
            interval_start = item['interval']
            if period == 'yearly':
                interval_end = (interval_start + delta).replace(day=1) - timedelta(days=1)
            else:
                interval_end = interval_start + delta - timedelta(seconds=1)

            interval_range = f"{interval_start.strftime(interval_format)} - {interval_end.strftime(interval_format)}"

            grouped_data[interval_range].append({
                'product__tax_rate': item['product__tax_rate'],
                'total_sales': item['total_sales'],
                'total_quantity': item['total_quantity'],
                'transaction_count': item['transaction_count'],
                'vat_amount': item['vat_amount']
            })

        table_interval_data = [
            {
                'interval_range': interval_range,
                'tax_rate_data': tax_rate_data
            }
            for interval_range, tax_rate_data in grouped_data.items()
        ]

        table_interval_data.sort(key=lambda x: x['interval_range'])

        return table_interval_data

    @staticmethod
    def get(request, period=None):
        now = timezone.now()
        end_date = now

        if period:
            if period == 'daily':
                start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
                end_date = now.replace(hour=23, minute=59, second=59, microsecond=999999)
                prev_start_date = start_date - timedelta(days=1)
                prev_end_date = end_date - timedelta(days=1)
            elif period == 'weekly':
                start_date = now - timedelta(days=now.weekday())
                start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
                end_date = start_date + timedelta(days=6, hours=23, minutes=59, seconds=59, microseconds=999999)
                prev_start_date = start_date - timedelta(weeks=1)
                prev_end_date = end_date - timedelta(weeks=1)
            elif period == 'monthly':
                start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                next_month = start_date + timedelta(days=32)
                end_date = next_month.replace(day=1) - timedelta(seconds=1)
                prev_start_date = (start_date - timedelta(days=1)).replace(day=1)
                prev_end_date = start_date - timedelta(seconds=1)
            elif period == 'yearly':
                start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
                end_date = start_date.replace(month=12, day=31, hour=23, minute=59, second=59, microsecond=999999)
                prev_start_date = start_date.replace(year=start_date.year - 1)
                prev_end_date = end_date.replace(year=end_date.year - 1)
            else:
                return Response({"error": "Invalid period specified."}, status=400)
        else:
            start_date_str = request.query_params.get('start_date')
            end_date_str = request.query_params.get('end_date', now.strftime('%Y-%m-%d'))

            if start_date_str:
                try:
                    start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
                except ValueError:
                    return Response({"error": "Invalid start_date format. Use YYYY-MM-DD."}, status=400)

                try:
                    end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
                except ValueError:
                    return Response({"error": "Invalid end_date format. Use YYYY-MM-DD."}, status=400)
            else:
                return Response({"error": "start_date is required for custom date range."}, status=400)

            prev_start_date = start_date - (end_date - start_date)
            prev_end_date = start_date

        sales = Sale.objects.filter(date_created__gte=start_date, date_created__lte=end_date)
        prev_sales = Sale.objects.filter(date_created__gte=prev_start_date, date_created__lte=prev_end_date)

        total_sales = sales.aggregate(total=Sum('total_amount'))['total'] or 0
        prev_total_sales = prev_sales.aggregate(total=Sum('total_amount'))['total'] or 0

        transaction_count = sales.count()
        prev_transaction_count = prev_sales.count()

        vat_expression = ExpressionWrapper(
            F('price') * F('quantity') * F('product__tax_rate') / (1 + F('product__tax_rate')),
            output_field=DecimalField()
        )

        total_vat_amount = SaleItem.objects.filter(sale__in=sales).aggregate(total_vat=Sum(vat_expression))[
                               'total_vat'] or 0
        total_sales_without_vat = total_sales - total_vat_amount
        prev_total_vat_amount = SaleItem.objects.filter(sale__in=prev_sales).aggregate(total_vat=Sum(vat_expression))[
                                    'total_vat'] or 0
        prev_total_sales_without_vat = prev_total_sales - prev_total_vat_amount

        average_transaction_value = total_sales / transaction_count if transaction_count > 0 else 0
        prev_average_transaction_value = prev_total_sales / prev_transaction_count if prev_transaction_count > 0 else 0

        top_selling_products = SaleItem.objects.filter(sale__in=sales) \
                                   .values('product__name') \
                                   .annotate(total_quantity=Sum('quantity')) \
                                   .order_by('-total_quantity')[:5]

        sales_by_category = SaleItem.objects.filter(sale__in=sales) \
            .values('product__category__name') \
            .annotate(total_sales=Sum('price')) \
            .order_by('-total_sales')

        sales_by_tax_rate = SaleItem.objects.filter(sale__in=sales) \
            .values('product__tax_rate') \
            .annotate(
            total_sales=Sum('price'),
            total_quantity=Sum('quantity'),
            transaction_count=Count('sale'),
        ).order_by('product__tax_rate')

        if period:
            interval_data = SaleStatisticsView.get_interval_data(period, start_date, end_date)
        else:
            # For custom date ranges, use daily intervals
            interval_data = SaleStatisticsView.get_interval_data('daily', start_date, end_date)

        return Response({
            "period": period or "custom",
            "start_date": start_date.strftime('%Y-%m-%d'),
            "end_date": end_date.strftime('%Y-%m-%d'),
            "total_sales": total_sales,
            "total_vat_amount": total_vat_amount,
            "total_sales_without_vat": total_sales_without_vat,
            "transaction_count": transaction_count,
            "average_transaction_value": average_transaction_value,
            "prev_total_sales": prev_total_sales,
            "prev_total_vat_amount": prev_total_vat_amount,
            "prev_total_sales_without_vat": prev_total_sales_without_vat,
            "prev_transaction_count": prev_transaction_count,
            "prev_average_transaction_value": prev_average_transaction_value,
            "top_selling_products": list(top_selling_products),
            "sales_by_category": list(sales_by_category),
            "sales_by_tax_rate": list(sales_by_tax_rate),
            "interval_data": interval_data,
        })
