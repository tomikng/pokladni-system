from django.urls import path
from .views import SaleStatisticsView

urlpatterns = [
    path('sales/', SaleStatisticsView.as_view(), name='custom_sale_statistics'),
    path('sales/<str:period>/', SaleStatisticsView.as_view(), name='sale_statistics'),
]
