from rest_framework import serializers
from .models import Invoice, SelectedProduct
from api.product_catalog.models import Product
from api.product_catalog.serializers import ProductSerializer


class SelectedProductReadSerializer(serializers.ModelSerializer):
    """
    Serializer for reading SelectedProduct instances.

    This serializer includes the full Product details.
    """

    product = ProductSerializer()

    class Meta:
        model = SelectedProduct
        fields = ("product", "quantity")


class SelectedProductWriteSerializer(serializers.ModelSerializer):
    """
    Serializer for writing SelectedProduct instances.

    This serializer is used when creating or updating SelectedProduct instances.
    """

    class Meta:
        model = SelectedProduct
        fields = ("product", "quantity")


class InvoiceReadSerializer(serializers.ModelSerializer):
    """
    Serializer for reading Invoice instances.

    This serializer includes detailed information about selected products.
    """

    selected_products = SelectedProductReadSerializer(many=True)

    class Meta:
        model = Invoice
        fields = ("id", "name", "selected_products", "created_at", "updated_at")


class InvoiceWriteSerializer(serializers.ModelSerializer):
    """
    Serializer for writing Invoice instances.

    This serializer handles the creation and validation of Invoice instances,
    including the associated SelectedProduct instances.
    """

    selected_products = SelectedProductWriteSerializer(many=True)

    class Meta:
        model = Invoice
        fields = ("id", "name", "selected_products", "created_at", "updated_at")

    def create(self, validated_data):
        """
        Create a new Invoice instance with associated SelectedProduct instances.

        Args:
            validated_data (dict): The validated data for creating the Invoice.

        Returns:
            Invoice: The newly created Invoice instance.
        """
        selected_products_data = validated_data.pop("selected_products")
        invoice = Invoice.objects.create(**validated_data)

        for product_data in selected_products_data:
            product = product_data["product"]
            quantity = product_data["quantity"]
            selected_product = SelectedProduct.objects.create(
                product=product, quantity=quantity
            )
            invoice.selected_products.add(selected_product)

        return invoice

    @staticmethod
    def validate_selected_products(value):
        """
        Validate the selected products for an Invoice.

        This method checks that at least one product is selected, quantities are positive,
        and products are active.

        Args:
            value (list): List of selected products' data.

        Returns:
            list: The validated list of selected products' data.

        Raises:
            serializers.ValidationError: If validation fails.
        """
        if not value:
            raise serializers.ValidationError("At least one product must be selected.")
        for item in value:
            product = item['product']
            quantity = item['quantity']
            if quantity <= 0:
                raise serializers.ValidationError(f"Quantity must be positive for {product.name}")
            if not product.is_active:
                raise serializers.ValidationError(f"{product.name} is not active")
        return value
