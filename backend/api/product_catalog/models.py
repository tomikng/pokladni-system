from django.core.exceptions import ValidationError
from django.db import models
from helpers.validators.validate_positive import validate_positive
from settings.models import BusinessSettings
from .choices import ColorChoices, TaxRateChoices


class CategoryManager(models.Manager):
    """
    Custom manager for the Category model.

    This manager provides additional methods for querying categories.
    """

    def get_queryset(self):
        """
        Returns the base queryset for all category queries.

        Returns:
            QuerySet: The base queryset for categories.
        """
        return super().get_queryset()

    def get_subcategories(self, category):
        """
        Retrieves all subcategories of a given category.

        This method filters the categories to return only those that have
        the given category as their parent.

        Args:
            category (Category): The parent category.

        Returns:
            QuerySet: A queryset containing all subcategories of the given category.
        """
        return self.filter(parent=category)


class Category(models.Model):
    """
    Model representing a product category.

    This model is used to organize products into hierarchical categories.
    Categories can have parent categories, allowing for a nested structure.

    Attributes:
        name (CharField): The name of the category. Must be unique.
        parent (ForeignKey): Reference to the parent category, if any.
    """

    name = models.CharField(max_length=200, unique=True)
    parent = models.ForeignKey("self", on_delete=models.SET_NULL, null=True, blank=True)

    objects = CategoryManager()

    class Meta:
        verbose_name = "Category"
        verbose_name_plural = "Categories"

    def __str__(self):
        """
        Returns a string representation of the category.

        Returns:
            str: The name of the category.
        """
        return str(self.name)


class Product(models.Model):
    """
    Model representing a product.

    This model stores detailed information about a product, including its
    pricing, inventory, and various attributes.

    Attributes:
        name (CharField): The name of the product. Must be unique.
        category (ForeignKey): The category to which the product belongs.
        price_with_vat (DecimalField): The price of the product including VAT.
        price_without_vat (DecimalField): The price of the product excluding VAT.
        inventory_count (IntegerField): The current inventory count of the product.
        measurement_of_quantity (DecimalField): The quantity measurement of the product.
        unit (CharField): The unit of measurement for the product.
        ean_code (CharField): The EAN (barcode) code of the product.
        image (ImageField): An image of the product.
        color (CharField): The color of the product, chosen from predefined choices.
        tax_rate (DecimalField): The tax rate applied to the product.
        description (TextField): A detailed description of the product.
        date_created (DateTimeField): The date and time when the product was created.
        date_updated (DateTimeField): The date and time when the product was last updated.
        average_price (DecimalField): The average price of the product.
        is_active (BooleanField): Indicates whether the product is currently active.
    """

    name = models.CharField(max_length=200)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    price_with_vat = models.DecimalField(max_digits=6, decimal_places=2, validators=[validate_positive])
    price_without_vat = models.DecimalField(max_digits=6, decimal_places=2, validators=[validate_positive])
    inventory_count = models.IntegerField(validators=[validate_positive], null=True, blank=True)
    measurement_of_quantity = models.DecimalField(max_digits=6, decimal_places=2, validators=[validate_positive])
    unit = models.CharField(max_length=200)
    ean_code = models.CharField(max_length=200, blank=True, null=True, unique=True)
    image = models.ImageField(upload_to="products/", blank=True, null=True)
    color = models.CharField(max_length=20, choices=ColorChoices.choices, blank=True, null=True)
    tax_rate = models.DecimalField(max_digits=6, decimal_places=2)
    description = models.TextField(blank=True, null=True)
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)
    average_price = models.DecimalField(max_digits=50, decimal_places=40, default=0.00)
    is_active = models.BooleanField(default=True)

    def clean(self):
        """
        Performs custom validation for the Product model.

        This method checks various fields to ensure they contain valid values.
        It raises ValidationError if any field fails validation.

        Raises:
            ValidationError: If any field contains an invalid value.
        """
        if self.inventory_count is not None and self.inventory_count < 0:
            raise ValidationError("The inventory count must be a non-negative integer.")
        if self.tax_rate is not None and self.tax_rate < 0:
            raise ValidationError("The tax rate must be a non-negative number.")
        if self.price_with_vat is not None and self.price_with_vat < 0:
            raise ValidationError("The price with VAT must be a non-negative number.")
        if self.price_without_vat is not None and self.price_without_vat < 0:
            raise ValidationError("The price without VAT must be a non-negative number.")
        if self.measurement_of_quantity is not None and self.measurement_of_quantity < 0:
            raise ValidationError("The measurement of quantity must be a non-negative number.")

    def save(self, *args, **kwargs):
        """
        Saves the product instance to the database.

        This method calls the superclass save method to perform the actual saving.

        Args:
            *args: Variable length argument list.
            **kwargs: Arbitrary keyword arguments.
        """
        super().save(*args, **kwargs)

    def __str__(self):
        """
        Returns a string representation of the product.

        Returns:
            str: The name of the product.
        """
        return self.name

    def soft_delete(self):
        """
        Performs a soft delete of the product.

        This method sets the is_active field to False, effectively
        deactivating the product without removing it from the database.
        """
        self.is_active = False
        self.ean_code = None
        self.save()


