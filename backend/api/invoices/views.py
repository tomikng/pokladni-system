from rest_framework import viewsets
from .models import Invoice
from .serializers import InvoiceReadSerializer, InvoiceWriteSerializer
from rest_framework.permissions import IsAuthenticated


class InvoiceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Invoice instances.

    This ViewSet provides CRUD operations for Invoices, using different
    serializers for read and write operations.

    Attributes:
        queryset (QuerySet): The base queryset for Invoice objects.
        permission_classes (list): The permissions required to access this ViewSet.
    """

    queryset = Invoice.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        """
        Determine the serializer class based on the HTTP method.

        This method returns different serializers for GET requests (read operations)
        and other requests (write operations).

        Returns:
            type: The serializer class to be used.
        """
        if self.request.method == "GET":
            return InvoiceReadSerializer
        return InvoiceWriteSerializer
