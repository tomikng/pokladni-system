import django_filters
from api.product_catalog.models import Category, Product, Voucher


class CategoryFilter(django_filters.FilterSet):
    """
    FilterSet for Category model.

    Provides filtering capabilities for Category instances.

    Attributes:
        name (CharFilter): Filters categories by name, case-insensitive containment.
    """

    name = django_filters.CharFilter(lookup_expr="icontains")

    class Meta:
        model = Category
        fields = ["name", "parent"]


class ProductFilter(django_filters.FilterSet):
    """
    FilterSet for Product model.

    Provides advanced filtering capabilities for Product instances.

    Attributes:
        name (CharFilter): Filters products by name, case-insensitive containment.
        price_with_vat (NumberFilter): Filters products by exact price with VAT.
        price_with_vat__gt (NumberFilter): Filters products with price greater than specified value.
        price_with_vat__lt (NumberFilter): Filters products with price less than specified value.
        category (ModelChoiceFilter): Filters products by category.
        ean_code (CharFilter): Filters products by exact EAN code, case-insensitive.
    """

    name = django_filters.CharFilter(lookup_expr="icontains")
    price_with_vat = django_filters.NumberFilter()
    price_with_vat__gt = django_filters.NumberFilter(
        field_name="price_with_vat", lookup_expr="gt"
    )
    price_with_vat__lt = django_filters.NumberFilter(
        field_name="price_with_vat", lookup_expr="lt"
    )
    category = django_filters.ModelChoiceFilter(
        queryset=Category.objects.all(), method="filter_category"
    )
    ean_code = django_filters.CharFilter(lookup_expr="iexact")

    class Meta:
        model = Product
        fields = [
            "name",
            "category",
            "price_with_vat",
            "ean_code",
        ]

    def filter_category(self, queryset, name, value):
        """
        Custom method to filter products by category.

        Args:
            queryset (QuerySet): The initial queryset to filter.
            name (str): The name of the field to filter by (unused in this method).
            value (Category): The category instance to filter by.

        Returns:
            QuerySet: The filtered queryset.
        """
        if value:
            return queryset.filter(category=value)
        return queryset


class VoucherFilter(django_filters.FilterSet):
    """
    FilterSet for Voucher model.

    Provides filtering capabilities for Voucher instances.

    Attributes:
        expiration_date (DateFromToRangeFilter): Filters vouchers by expiration date range.
        is_active (BooleanFilter): Filters vouchers by active status.
        ean_code (CharFilter): Filters vouchers by exact EAN code, case-insensitive.
    """

    expiration_date = django_filters.DateFromToRangeFilter()
    is_active = django_filters.BooleanFilter()
    ean_code = django_filters.CharFilter(lookup_expr="iexact")

    class Meta:
        model = Voucher
        fields = ['ean_code', 'expiration_date', 'discount_type', 'discount_amount', 'is_active']
