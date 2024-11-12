from rest_framework import permissions


class IsManager(permissions.BasePermission):
    """
    Custom permission to only allow access to users with the 'Manager' role.

    Methods:
        has_permission(request, view):
            Checks if the user has the 'Manager' role.
    """

    def has_permission(self, request, view):
        """
        Return `True` if the request user has the 'Manager' role, `False` otherwise.

        Args:
            request (Request): The current request instance.
            view (View): The view being accessed.

        Returns:
            bool: `True` if the user has the 'Manager' role, `False` otherwise.
        """
        try:
            return request.user.role == "MA"
        except AttributeError:
            return False


class IsAdmin(permissions.BasePermission):
    """
    Custom permission to only allow access to users with the 'Admin' role.

    Methods:
        has_permission(request, view):
            Checks if the user has the 'Admin' role.
    """

    def has_permission(self, request, view):
        """
        Return `True` if the request user has the 'Admin' role, `False` otherwise.

        Args:
            request (Request): The current request instance.
            view (View): The view being accessed.

        Returns:
            bool: `True` if the user has the 'Admin' role, `False` otherwise.
        """
        try:
            return request.user.role == "AD"
        except AttributeError:
            return False


class IsCashier(permissions.BasePermission):
    """
    Custom permission to only allow access to users with the 'Cashier' role.

    Methods:
        has_permission(request, view):
            Checks if the user has the 'Cashier' role.
    """

    def has_permission(self, request, view):
        """
        Return `True` if the request user has the 'Cashier' role, `False` otherwise.

        Args:
            request (Request): The current request instance.
            view (View): The view being accessed.

        Returns:
            bool: `True` if the user has the 'Cashier' role, `False` otherwise.
        """
        try:
            return request.user.role == "CA"
        except AttributeError:
            return False


class IsAdminOrManager(permissions.BasePermission):
    """
    Custom permission to only allow access to users with the 'Admin' or 'Manager' roles.

    Methods:
        has_permission(request, view):
            Checks if the user has the 'Admin' or 'Manager' role.
    """

    def has_permission(self, request, view):
        """
        Return `True` if the request user has the 'Admin' or 'Manager' role, `False` otherwise.

        Args:
            request (Request): The current request instance.
            view (View): The view being accessed.

        Returns:
            bool: `True` if the user has the 'Admin' or 'Manager' role, `False` otherwise.
        """
        try:
            return request.user.role == "AD" or request.user.role == "MA"
        except AttributeError:
            return False


class IsAdminOrManagerOrCashier(permissions.BasePermission):
    """
    Custom permission to only allow access to users with the 'Admin', 'Manager', or 'Cashier' roles.

    Methods:
        has_permission(request, view):
            Checks if the user has the 'Admin', 'Manager', or 'Cashier' role.
    """

    def has_permission(self, request, view):
        """
        Return `True` if the request user has the 'Admin', 'Manager', or 'Cashier' role, `False` otherwise.

        Args:
            request (Request): The current request instance.
            view (View): The view being accessed.

        Returns:
            bool: `True` if the user has the 'Admin', 'Manager', or 'Cashier' role, `False` otherwise.
        """
        try:
            return request.user.role == "AD" or request.user.role == "MA" or request.user.role == "CA"
        except AttributeError:
            return False
