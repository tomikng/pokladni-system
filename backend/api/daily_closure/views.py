import decimal
from datetime import datetime

from django.db.models import Sum
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from authentication.permissions import IsAdminOrManagerOrCashier
from .models import DailySummary, Withdrawal
from .serializers import DailySummarySerializer, WithdrawalSerializer
from ..sales.models import Sale, Payment


class DailySummaryViewSet(viewsets.ViewSet):
    """
    ViewSet for managing daily summaries.

    This ViewSet provides actions for calculating and listing daily summaries.
    """

    permission_classes = [IsAuthenticated, IsAdminOrManagerOrCashier]

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def calculate_daily_summary(self, request):
        """
        Calculate and create/update the daily summary for the authenticated user.

        This action calculates various financial metrics for the day and creates
        or updates a DailySummary instance.

        Args:
            request (Request): The HTTP request object.

        Returns:
            Response: The serialized DailySummary data or an error message.
        """
        cashier = request.user
        date = datetime.today().date()
        sales = Sale.objects.filter(cashier=cashier, date_created__date=date)

        total_sales = sales.aggregate(Sum('total_amount'))['total_amount__sum'] or decimal.Decimal(0)
        total_tips = sales.aggregate(Sum('tip'))['tip__sum'] or decimal.Decimal(0)

        payments = Payment.objects.filter(sale_id__in=sales)
        total_cash = payments.filter(payment_type='Cash').aggregate(Sum('sale_id__total_amount'))[
                         'sale_id__total_amount__sum'] or decimal.Decimal(0)
        total_card = payments.filter(payment_type='Card').aggregate(Sum('sale_id__total_amount'))[
                         'sale_id__total_amount__sum'] or decimal.Decimal(0)

        actual_cash = request.data.get('actual_cash')

        try:
            actual_cash = decimal.Decimal(actual_cash)
        except (TypeError, ValueError, decimal.InvalidOperation):
            return Response({"error": "Invalid actual cash value"}, status=status.HTTP_400_BAD_REQUEST)

        previous_summary = DailySummary.objects.filter(cashier=cashier).order_by('-date').first()
        previous_closing_cash = previous_summary.closing_cash if previous_summary else decimal.Decimal(0)

        total_withdrawals = Withdrawal.objects.filter(cashier=cashier, date__date=date).aggregate(Sum('amount'))[
                                'amount__sum'] or decimal.Decimal(0)

        cash_difference = actual_cash - (previous_closing_cash + total_cash + total_tips - total_withdrawals)

        summary, created = DailySummary.objects.update_or_create(
            cashier=cashier,
            date=date,
            defaults={
                'total_sales': total_sales,
                'total_cash': total_cash,
                'total_card': total_card,
                'total_tips': total_tips,
                'cash_difference': cash_difference,
                'closing_cash': actual_cash,
                'total_withdrawals': total_withdrawals
            }
        )

        serializer = DailySummarySerializer(summary)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsAdminOrManagerOrCashier])
    def list_daily_summaries(self, request):
        """
        List all daily summaries.

        This action retrieves and serializes all DailySummary instances.

        Args:
            request (Request): The HTTP request object.

        Returns:
            Response: A list of serialized DailySummary instances.
        """
        summaries = DailySummary.objects.all()
        serializer = DailySummarySerializer(summaries, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class WithdrawalViewSet(viewsets.ViewSet):
    """
    ViewSet for managing withdrawals.

    This ViewSet provides an action for adding new withdrawals.
    """

    permission_classes = [IsAuthenticated, IsAdminOrManagerOrCashier]

    @action(detail=False, methods=['post'])
    def add_withdrawal(self, request):
        """
        Add a new withdrawal for the authenticated user.

        This action creates a new Withdrawal instance for the current user.

        Args:
            request (Request): The HTTP request object containing withdrawal data.

        Returns:
            Response: The serialized Withdrawal data if valid, or error messages if invalid.
        """
        serializer = WithdrawalSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(cashier=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
