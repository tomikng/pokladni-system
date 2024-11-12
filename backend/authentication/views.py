import logging

from django.contrib.auth import authenticate
from django.contrib.auth.models import Permission
from rest_framework import status
from rest_framework.generics import (
    CreateAPIView,
    RetrieveUpdateDestroyAPIView,
    ListAPIView,
)
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from helpers.validators.can_modify_or_delete import can_modify_or_delete
from .models import CustomUser
from .permission_map import ROLE_PERMISSIONS
from .permissions import IsManager, IsAdminOrManager
from .serializers import UserEditSerializer, UserRegistrationSerializer, UserSerializer

logger = logging.getLogger(__name__)


class UserView(RetrieveUpdateDestroyAPIView):
    """
    View for retrieving, updating, and deleting `CustomUser` instances.

    Attributes:
        queryset (QuerySet): The queryset of all `CustomUser` instances.
        serializer_class (Serializer): The serializer class for the view.
        lookup_field (str): The field to use for lookup in the URL.
        permission_classes (list): The list of permission classes for the view.

    Methods:
        update(request, *args, **kwargs):
            Updates a `CustomUser` instance.
        destroy(request, *args, **kwargs):
            Deletes a `CustomUser` instance.
    """

    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    lookup_field = "id"
    permission_classes = [IsAuthenticated, IsAdminOrManager]

    def update(self, request, *args, **kwargs):
        """
        Update a `CustomUser` instance.

        Args:
            request (Request): The request instance.
            *args: Variable length argument list.
            **kwargs: Arbitrary keyword arguments.

        Returns:
            Response: The response with the updated user data or errors.
        """
        logger.debug("Update request data: %s", request.data)
        target_user = self.get_object()
        if not can_modify_or_delete(request.user, target_user):
            logger.warning("Modification not allowed for user %s", request.user.id)
            return Response(
                {"error": "Modification not allowed"}, status=status.HTTP_403_FORBIDDEN
            )
        serializer = UserEditSerializer(target_user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        else:
            logger.error("Serializer errors: %s", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        """
        Delete a `CustomUser` instance.

        Args:
            request (Request): The request instance.
            *args: Variable length argument list.
            **kwargs: Arbitrary keyword arguments.

        Returns:
            Response: The response indicating the deletion status.
        """
        target_user = self.get_object()
        if not can_modify_or_delete(request.user, target_user):
            return Response(
                {"error": "Deletion not allowed"}, status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)


class RegisterUserView(CreateAPIView):
    """
    View for registering a new `CustomUser`.

    Attributes:
        serializer_class (Serializer): The serializer class for the view.
        permission_classes (list): The list of permission classes for the view.

    Methods:
        post(request, *args, **kwargs):
            Handles user registration.
    """

    serializer_class = UserRegistrationSerializer
    permission_classes = [IsAuthenticated, IsAdminOrManager]

    def post(self, request, *args, **kwargs):
        """
        Register a new `CustomUser`.

        Args:
            request (Request): The request instance.
            *args: Variable length argument list.
            **kwargs: Arbitrary keyword arguments.

        Returns:
            Response: The response indicating the registration status.
        """
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"success": "User registered successfully"},
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UpdateRolePermissions(APIView):
    """
    View for updating role permissions.

    Attributes:
        permission_classes (list): The list of permission classes for the view.

    Methods:
        post(request, *args, **kwargs):
            Updates permissions for roles.
    """

    permission_classes = [IsAuthenticated, IsAdminOrManager]

    @staticmethod
    def post(request, *args, **kwargs):
        """
        Update permissions for roles.

        Args:
            request (Request): The request instance.
            *args: Variable length argument list.
            **kwargs: Arbitrary keyword arguments.

        Returns:
            Response: The response indicating the update status.
        """
        new_permissions = request.data.get("new_permissions", {})

        for role, permissions in new_permissions.items():
            ROLE_PERMISSIONS[role] = permissions

            users_with_role = CustomUser.objects.filter(role=role)

            for user in users_with_role:
                user.user_permissions.clear()
                for permission in permissions:
                    permission_obj = Permission.objects.get(codename=permission)
                    user.user_permissions.add(permission_obj)

        return Response(
            {"message": "Role permissions updated successfully"},
            status=status.HTTP_200_OK,
        )


class DeleteUser(APIView):
    """
    View for deleting a `CustomUser`.

    Attributes:
        permission_classes (list): The list of permission classes for the view.

    Methods:
        delete(request, user_id):
            Deletes a `CustomUser` instance.
    """

    permission_classes = [IsAuthenticated, IsManager]

    @staticmethod
    def delete(request, user_id):
        """
        Delete a `CustomUser` instance.

        Args:
            request (Request): The request instance.
            user_id (int): The ID of the user to delete.

        Returns:
            Response: The response indicating the deletion status.
        """
        user = CustomUser.objects.get(id=user_id)
        if not can_modify_or_delete(request.user, user):
            return Response(
                {"error": "Deletion not allowed"}, status=status.HTTP_403_FORBIDDEN
            )

        user.delete()
        return Response(
            {"success": "User deleted successfully"}, status=status.HTTP_204_NO_CONTENT
        )


class ListUsers(ListAPIView):
    """
    View for listing all `CustomUser` instances.

    Attributes:
        queryset (QuerySet): The queryset of all `CustomUser` instances.
        serializer_class (Serializer): The serializer class for the view.
        permission_classes (list): The list of permission classes for the view.
    """

    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminOrManager]


class LoginUser(APIView):
    """
    View for logging in a user and generating JWT tokens.

    Attributes:
        permission_classes (list): The list of permission classes for the view.

    Methods:
        post(request):
            Authenticates the user and returns JWT tokens.
    """

    permission_classes = [AllowAny]

    @staticmethod
    def post(request):
        """
        Authenticate the user and return JWT tokens.

        Args:
            request (Request): The request instance.

        Returns:
            Response: The response with JWT tokens or an error message.
        """
        username = request.data.get("username")
        password = request.data.get("password")
        user = authenticate(username=username, password=password)
        if user:
            refresh = RefreshToken.for_user(user)
            return Response(
                {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                    "id": user.id,
                    "role": user.role,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                }
            )
        return Response(
            {"error": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST
        )


class ToggleUserActiveStatus(APIView):
    """
    View for toggling the active status of a `CustomUser`.

    Attributes:
        permission_classes (list): The list of permission classes for the view.

    Methods:
        patch(request, user_id):
            Toggles the active status of a user.
    """

    permission_classes = [IsAdminOrManager]

    @staticmethod
    def patch(request, user_id):
        """
        Toggle the active status of a `CustomUser`.

        Args:
            request (Request): The request instance.
            user_id (int): The ID of the user to toggle active status.

        Returns:
            Response: The response with the updated user data or an error message.
        """
        try:
            user = CustomUser.objects.get(id=user_id)
            user.is_active = not user.is_active
            user.save()
            serializer = UserSerializer(user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except CustomUser.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