class QuickSale(models.Model):
    """
    Model representing a quick sale transaction.

    This model is used to record sales that are processed quickly,
    typically without creating a full product record.

    Attributes:
        name (CharField): The name of the item sold.
        ean_code (CharField): The EAN code of the item, if applicable.
        price_with_vat (DecimalField): The sale price including VAT.
        tax_rate (DecimalField): The tax rate applied to the sale.
        quantity (PositiveIntegerField): The quantity of items sold.
        date_sold (DateTimeField): The date and time of the sale.
    """

    name = models.CharField(max_length=200)
    ean_code = models.CharField(max_length=200, unique=True, null=True, blank=True)
    price_with_vat = models.DecimalField(max_digits=8, decimal_places=2, validators=[validate_positive])
    tax_rate = models.DecimalField(max_digits=4, decimal_places=2, validators=[validate_positive])
    quantity = models.PositiveIntegerField(default=1, validators=[validate_positive])
    date_sold = models.DateTimeField(auto_now_add=True)

    def clean(self):
        """
        Performs custom validation for the QuickSale model.

        This method checks various fields to ensure they contain valid values.
        It raises ValidationError if any field fails validation.

        Raises:
            ValidationError: If any field contains an invalid value or if a duplicate EAN code is found.
        """
        if self.price_with_vat < 0:
            raise ValidationError("The price with VAT must be a positive number.")
        if self.tax_rate < 0 or self.tax_rate > 1:
            raise ValidationError("The tax rate must be a positive decimal between 0 and 1.")
        if self.ean_code and QuickSale.objects.filter(ean_code=self.ean_code).exists():
            raise ValidationError("A quick sale with this EAN code already exists.")

    def __str__(self):
        """
        Returns a string representation of the quick sale.

        Returns:
            str: A string containing the name, quantity, and date of the sale.
        """
        return f"{self.name} - {self.quantity} pcs sold on {self.date_sold.strftime('%Y-%m-%d')}"

    class Meta:
        verbose_name = "Quick Sale"
        verbose_name_plural = "Quick Sales"


class Voucher(models.Model):
    """
    Model representing a discount voucher.

    This model is used to create and manage discount vouchers that can be
    applied to sales.

    Attributes:
        ean_code (CharField): The EAN code of the voucher, if applicable.
        expiration_date (DateTimeField): The date and time when the voucher expires.
        discount_type (CharField): The type of discount (percentage or fixed amount).
        discount_amount (DecimalField): The amount of the discount.
        is_active (BooleanField): Indicates whether the voucher is currently active.
        description (TextField): A detailed description of the voucher.
        title (CharField): The title or name of the voucher.
        is_deleted (BooleanField): Indicates whether the voucher has been soft-deleted.
    """

    class DiscountTypes(models.TextChoices):
        PERCENTAGE = "Percentage", "Percentage"
        FIXED = "Fixed", "Fixed"

    ean_code = models.CharField(max_length=200, null=True, blank=True)
    expiration_date = models.DateTimeField()
    discount_type = models.CharField(max_length=10, choices=DiscountTypes.choices)
    discount_amount = models.DecimalField(max_digits=6, decimal_places=2)
    is_active = models.BooleanField(default=True)
    description = models.TextField(blank=True, null=True)
    title = models.CharField(max_length=200)
    is_deleted = models.BooleanField(default=False)

    def clean(self):
        """
        Performs custom validation for the Voucher model.

        This method checks the discount_amount field to ensure it contains a valid value.
        It raises ValidationError if the field fails validation.

        Raises:
            ValidationError: If the discount amount is negative.
        """
        if self.discount_amount < 0:
            raise ValidationError("Discount amount cannot be negative.")

    def save(self, *args, **kwargs):
        """
        Saves the voucher instance to the database.

        This method performs full cleaning of the instance before saving.

        Args:
            *args: Variable length argument list.
            **kwargs: Arbitrary keyword arguments.
        """
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        """
        Returns a string representation of the voucher.

        Returns:
            str: The title of the voucher.
        """
        return self.title

    def soft_delete(self):
        """
        Performs a soft delete of the voucher.

        This method sets both is_deleted and is_active fields to deactivate
        the voucher without removing it from the database.
        """
        self.is_deleted = True
        self.is_active = False
        self.save()

    class Meta:
        verbose_name = "Voucher"
        verbose_name_plural = "Vouchers"
