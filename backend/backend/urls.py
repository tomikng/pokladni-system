# project's urls.py
from django.contrib import admin
from django.urls import path, include
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from django.conf import settings
from django.conf.urls.static import static

api_info = openapi.Info(
    title="POS API",
    default_version="v1",
    description="API documentation",
    contact=openapi.Contact(email="tomasnguyen43@gmail.com"),
)

api_schema_view = get_schema_view(
    api_info,
    public=True,
    permission_classes=(permissions.AllowAny,),
    patterns=[
        path("api/", include("api.urls")),
    ],
)

settings_info = openapi.Info(
    title="Settings API",
    default_version="v1",
    description="Settings API documentation",
    contact=openapi.Contact(email="tomasnguyen43@gmail.com"),
)

settings_schema_view = get_schema_view(
    settings_info,
    public=True,
    permission_classes=(permissions.AllowAny,),
    patterns=[
        path("settings/", include("settings.urls")),
    ],
)

stats_info = openapi.Info(
    title="Stats API",
    default_version="v1",
    description="Stats API documentation",
    contact=openapi.Contact(email="tomasnguyen43@gmail.com"),
)

stats_schema_view = get_schema_view(
    stats_info,
    public=True,
    permission_classes=(permissions.AllowAny,),
    patterns=[
        path("stats/", include("stats.urls")),
    ],
)

auth_info = openapi.Info(
    title="Authentication API",
    default_version="v1",
    description="Authentication API documentation",
    contact=openapi.Contact(email="tomasnguyen43@gmail.com"),
)

auth_schema_view = get_schema_view(
    auth_info,
    public=True,
    permission_classes=(permissions.AllowAny,),
    patterns=[path("auth/", include("authentication.urls"))],
)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("api.urls")),
    path("settings/", include("settings.urls")),
    path("stats/", include("stats.urls")),
    path("auth/", include("authentication.urls")),
    path(
        "api/docs/",
        api_schema_view.with_ui("swagger", cache_timeout=0),
        name="api-schema-swagger-ui",
    ),
    path(
        "api/redoc/",
        api_schema_view.with_ui("redoc", cache_timeout=0),
        name="api-schema-redoc",
    ),
    path(
        "auth/docs/",
        auth_schema_view.with_ui("swagger", cache_timeout=0),
        name="auth-schema-swagger-ui",
    ),
    path(
        "auth/redoc/",
        auth_schema_view.with_ui("redoc", cache_timeout=0),
        name="auth-schema-redoc",
    ),
    path(
        "settings/docs/",
        settings_schema_view.with_ui("swagger", cache_timeout=0),
        name="settings-schema-swagger-ui",
    ),
    path(
        "settings/redoc/",
        settings_schema_view.with_ui("redoc", cache_timeout=0),
        name="settings-schema-redoc",
    ),
    path(
        "stats/docs/",
        stats_schema_view.with_ui("swagger", cache_timeout=0),
        name="stats-schema-swagger-ui",
    ),
    path(
        "stats/redoc/",
        stats_schema_view.with_ui("redoc", cache_timeout=0),
        name="stats-schema-redoc",
    ),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
