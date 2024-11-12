import django_filters
from .models import Sale


class SaleFilter(django_filters.FilterSet):
    """
    A FilterSet for the Sale model.

    This FilterSet provides filtering capabilities for Sale objects,
    allowing filtering by date range and total amount range.

    Attributes:
        date_created (DateFromToRangeFilter): Allows filtering sales by a date range.
        total_amount (NumericRangeFilter): Allows filtering sales by a total amount range.
    """

    date_created = django_filters.DateFromToRangeFilter(field_name="date_created")
    total_amount = django_filters.NumericRangeFilter(field_name="total_amount")

    class Meta:
        """
        Meta class for SaleFilter.

        Specifies the model to be filtered and the fields available for filtering.
        """
        model = Sale
        fields = ['cashier', 'date_created', 'total_amount']
