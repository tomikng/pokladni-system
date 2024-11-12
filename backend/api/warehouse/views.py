from rest_framework.filters import OrderingFilter
from django_filters import rest_framework as filters
from rest_framework import viewsets
from rest_framework.parsers import FormParser, MultiPartParser

from api.common.pagination import CustomPageNumberPagination
from api.warehouse.filters import SupplierFilter, StockentryFilter, StockImportFilter
from api.warehouse.models import StockImport, Supplier, Stockentry
from api.warehouse.serializers import (
    StockImportCreateSerializer,
    StockentryReadSerializer,
    StockentryWriteSerializer,
    SupplierSerializer,
)
from authentication.permissions import IsAdminOrManagerOrCashier


class SupplierViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Supplier instances.

    This ViewSet provides CRUD operations for Suppliers.
    It includes filtering capabilities and custom pagination.

    Attributes:
        queryset (QuerySet): All Supplier objects.
        serializer_class (Serializer): The serializer class for Supplier model.
        pagination_class (Pagination): Custom pagination class.
        filterset_class (FilterSet): Custom filter class for Supplier model.
        swagger_tags (list): Tags for Swagger documentation.
        permission_classes (list): Permission classes for access control.
    """
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    pagination_class = CustomPageNumberPagination
    filterset_class = SupplierFilter
    swagger_tags = ["Supplier"]
    permission_classes = [IsAdminOrManagerOrCashier]


class StockentryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Stockentry instances.

    This ViewSet provides CRUD operations for Stockentries.
    It includes filtering capabilities and custom pagination.
    Different serializers are used for read and write operations.

    Attributes:
        queryset (QuerySet): All Stockentry objects.
        pagination_class (Pagination): Custom pagination class.
        filterset_class (FilterSet): Custom filter class for Stockentry model.
        swagger_tags (list): Tags for Swagger documentation.
        permission_classes (list): Permission classes for access control.
    """
    queryset = Stockentry.objects.all()
    pagination_class = CustomPageNumberPagination
    filterset_class = StockentryFilter
    swagger_tags = ["Stockentry"]
    permission_classes = [IsAdminOrManagerOrCashier]

    def get_serializer_class(self):
        """
        Returns the appropriate serializer class based on the current action.

        Returns:
            Serializer: StockentryReadSerializer for list and retrieve actions,
                        StockentryWriteSerializer for other actions.
        """
        if self.action in ["list", "retrieve"]:
            return StockentryReadSerializer
        return StockentryWriteSerializer


class StockImportViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing StockImport instances.

    This ViewSet provides CRUD operations for StockImports.
    It includes custom pagination and supports file uploads.

    Attributes:
        queryset (QuerySet): All StockImport objects, ordered by id.
        serializer_class (Serializer): The serializer class for StockImport model.
        pagination_class (Pagination): Custom pagination class.
        swagger_tags (list): Tags for Swagger documentation.
        permission_classes (list): Permission classes for access control.
        parser_classes (list): Parser classes for handling multipart form data.
    """
    queryset = StockImport.objects.order_by("-date_created")
    serializer_class = StockImportCreateSerializer
    pagination_class = CustomPageNumberPagination
    swagger_tags = ["StockImport"]
    permission_classes = [IsAdminOrManagerOrCashier]
    parser_classes = [MultiPartParser, FormParser]
    filter_backends = (filters.DjangoFilterBackend, OrderingFilter)
    filterset_class = StockImportFilter
    ordering_fields = ['date_created']

    # Commented out code:
    # def get_serializer_class(self):
    #     if self.action == "create":
    #         return StockImportCreateSerializer
    #     return StockImportCreateSerializer
