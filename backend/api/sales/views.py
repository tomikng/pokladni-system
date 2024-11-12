from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters import rest_framework as filters
from django.utils import timezone
from .models import Sale, Payment
from .serializers import SaleSerializer, TipSerializer
from .filters import SaleFilter
from ..product_catalog.models import Voucher
from api.common.pagination import CustomPageNumberPagination
from authentication.permissions import IsAdminOrManagerOrCashier


class SaleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Sale instances.

    This ViewSet provides CRUD operations for Sales, with custom behavior for
    creation and setting tips. It includes filtering, ordering, and pagination.
    """

    queryset = Sale.objects.order_by("-date_created")
    serializer_class = SaleSerializer
    pagination_class = CustomPageNumberPagination
    filter_backends = (filters.DjangoFilterBackend, OrderingFilter)
    filterset_class = SaleFilter
    ordering_fields = ['date_created', 'total_amount']
    permission_classes = [IsAuthenticated, IsAdminOrManagerOrCashier]

    def create(self, request, *args, **kwargs):
        """
        Create a new Sale instance.

        This method overrides the default create method to add custom validation
        for vouchers, payment types, and item quantities.

        Args:
            request (Request): The HTTP request object.
            *args: Variable length argument list.
            **kwargs: Arbitrary keyword arguments.

        Returns:
            Response: HTTP response with created sale data or error messages.
        """
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            items_data = request.data.get("items", [])
            voucher_id = request.data.get("voucher_id")
            payment_data = request.data.get("payment")

            # Check if the payment type is valid
            if payment_data:
                payment_type = payment_data.get("payment_type")
                if payment_type not in [pt[0] for pt in Payment.PaymentTypes.choices]:
                    return Response({"error": "Invalid payment type"}, status=status.HTTP_400_BAD_REQUEST)

            # Check if the voucher exists and is valid
            if voucher_id:
                try:
                    voucher = Voucher.objects.get(id=voucher_id)
                    if not voucher.is_active:
                        return Response({"error": "Inactive voucher"}, status=status.HTTP_400_BAD_REQUEST)
                    if voucher.expiration_date < timezone.now():
                        return Response({"error": "Expired voucher"}, status=status.HTTP_400_BAD_REQUEST)
                except Voucher.DoesNotExist:
                    return Response({"error": "Nonexistent voucher"}, status=status.HTTP_404_NOT_FOUND)

            # Check if any sale item has a negative quantity
            for item_data in items_data:
                quantity = item_data["quantity"]
                if quantity <= 0:
                    return Response({"error": "Negative quantity"}, status=status.HTTP_400_BAD_REQUEST)

            # If all checks pass, save the sale
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def set_tip(self, request, pk=None):
        """
        Set a tip for a specific sale.

        This method allows setting or updating the tip amount for a sale.

        Args:
            request (Request): The HTTP request object.
            pk (int): The primary key of the Sale instance.

        Returns:
            Response: HTTP response indicating success or error.
        """
        sale = self.get_object()
        serializer = TipSerializer(data=request.data)
        if serializer.is_valid():
            sale.tip = serializer.validated_data['tip']
            sale.save()
            return Response({"status": "tip set"}, status=status.HTTP_200_OK)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
