from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BusinessSettingsViewSet

router = DefaultRouter()
router.register(r'business-settings', BusinessSettingsViewSet, basename='business-settings')

urlpatterns = [
    path('', include(router.urls)),
]
