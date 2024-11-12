from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from authentication.permissions import IsAdminOrManager
from .models import BusinessSettings
from .serializers import BusinessSettingsSerializer


class BusinessSettingsViewSet(viewsets.ModelViewSet):
    """
    A viewset for viewing and editing business settings.

    This viewset provides the standard actions for creating, retrieving, updating, and listing
    `BusinessSettings` instances. It also includes custom actions to retrieve the Euro rate and
    check if settings exist.

    Attributes:
        queryset (QuerySet): The queryset of `BusinessSettings` instances.
        serializer_class (Serializer): The serializer class for the viewset.
        permission_classes (list): The list of permission classes for the viewset.

    Methods:
        list(request, **kwargs):
            Retrieve the business settings.
        create(request, **kwargs):
            Create a new set of business settings if none exist.
        update(request, *args, **kwargs):
            Update the existing business settings.
        destroy(request, *args, **kwargs):
            Prevent deletion of business settings.
        euro_rate(request):
            Retrieve the Euro rate from the business settings.
        check_settings_exist(request):
            Check if any business settings exist.
    """

    queryset = BusinessSettings.objects.all()
    serializer_class = BusinessSettingsSerializer
    permission_classes = [IsAuthenticated, IsAdminOrManager]

    def list(self, request, **kwargs):
        """
        Retrieve the business settings.

        Args:
            request (Request): The request instance.
            **kwargs: Additional keyword arguments.

        Returns:
            Response: The response containing the business settings data or an empty dictionary if no settings exist.
        """
        settings = BusinessSettings.get_settings()
        if settings:
            serializer = self.get_serializer(settings)
            return Response(serializer.data)
        return Response({})

    def create(self, request, **kwargs):
        """
        Create a new set of business settings if none exist.

        Args:
            request (Request): The request instance.
            **kwargs: Additional keyword arguments.

        Returns:
            Response: The response containing the created business settings data or an error message if settings already exist.
        """
        if BusinessSettings.objects.exists():
            return Response({"detail": "Settings already exist. Use PUT to update."},
                            status=status.HTTP_400_BAD_REQUEST)
        return super().create(request)

    def update(self, request, *args, **kwargs):
        """
        Update the existing business settings.

        Args:
            request (Request): The request instance.
            *args: Additional positional arguments.
            **kwargs: Additional keyword arguments.

        Returns:
            Response: The response containing the updated business settings data or an error message if no settings exist.
        """
        settings = BusinessSettings.get_settings()
        if not settings:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """
        Prevent deletion of business settings.

        Args:
            request (Request): The request instance.
            *args: Additional positional arguments.
            **kwargs: Additional keyword arguments.

        Returns:
            Response: The response indicating that deletion is not allowed.
        """
        return Response({"detail": "Deletion of settings is not allowed."}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    @action(detail=False, methods=['get'])
    def euro_rate(self, request):
        """
        Retrieve the Euro rate from the business settings.

        Args:
            request (Request): The request instance.

        Returns:
            Response: The response containing the Euro rate or an error message if the rate is not set.
        """
        settings = BusinessSettings.get_settings()
        if settings:
            return Response({"euro_rate": settings.euro_rate})
        return Response({"detail": "Euro rate not set."}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'])
    def check_settings_exist(self, request):
        """
        Check if any business settings exist.

        Args:
            request (Request): The request instance.

        Returns:
            Response: The response indicating whether the business settings exist.
        """
        settings_exist = BusinessSettings.objects.exists()
        return Response({"settings_exist": settings_exist})
