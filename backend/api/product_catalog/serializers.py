from rest_framework import serializers
from api.product_catalog.models import (
    ColorChoices,
    Product,
    Category,
    QuickSale,
    TaxRateChoices,
    Voucher,
)


class CategorySerializer(serializers.ModelSerializer):
    """
    Serializer for the Category model.

    This serializer includes all fields from the Category model and adds two custom fields:
    parent_name and children.
    """
    parent_name = serializers.SerializerMethodField()
    children = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = "__all__"

    @staticmethod
    def get_parent_name(obj):
        """
        Get the name of the parent category.

        Args:
            obj (Category): The Category instance.

        Returns:
            str or None: The name of the parent category if it exists, otherwise None.
        """
        return obj.parent.name if obj.parent else None

    @staticmethod
    def get_children(obj):
        """
        Get all child categories of the current category.

        Args:
            obj (Category): The Category instance.

        Returns:
            list: A list of serialized child categories, or an empty list if there are no children.
        """
        children = obj.category_set.all()
        return CategorySerializer(children, many=True).data if children else []


class CategoryWithoutChildrenSerializer(serializers.ModelSerializer):
    """
    Serializer for the Category model without including child categories.

    This serializer includes all fields from the Category model and adds a custom field:
    parent_name.
    """
    parent_name = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = "__all__"

    @staticmethod
    def get_parent_name(obj):
        """
        Get the name of the parent category.

        Args:
            obj (Category): The Category instance.

        Returns:
            str or None: The name of the parent category if it exists, otherwise None.
        """
        return obj.parent.name if obj.parent else None


class ProductSerializer(serializers.ModelSerializer):
    """
    Serializer for the Product model.

    This serializer includes all fields from the Product model and adds a nested
    serializer for the categories field.
    """
    categories = CategoryWithoutChildrenSerializer

    class Meta:
        model = Product
        fields = "__all__"


class ProductIDSerializer(serializers.ModelSerializer):
    """
    Serializer for the Product model that includes all fields.
    """

    class Meta:
        model = Product
        fields = "__all__"


class ColorChoicesSerializer(serializers.Serializer):
    """
    Serializer for color choices.

    This serializer creates a list of dictionaries containing the value and label
    for each color choice.
    """
    colors = serializers.SerializerMethodField()

    @staticmethod
    def get_colors(obj):
        """
        Get a list of color choices.

        Args:
            obj: The object instance (not used in this method).

        Returns:
            list: A list of dictionaries, each containing 'value' and 'label' for a color choice.
        """
        return [
            {"value": choice[0], "label": choice[1]} for choice in ColorChoices.choices
        ]


class TaxRateChoicesSerializer(serializers.Serializer):
    """
    Serializer for tax rate choices.

    This serializer creates a list of dictionaries containing the value and label
    for each tax rate choice.
    """
    tax_rates = serializers.SerializerMethodField()

    @staticmethod
    def get_tax_rates(obj):
        """
        Get a list of tax rate choices.

        Args:
            obj: The object instance (not used in this method).

        Returns:
            list: A list of dictionaries, each containing 'value' and 'label' for a tax rate choice.
        """
        return [
            {"value": choice[0], "label": choice[1]}
            for choice in TaxRateChoices.choices
        ]


class QuickSaleSerializer(serializers.ModelSerializer):
    """
    Serializer for the QuickSale model.
    """

    class Meta:
        model = QuickSale
        fields = [
            "id",
            "name",
            "ean_code",
            "price_with_vat",
            "tax_rate",
            "quantity",
            "date_sold",
        ]

    def validate(self, attrs):
        """
        Validate the QuickSale data.

        Args:
            attrs (dict): The attributes to validate.

        Returns:
            dict: The validated attributes.

        Raises:
            serializers.ValidationError: If the quantity is not greater than zero.
        """
        if attrs["quantity"] <= 0:
            raise serializers.ValidationError("Quantity must be greater than zero.")
        return attrs


class VoucherSerializer(serializers.ModelSerializer):
    """
    Serializer for the Voucher model.
    """

    class Meta:
        model = Voucher
        fields = [
            "id",
            "ean_code",
            "expiration_date",
            "discount_type",
            "discount_amount",
            "is_active",
            "description",
            "title",
        ]
