# urls.py

from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from .views import (
    UpdateRolePermissions,
    RegisterUserView,
    UserView,
    ListUsers,
    LoginUser, ToggleUserActiveStatus,
)

urlpatterns = [
    path("login/", LoginUser.as_view(), name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("token/verify/", TokenVerifyView.as_view(), name="token_verify"),
    path("register/", RegisterUserView.as_view(), name="register"),
    path(
        "update_role_permissions/",
        UpdateRolePermissions.as_view(),
        name="update_role_permissions",
    ),
    path("users/<int:id>/", UserView.as_view(), name="user-detail"),
    path("users/", ListUsers.as_view(), name="user-list"),
    path('users/<int:user_id>/toggle_active/', ToggleUserActiveStatus.as_view(), name='toggle_user_active'),
]
