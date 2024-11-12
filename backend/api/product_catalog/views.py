import csv
from django.db.models import Q
from django.http import HttpResponse
from django.utils.dateparse import parse_datetime
from django_filters import rest_framework as filters
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.filters import OrderingFilter
from rest_framework.parsers import FileUploadParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.common.pagination import CustomPageNumberPagination
from api.product_catalog.filters import ProductFilter, CategoryFilter, VoucherFilter
from api.product_catalog.models import Product, Category, QuickSale, Voucher
from api.product_catalog.serializers import (
    ColorChoicesSerializer,
    ProductSerializer,
    CategorySerializer,
    ProductIDSerializer,
    QuickSaleSerializer,
    TaxRateChoicesSerializer, VoucherSerializer,
)
from api.warehouse.models import Stockentry, StockMovementType
from api.warehouse.serializers import StockentryReadSerializer
from authentication.permissions import IsAdminOrManager, IsAdminOrManagerOrCashier


class ProductViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Product instances.

    This ViewSet provides CRUD operations for Products, with custom behavior for
    creation, updating, and deletion.
    """

    serializer_class = ProductSerializer
    pagination_class = CustomPageNumberPagination
    filter_backends = (filters.DjangoFilterBackend,)
    filterset_class = ProductFilter
    filterset_fields = ["category", "ean_code"]
    swagger_tags = ["Product"]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Get the list of items for this view.

        This method filters the queryset based on the 'show_active' query parameter.
        """
        queryset = Product.objects.order_by('-date_created')
        show_active = self.request.query_params.get('show_active', None)
        if show_active == 'True':
            queryset = queryset.filter(is_active=True)
        return queryset

    def get_serializer_class(self):
        """
        Return the class to use for the serializer.

        Uses different serializers for GET and other methods.
        """
        if self.request.method == "GET":
            return ProductSerializer
        else:
            return ProductIDSerializer

    def create(self, request, *args, **kwargs):
        """
        Create a new Product instance.

        This method handles the creation of a new product, including image upload.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        image = request.FILES.get("image")
        color = request.data.get("color")

        if not image and not color:
            return Response(
                {"error": "Either image or color must be provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if image:
            serializer.save(image=image)
        else:
            serializer.save()  # Save without image

        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )

    def update(self, request, *args, **kwargs):
        """
        Update a Product instance.

        This method handles the updating of an existing product, including image update.
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        image = request.FILES.get("image")
        if image:
            instance.image = image
        serializer.save()
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        """
        Soft delete a Product instance.

        This method performs a soft delete instead of hard delete.
        """
        instance = self.get_object()
        instance.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @swagger_auto_schema(
        method="get",
        responses={
            200: openapi.Response(
                description="Returns a list of colors",
                schema=ColorChoicesSerializer,
            )
        },
    )
    @action(detail=False, methods=["get"])
    def colors(self, request):
        """
        Get a list of available colors.
        """
        serializer = ColorChoicesSerializer(data={})
        serializer.is_valid()
        return Response(serializer.data)

    @swagger_auto_schema(
        method="get",
        responses={
            200: openapi.Response(
                description="Returns a list of tax rates",
                schema=TaxRateChoicesSerializer,
            )
        },
    )
    @action(detail=False, methods=["get"])
    def tax_rates(self, request):
        """
        Get a list of available tax rates.
        """
        serializer = TaxRateChoicesSerializer(data={})
        serializer.is_valid()
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def latest(self, request):
        """
        Get the 10 most recently created products.
        """
        latest_products = self.get_queryset()[:10]
        serializer = self.get_serializer(latest_products, many=True)
        return Response(serializer.data)


class CategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Category instances.

    This ViewSet provides CRUD operations for Categories, with custom behavior for deletion.
    """

    queryset = Category.objects.order_by("id")
    pagination_class = CustomPageNumberPagination
    serializer_class = CategorySerializer
    filterset_class = CategoryFilter
    swagger_tags = ["Category"]
    permission_classes = [IsAuthenticated]

    def destroy(self, request, *args, **kwargs):
        """
        Delete a Category instance.

        This method moves subcategories and products to the parent category before deletion.
        """
        instance = self.get_object()
        parent = instance.parent

        # move subcategories to parent category
        for subcategory in Category.objects.filter(parent=instance):
            subcategory.parent = parent
            subcategory.save()

        # move products to parent category
        for product in instance.product_set.all():
            product.category = parent
            product.save()

        # delete the category
        instance.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)


class QuickSaleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing QuickSale instances.

    This ViewSet provides CRUD operations for QuickSales.
    """

    queryset = QuickSale.objects.all()
    serializer_class = QuickSaleSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        """
        Create a new QuickSale instance.
        """
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, pk=None, *args, **kwargs):
        """
        Update an existing QuickSale instance.
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VoucherViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Voucher instances.

    This ViewSet provides CRUD operations for Vouchers, with custom behavior for
    creation, updating, and deletion.
    """

    serializer_class = VoucherSerializer
    pagination_class = CustomPageNumberPagination
    filter_backends = (filters.DjangoFilterBackend, OrderingFilter)
    filterset_class = VoucherFilter
    ordering_fields = ['expiration_date', 'discount_amount']
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Get the list of items for this view.

        This method filters out soft-deleted vouchers.
        """
        return Voucher.objects.filter(is_deleted=False).order_by("id")

    def get_permissions(self):
        """
        Instantiate and return the list of permissions that this view requires.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated, IsAdminOrManager]
        else:
            permission_classes = [IsAuthenticated, IsAdminOrManagerOrCashier]
        return [permission() for permission in permission_classes]

    def create(self, request, *args, **kwargs):
        """
        Create a new Voucher instance.

        This method includes additional validation and handling for existing deleted vouchers.
        """
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            discount_amount = request.data.get("discount_amount")

            # Check if the discount amount is negative
            if discount_amount is not None and float(discount_amount) < 0:
                return Response({"error": "Discount amount cannot be negative"}, status=status.HTTP_400_BAD_REQUEST)

            # Check if there's a deleted voucher with the same EAN code
            ean_code = serializer.validated_data.get('ean_code')
            existing_voucher = Voucher.objects.filter(Q(ean_code=ean_code) & Q(is_deleted=True)).first()
            if existing_voucher:
                # Clear the EAN code of the existing deleted voucher
                existing_voucher.ean_code = None
                existing_voucher.save()

            # Save the new voucher
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        """
        Update an existing Voucher instance.
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=kwargs.get('partial', False))
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def partial_update(self, request, *args, **kwargs):
        """
        Partially update an existing Voucher instance.
        """
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """
        Soft delete a Voucher instance.
        """
        instance = self.get_object()
        instance.soft_delete()
        return Response({"message": "Voucher successfully archived"}, status=status.HTTP_200_OK)


class CatalogViewSet(viewsets.ViewSet):
    """
    ViewSet for managing the product catalog.

    This ViewSet provides methods for importing and exporting the catalog.
    """

    permission_classes = [IsAuthenticated, IsAdminOrManager]

    @swagger_auto_schema(method="post", request_body=openapi.Schema(
        type=openapi.TYPE_FILE, description="CSV file to upload"
    ))
    @action(detail=False, methods=["post"], parser_classes=[FileUploadParser])
    def import_catalog(self, request):
        """
        Import a catalog from a CSV file.
        """
        file = request.FILES['file']
        data = csv.reader(file.read().decode('utf-8').splitlines())
        header = next(data)  # Read the header row

        try:
            is_active_index = header.index('is_active')
        except ValueError:
            is_active_index = None  # 'is_active' column not found

        for row in data:
            model_type, *fields = row
            if model_type == 'category':
                name, parent_name = fields[:2]
                parent = None
                if parent_name:
                    parent, _ = Category.objects.get_or_create(name=parent_name)
                Category.objects.create(name=name, parent=parent)
            elif model_type == 'product':
                name, category_name, price_with_vat, price_without_vat, inventory_count, measurement_of_quantity, unit, ean_code, color, description, tax_rate, *extra_fields = fields

                is_active = True
                if is_active_index is not None and len(fields) >= is_active_index:
                    is_active_value = fields[is_active_index - 1].lower()
                    is_active = is_active_value == 'true'

                category, _ = Category.objects.get_or_create(name=category_name)
                try:
                    Product.objects.create(
                        name=name,
                        category=category,
                        price_with_vat=float(price_with_vat),
                        price_without_vat=float(price_without_vat),
                        inventory_count=int(inventory_count),
                        measurement_of_quantity=float(measurement_of_quantity),
                        unit=unit,
                        ean_code=ean_code if ean_code else None,
                        color=color if color else None,
                        description=description if description else None,
                        tax_rate=float(tax_rate),
                        is_active=is_active
                    )
                except ValidationError as e:
                    return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            elif model_type == 'voucher':
                ean_code, expiration_date, discount_type, discount_amount, is_active, description, title = fields
                Voucher.objects.create(
                    ean_code=ean_code,
                    expiration_date=parse_datetime(expiration_date),
                    discount_type=discount_type,
                    discount_amount=float(discount_amount),
                    is_active=is_active.lower() == 'true',
                    description=description if description else None,
                    title=title
                )
        return Response({"status": "Catalog imported successfully"}, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"])
    def export_catalog(self, request):
        """
        Export the catalog to a CSV file.

        This method generates a CSV file containing all categories, active products,
        and non-deleted vouchers in the catalog.

        Returns:
            HttpResponse: A response containing the CSV file for download.
        """
        categories = Category.objects.all()
        products = Product.objects.filter(is_active=True)
        vouchers = Voucher.objects.filter(is_deleted=False)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="catalog.csv"'

        writer = csv.writer(response)
        writer.writerow(['type', 'name', 'category', 'price_with_vat', 'price_without_vat', 'inventory_count',
                         'measurement_of_quantity', 'unit', 'ean_code', 'color', 'description', 'tax_rate', 'parent',
                         'is_active', 'expiration_date', 'discount_type', 'discount_amount', 'title'])

        for category in categories:
            parent_name = category.parent.name if category.parent else ""
            writer.writerow(['category', category.name, "", "", "", "", "", "", "", "", "", "", parent_name, ""])

        for product in products:
            color = product.color if product.color else "RED"
            inventory_count = product.inventory_count if product.inventory_count is not None else 0
            writer.writerow([
                'product',
                product.name,
                product.category.name,
                product.price_with_vat,
                product.price_without_vat,
                inventory_count,
                product.measurement_of_quantity,
                product.unit,
                product.ean_code,
                color,
                product.description,
                product.tax_rate,
                "",
                str(product.is_active),
                "", "", "", ""  # Empty fields for voucher-specific data
            ])

        for voucher in vouchers:
            writer.writerow([
                'voucher',
                "",  # Empty name field
                "",  # Empty category field
                "", "", "", "", "",  # Empty product-specific fields
                voucher.ean_code,
                "",  # Empty color field
                voucher.description,
                "",  # Empty tax_rate field
                "",  # Empty parent field
                str(voucher.is_active),
                voucher.expiration_date.isoformat(),
                voucher.discount_type,
                voucher.discount_amount,
                voucher.title
            ])

        return response


class ProductStockEntryHistoryView(generics.GenericAPIView):
    """
    API view for retrieving the stock entry history of a product.

    This view returns the latest stock entry for a given product.
    """

    permission_classes = [IsAuthenticated]
    serializer_class = StockentryReadSerializer

    def get(self, request, product_id):
        """
        Retrieve the latest stock entry for a product.

        Args:
            request (Request): The HTTP request object.
            product_id (int): The ID of the product.

        Returns:
            Response: A response containing the serialized stock entry data or None if no entry exists.
        """
        stock_entry = Stockentry.objects.filter(
            product_id=product_id,
            movement_type=StockMovementType.INCOMING
        ).order_by('-date_created').first()  # Fetch the latest entry only

        if stock_entry:
            serializer = self.get_serializer(stock_entry)
            return Response(serializer.data)
        else:
            return Response(None)
