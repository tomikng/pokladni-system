from rest_framework import serializers
from drf_yasg.utils import swagger_serializer_method
from django.db import transaction

from api.warehouse.models import StockImport, StockMovementType, Supplier, Stockentry
from helpers.validators.validate_positive import validate_positive


class SupplierSerializer(serializers.ModelSerializer):
    """
    Serializer for the Supplier model.

    This serializer provides a way to convert Supplier model instances into JSON representations and vice versa.
    It includes all fields from the Supplier model.
    """

    class Meta:
        model = Supplier
        fields = "__all__"


class StockentryWriteSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and updating Stockentry instances.

    This serializer is used when writing data to the Stockentry model. It includes
    fields necessary for creating or updating a stock entry.
    """

    class Meta:
        model = Stockentry
        fields = [
            "id",
            "product",
            "supplier",
            "quantity",
            "movement_type",
            "date_created",
            "date_updated",
        ]


class StockentryReadSerializer(serializers.ModelSerializer):
    """
    Serializer for reading Stockentry instances.

    This serializer is used when retrieving Stockentry data. It includes a nested
    representation of the associated product and supplier.
    """
    product = serializers.SerializerMethodField()
    supplier = SupplierSerializer(read_only=True)

    class Meta:
        model = Stockentry
        fields = [
            "id",
            "product",
            "supplier",
            "quantity",
            "movement_type",
            "date_created",
            "date_updated",
            "import_price",
        ]

    @staticmethod
    def get_product(obj):
        """
        Serialize the associated product.

        This method uses the ProductSerializer to provide a detailed
        representation of the product associated with this stock entry.

        Args:
            obj (Stockentry): The Stockentry instance being serialized.

        Returns:
            dict: Serialized data of the associated product.
        """
        from api.product_catalog.serializers import ProductSerializer
        return ProductSerializer(obj.product).data


class ProductQuantitySerializer(serializers.Serializer):
    """
    Serializer for product quantity data in stock imports.

    This serializer is used to validate the data for each product
    when creating a stock import.
    """
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(validators=[validate_positive])
    price_with_vat = serializers.DecimalField(
        max_digits=6, decimal_places=2, validators=[validate_positive]
    )


class StockImportCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and reading StockImport instances.

    This serializer handles the creation of a StockImport along with its
    associated Stockentry instances. It includes custom validation and creation logic.
    """
    products = serializers.ListField(child=serializers.DictField(), write_only=True)
    invoice_pdf = serializers.FileField(required=False)
    ico = serializers.CharField(max_length=200, required=False, allow_blank=True)
    note = serializers.CharField(required=False, allow_blank=True)
    invoice_number = serializers.CharField(max_length=200, required=False, allow_blank=True)
    supplier_name = serializers.CharField(source="supplier.name", read_only=True)
    date_created = serializers.DateTimeField(read_only=True)

    class Meta:
        model = StockImport
        fields = [
            "supplier",
            "invoice_pdf",
            "products",
            "id",
            "ico",
            "note",
            "invoice_number",
            "supplier_name",
            "date_created",
        ]

    @swagger_serializer_method(serializer_or_field=serializers.ListField(child=ProductQuantitySerializer()))
    def get_products(self, obj):
        """
        Get the products associated with this StockImport.

        This method is used by the Swagger documentation to properly display
        the structure of the 'products' field.

        Args:
            obj (StockImport): The StockImport instance.

        Returns:
            list: The list of products associated with this StockImport.
        """
        return obj.products

    def validate(self, data):
        """
        Validate the data for creating a StockImport.

        This method performs custom validation on the input data, ensuring that
        all required fields are present and that the data structure is correct.

        Args:
            data (dict): The input data to be validated.

        Returns:
            dict: The validated data.

        Raises:
            serializers.ValidationError: If the data fails validation.
        """
        required_fields = ["products"]
        missing_fields = [field for field in required_fields if field not in data]

        if missing_fields:
            raise serializers.ValidationError(f"Missing required fields: {', '.join(missing_fields)}")

        if not data.get("supplier") and not data.get("ico"):
            raise serializers.ValidationError("Either 'supplier' or 'ico' must be provided.")

        for product_data in data["products"]:
            product_required_fields = ["product_id", "quantity", "price_with_vat", "import_price"]
            missing_product_fields = [field for field in product_required_fields if field not in product_data]
            if missing_product_fields:
                raise serializers.ValidationError(
                    f"Each product entry must include the following fields: {', '.join(missing_product_fields)}"
                )

        return data

    def create(self, validated_data):
        """
        Create a new StockImport instance along with associated Stockentry instances.

        This method handles the creation of a StockImport and its related Stockentries.
        It also updates the prices of the associated products based on the import data.

        Args:
            validated_data (dict): The validated data for creating the StockImport.

        Returns:
            StockImport: The created StockImport instance.

        Raises:
            serializers.ValidationError: If any of the specified products do not exist.
        """
        from api.product_catalog.models import Product  # Lazy import

        supplier = validated_data.get("supplier")
        invoice_pdf = validated_data.get("invoice_pdf")
        ico = validated_data.get("ico")
        note = validated_data.get("note")
        invoice_number = validated_data.get("invoice_number")
        products_data = validated_data["products"]

        missing_products = []
        for product_data in products_data:
            product_id = product_data["product_id"]
            if not Product.objects.filter(id=product_id).exists():
                missing_products.append(product_id)

        if missing_products:
            raise serializers.ValidationError(
                f"Products with IDs {', '.join(map(str, missing_products))} do not exist.")

        with transaction.atomic():
            stock_import = StockImport.objects.create(
                supplier=supplier,
                invoice_pdf=invoice_pdf,
                ico=ico,
                note=note,
                invoice_number=invoice_number,
            )

            for product_data in products_data:
                product_id = product_data["product_id"]
                quantity = int(product_data["quantity"])
                price_with_vat = product_data["price_with_vat"]
                import_price = product_data["import_price"]
                product = Product.objects.get(id=product_id)

                # Update product prices
                product.price_with_vat = price_with_vat
                tax_rate = float(product.tax_rate)
                product.price_without_vat = round(float(price_with_vat) / (1 + float(tax_rate)), 2)
                product.save()

                Stockentry.objects.create(
                    product=product,
                    quantity=quantity,
                    movement_type=StockMovementType.INCOMING,
                    import_history=stock_import,
                    supplier=supplier,
                    import_price=import_price,
                )

        return stock_import
