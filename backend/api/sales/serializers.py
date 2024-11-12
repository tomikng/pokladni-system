from rest_framework import serializers
from api.warehouse.models import StockMovementType, Stockentry
from .models import Sale, SaleItem, Payment


class SaleItemSerializer(serializers.ModelSerializer):
    """
    Serializer for the SaleItem model.

    This serializer includes the product name and ID in addition to the SaleItem fields.
    """

    product_name = serializers.CharField(source='product.name', read_only=True)
    product_id = serializers.IntegerField(source='product.id', read_only=True)

    class Meta:
        model = SaleItem
        fields = ["product_id", "product_name", "quantity", "price"]


class PaymentSerializer(serializers.ModelSerializer):
    """
    Serializer for the Payment model.
    """

    class Meta:
        model = Payment
        fields = ["payment_type"]


class SaleSerializer(serializers.ModelSerializer):
    """
    Serializer for the Sale model.

    This serializer includes nested representations of sale items and payment.
    It also handles the creation of sale items, stock entries, and payment when creating a sale.
    """

    items = serializers.SerializerMethodField()
    payment = serializers.SerializerMethodField()

    class Meta:
        model = Sale
        fields = ["id", "date_created", "cashier", "total_amount", "items", "payment"]

    @staticmethod
    def get_items(obj):
        """
        Get the items associated with this sale.

        Args:
            obj (Sale): The Sale instance.

        Returns:
            list: A list of serialized SaleItem instances.
        """
        items = SaleItem.objects.filter(sale=obj)
        return SaleItemSerializer(items, many=True).data

    @staticmethod
    def get_payment(obj):
        """
        Get the payment associated with this sale.

        Args:
            obj (Sale): The Sale instance.

        Returns:
            dict: The serialized Payment instance, or None if no payment exists.
        """
        payment = Payment.objects.filter(sale_id=obj).first()
        if payment:
            return PaymentSerializer(payment).data
        return None

    def create(self, validated_data):
        """
        Create a new Sale instance along with associated SaleItems, Stockentries, and Payment.

        Args:
            validated_data (dict): The validated data for creating the Sale.

        Returns:
            Sale: The created Sale instance.
        """
        sale = Sale.objects.create(**validated_data)

        items_data = self.initial_data.get("items", [])
        for item_data in items_data:
            product_id = item_data["product_id"]
            quantity = item_data["quantity"]
            price = item_data["price"]

            SaleItem.objects.create(
                sale=sale, product_id=product_id, quantity=quantity, price=price
            )

            # Create stock entry for each sale item
            Stockentry.objects.create(
                product_id=product_id,
                quantity=quantity,
                movement_type=StockMovementType.OUTGOING,
                supplier=None,
            )

        payment_data = self.initial_data.get("payment")
        if payment_data:
            Payment.objects.create(sale_id=sale, **payment_data)

        return sale


class TipSerializer(serializers.Serializer):
    """
    Serializer for handling tip data.

    This serializer is used for validating and processing tip information.
    """

    tip = serializers.DecimalField(max_digits=6, decimal_places=2, required=True)

    @staticmethod
    def validate_tip(value):
        """
        Validate the tip amount.

        Args:
            value (Decimal): The tip amount to validate.

        Returns:
            Decimal: The validated tip amount.

        Raises:
            serializers.ValidationError: If the tip amount is negative.
        """
        if value < 0:
            raise serializers.ValidationError("Tip must be a non-negative value.")
        return value
