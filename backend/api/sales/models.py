from django.db import models
from api.product_catalog.models import Voucher


class Sale(models.Model):
    """
    Represents a sale transaction.

    This model stores information about each sale, including the cashier who processed it,
    the total amount, timestamps, associated vouchers, and tip amount.

    Attributes:
        cashier (ForeignKey): The user who processed the sale.
        total_amount (DecimalField): The total amount of the sale.
        date_created (DateTimeField): The date and time when the sale was created.
        date_updated (DateTimeField): The date and time when the sale was last updated.
        vouchers (ManyToManyField): The vouchers applied to this sale.
        tip (DecimalField): The tip amount for this sale, if any.
    """

    cashier = models.ForeignKey("authentication.CustomUser", on_delete=models.CASCADE)
    total_amount = models.DecimalField(max_digits=6, decimal_places=2)
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)
    vouchers = models.ManyToManyField(Voucher, related_name='sales', blank=True)
    tip = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True)

    class Meta:
        verbose_name = "Sale"
        verbose_name_plural = "Sales"

    def __str__(self):
        return str(self.id)


class SaleItem(models.Model):
    """
    Represents an item within a sale.

    This model stores information about each individual item sold as part of a sale,
    including the product, quantity, and price.

    Attributes:
        sale (ForeignKey): The sale this item belongs to.
        product (ForeignKey): The product that was sold.
        quantity (IntegerField): The quantity of the product sold.
        price (DecimalField): The price of the product at the time of sale.
    """

    sale = models.ForeignKey(Sale, on_delete=models.CASCADE)
    product = models.ForeignKey("product_catalog.Product", on_delete=models.CASCADE)
    quantity = models.IntegerField()
    price = models.DecimalField(max_digits=6, decimal_places=2)

    class Meta:
        verbose_name = "Sale Item"
        verbose_name_plural = "Sale Items"

    def __str__(self):
        return str(self.id)


class Payment(models.Model):
    """
    Represents a payment for a sale.

    This model stores information about the payment method used for a sale.

    Attributes:
        sale_id (ForeignKey): The sale this payment is for.
        payment_type (CharField): The type of payment (Cash or Card).
    """

    class PaymentTypes(models.TextChoices):
        """
        Defines the available payment types.
        """
        CASH = "Cash", "Cash"
        CARD = "Card", "Card"

    sale_id = models.ForeignKey(Sale, on_delete=models.CASCADE)
    payment_type = models.CharField(max_length=20, choices=PaymentTypes.choices)

    class Meta:
        verbose_name = "Payment"
        verbose_name_plural = "Payments"

    def __str__(self):
        return str(self.id)
