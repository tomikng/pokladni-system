import django_filters
from api.warehouse.models import Supplier, Stockentry, StockImport


class SupplierFilter(django_filters.FilterSet):
    """
    FilterSet for the Supplier model.

    This FilterSet provides filtering capabilities for Supplier objects,
    allowing case-insensitive partial matches on various fields.

    Attributes:
        name (CharFilter): Filters suppliers by name (case-insensitive, partial match).
        address (CharFilter): Filters suppliers by address (case-insensitive, partial match).
        phone_number (CharFilter): Filters suppliers by phone number (case-insensitive, partial match).
        email (CharFilter): Filters suppliers by email (case-insensitive, partial match).
        ico (CharFilter): Filters suppliers by ICO (Identification Number of Organization) (case-insensitive, partial match).
        dic (CharFilter): Filters suppliers by DIC (Tax Identification Number) (case-insensitive, partial match).
    """

    name = django_filters.CharFilter(lookup_expr="icontains")
    address = django_filters.CharFilter(lookup_expr="icontains")
    phone_number = django_filters.CharFilter(lookup_expr="icontains")
    email = django_filters.CharFilter(lookup_expr="icontains")
    ico = django_filters.CharFilter(lookup_expr="icontains")
    dic = django_filters.CharFilter(lookup_expr="icontains")

    class Meta:
        model = Supplier
        fields = ["name", "address", "phone_number", "email", "ico", "dic"]


class StockentryFilter(django_filters.FilterSet):
    """
    FilterSet for the Stockentry model.

    This FilterSet provides filtering capabilities for Stockentry objects,
    allowing filtering by product name and quantity, including range filters for quantity.

    Attributes:
        name (CharFilter): Filters stock entries by product name (case-insensitive, partial match).
        quantity (NumberFilter): Filters stock entries by exact quantity.
        quantity__gt (NumberFilter): Filters stock entries with quantity greater than specified value.
        quantity__lt (NumberFilter): Filters stock entries with quantity less than specified value.
    """

    name = django_filters.CharFilter(lookup_expr="icontains")
    quantity = django_filters.NumberFilter()
    quantity__gt = django_filters.NumberFilter(field_name="quantity", lookup_expr="gt")
    quantity__lt = django_filters.NumberFilter(field_name="quantity", lookup_expr="lt")

    class Meta:
        model = Stockentry
        fields = ["product", "quantity"]


class StockImportFilter(django_filters.FilterSet):
    """
    FilterSet for the StockImport model.

    This FilterSet provides filtering capabilities for StockImport objects,
    allowing case-insensitive partial matches on various fields and date range filtering.

    Attributes:
        supplier (NumberFilter): Filters stock imports by supplier ID.
        date_created (DateFromToRangeFilter): Filters stock imports by a date range.
    """

    supplier = django_filters.NumberFilter(field_name='supplier__id')
    date_created = django_filters.DateFromToRangeFilter()

    class Meta:
        model = StockImport
        fields = ['supplier', 'date_created']
