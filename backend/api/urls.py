# urls.py
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from api.daily_closure.views import DailySummaryViewSet, WithdrawalViewSet
from api.product_catalog.views import (
    ProductViewSet,
    CategoryViewSet,
    QuickSaleViewSet, VoucherViewSet, CatalogViewSet, ProductStockEntryHistoryView,
)
from api.warehouse.views import StockImportViewSet, SupplierViewSet, StockentryViewSet
from api.invoices.views import InvoiceViewSet
from api.sales.views import SaleViewSet

catalog_list = CatalogViewSet.as_view({
    'post': 'import_catalog',
    'get': 'export_catalog'
})

router = DefaultRouter()
router.register(r"product", ProductViewSet, basename="product")
router.register(r"category", CategoryViewSet, basename="category")
router.register(r"supplier", SupplierViewSet, basename="supplier")
router.register(r"stockentry", StockentryViewSet, basename="stockentry")
router.register(r"invoices", InvoiceViewSet, basename="invoice")
router.register(r"quick-sale", QuickSaleViewSet, basename="quick-sale")
router.register(r"stock-import", StockImportViewSet, basename="stock-import")
router.register(r"sales", SaleViewSet)
router.register(r"vouchers", VoucherViewSet, basename="voucher")
router.register(r"withdrawals", WithdrawalViewSet, basename="withdrawal")


urlpatterns = [
    path("", include(router.urls)),
    path('catalog/import_catalog/', catalog_list, name='catalog-import_catalog'),
    path('catalog/export_catalog/', catalog_list, name='catalog-export_catalog'),
    path('product/<int:product_id>/stock-entry-history/', ProductStockEntryHistoryView.as_view(), name='product-stock-entry-history'),
    path('daily_closure/calculate/', DailySummaryViewSet.as_view({'post': 'calculate_daily_summary'}),
         name='dailysummary-calculate-daily-summary'),
    path('daily_closure/summaries/', DailySummaryViewSet.as_view({'get': 'list_daily_summaries'}),
         name='dailysummary-list-daily-summaries'),
]
