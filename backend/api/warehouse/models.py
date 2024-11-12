from django.db import models
from api.product_catalog.models import Product
from helpers.validators.validate_positive import validate_positive
from django.core.validators import FileExtensionValidator
from django.db.models import Sum, F
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver


class StockMovementType(models.TextChoices):
    """
    Enumeration of stock movement types.
    """
    INCOMING = "IN", "Incoming"
    OUTGOING = "OUT", "Outgoing"


class Supplier(models.Model):
    """
    Model representing a supplier.

    Attributes:
        name (CharField): The name of the supplier.
        address (CharField): The address of the supplier (optional).
        phone_number (CharField): The phone number of the supplier (optional).
        email (EmailField): The email of the supplier (optional).
        ico (CharField): The Identification Number of Organization.
        dic (CharField): The Tax Identification Number.
        date_created (DateTimeField): The date and time when the supplier was created.
        date_updated (DateTimeField): The date and time when the supplier was last updated.
    """
    name = models.CharField(max_length=200)
    address = models.CharField(max_length=200, blank=True, null=True)
    phone_number = models.CharField(max_length=200, blank=True, null=True)
    email = models.EmailField(max_length=200, blank=True, null=True)
    ico = models.CharField(max_length=200)
    dic = models.CharField(max_length=200)
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class StockImport(models.Model):
    """
    Model representing a stock import.

    Attributes:
        supplier (ForeignKey): The supplier for this import.
        invoice_pdf (FileField): The PDF file of the invoice (optional).
        date_created (DateTimeField): The date and time when the import was created.
        date_updated (DateTimeField): The date and time when the import was last updated.
        note (TextField): Additional notes about the import (optional).
        ico (CharField): The Identification Number of Organization (optional).
        invoice_number (CharField): The invoice number (optional).
    """
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True)
    invoice_pdf = models.FileField(
        upload_to="invoices/",
        validators=[FileExtensionValidator(allowed_extensions=["pdf"])],
        blank=True,
        null=True,
    )
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)
    note = models.TextField(blank=True, null=True)
    ico = models.CharField(max_length=200, blank=True, null=True)
    invoice_number = models.CharField(max_length=200, blank=True, null=True)

    def __str__(self):
        return f"Invoice {self.id} from {self.supplier.name} on {self.date_created.strftime('%Y-%m-%d')}"


class Stockentry(models.Model):
    """
    Model representing a stock entry.

    Attributes:
        product (ForeignKey): The product associated with this stock entry.
        quantity (IntegerField): The quantity of the product.
        movement_type (CharField): The type of stock movement (incoming or outgoing).
        import_history (ForeignKey): The associated stock import (optional).
        supplier (ForeignKey): The supplier for this stock entry (optional).
        import_price (DecimalField): The import price of the product (optional).
        date_created (DateTimeField): The date and time when the entry was created.
        date_updated (DateTimeField): The date and time when the entry was last updated.
    """
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField(validators=[validate_positive])
    movement_type = models.CharField(max_length=10, choices=StockMovementType.choices)
    import_history = models.ForeignKey(
        StockImport,
        related_name="stock_entries",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True)
    import_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.movement_type} - {self.product.name} - {self.quantity}"


@receiver(post_save, sender=Stockentry)
def update_product_inventory_and_average_price(sender, instance, created, **kwargs):
    """
    Signal receiver to update product inventory and average price after a Stockentry is saved.

    Args:
        sender: The model class.
        instance: The actual instance being saved.
        created: A boolean; True if a new record was created.
        **kwargs: Additional keyword arguments.
    """
    if instance.product.inventory_count is None:
        instance.product.inventory_count = 0

    if instance.movement_type == StockMovementType.INCOMING:
        if instance.import_price is not None:
            total_quantity = \
                Stockentry.objects.filter(product=instance.product, movement_type=StockMovementType.INCOMING).aggregate(
                    Sum('quantity'))['quantity__sum'] or 0
            total_cost = \
                Stockentry.objects.filter(product=instance.product, movement_type=StockMovementType.INCOMING).aggregate(
                    total_cost=Sum(F('quantity') * F('import_price')))['total_cost'] or 0
            instance.product.average_price = total_cost / total_quantity if total_quantity > 0 else 0
        instance.product.inventory_count += instance.quantity
    elif instance.movement_type == StockMovementType.OUTGOING:
        instance.product.inventory_count -= instance.quantity

    instance.product.save()


@receiver(post_delete, sender=Stockentry)
def update_product_inventory_and_average_price_on_delete(sender, instance, **kwargs):
    """
    Signal receiver to update product inventory and average price after a Stockentry is deleted.

    Args:
        sender: The model class.
        instance: The actual instance being deleted.
        **kwargs: Additional keyword arguments.
    """
    if instance.product.inventory_count is None:
        instance.product.inventory_count = 0

    if instance.movement_type == StockMovementType.INCOMING:
        if instance.import_price is not None:
            total_quantity = \
                Stockentry.objects.filter(product=instance.product, movement_type=StockMovementType.INCOMING).aggregate(
                    Sum('quantity'))['quantity__sum'] or 0
            total_cost = \
                Stockentry.objects.filter(product=instance.product, movement_type=StockMovementType.INCOMING).aggregate(
                    total_cost=Sum(F('quantity') * F('import_price')))['total_cost'] or 0
            instance.product.average_price = total_cost / total_quantity if total_quantity > 0 else 0
        instance.product.inventory_count -= instance.quantity
    elif instance.movement_type == StockMovementType.OUTGOING:
        instance.product.inventory_count += instance.quantity

    instance.product.save()
