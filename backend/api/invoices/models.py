from django.core.exceptions import ValidationError
from django.db import models
from api.product_catalog.models import Product


class SelectedProduct(models.Model):
    """
    Model representing a selected product in an unfinished invoice.

    This model stores information about a product selected for an unfinished invoice,
    including the product itself and the quantity.

    Attributes:
        product (ForeignKey): Reference to the Product model.
        quantity (PositiveIntegerField): The quantity of the product selected.
    """

    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()

    def __str__(self):
        """
        Returns a string representation of the SelectedProduct instance.
        """
        return f"{self.product.name} ({self.quantity})"

    def subtotal(self):
        """
        Calculates the subtotal for this selected product.

        Returns:
            Decimal: The subtotal (price with VAT multiplied by quantity).
        """
        return self.product.price_with_vat * self.quantity

    def clean(self):
        """
        Validates the SelectedProduct instance.

        Raises:
            ValidationError: If the quantity is not a positive integer.
        """
        if self.quantity <= 0:
            raise ValidationError("Quantity must be a positive integer.")

    def save(self, *args, **kwargs):
        """
        Saves the SelectedProduct instance after full cleaning.

        This method performs full validation before saving.
        """
        self.full_clean()
        super().save(*args, **kwargs)


class Invoice(models.Model):
    """
    Model representing an unfinished invoice.

    This model stores information about an invoice, including its name,
    selected products, and timestamps.

    Attributes:
        name (CharField): The name of the invoice.
        selected_products (ManyToManyField): The products selected for this invoice.
        created_at (DateTimeField): The timestamp when the invoice was created.
        updated_at (DateTimeField): The timestamp when the invoice was last updated.
    """

    name = models.CharField(max_length=255)
    selected_products = models.ManyToManyField(SelectedProduct, related_name='invoices')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        """
        Returns a string representation of the Invoice instance.
        """
        return self.name

    def total_price(self):
        """
        Calculates the total price of the invoice.

        Returns:
            Decimal: The sum of all selected products' subtotals.
        """
        return sum(sp.product.price_with_vat * sp.quantity for sp in self.selected_products.all())

    def delete(self, *args, **kwargs):
        """
        Deletes the Invoice instance and all associated SelectedProduct instances.

        This method ensures that when an invoice is deleted, all its selected products
        are also deleted to maintain data integrity.
        """
        for product in self.selected_products.all():
            product.delete()
        super(Invoice, self).delete(*args, **kwargs)
