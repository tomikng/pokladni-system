from django.db import models
from django.core.exceptions import ValidationError

from api.product_catalog.choices import ColorChoices, TaxRateChoices


class BusinessSettings(models.Model):
    """
    Model to store business settings.

    Attributes:
        business_name (CharField): The name of the business.
        ico (CharField): The business identification number (IČO).
        dic (CharField): The tax identification number (DIČ).
        contact_email (EmailField): The contact email address for the business.
        contact_phone (CharField): The contact phone number for the business.
        address (TextField): The address of the business.
        euro_rate (DecimalField): The exchange rate for Euro.

    Methods:
        clean():
            Ensures that only one instance of `BusinessSettings` is allowed.
        save(*args, **kwargs):
            Validates the instance before saving.
        get_settings():
            Retrieves the first (and only) instance of `BusinessSettings`.
    """

    business_name = models.CharField(max_length=200)
    ico = models.CharField(max_length=8, verbose_name="IČO")
    dic = models.CharField(max_length=10, verbose_name="DIČ")
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=20)
    address = models.TextField()
    euro_rate = models.DecimalField(max_digits=10, decimal_places=4)

    class Meta:
        verbose_name = "Business Settings"
        verbose_name_plural = "Business Settings"

    def clean(self):
        """
        Ensure only one instance of `BusinessSettings` exists.

        Raises:
            ValidationError: If more than one instance of `BusinessSettings` is created.
        """
        if BusinessSettings.objects.exists() and not self.pk:
            raise ValidationError("Only one instance of BusinessSettings is allowed.")

    def save(self, *args, **kwargs):
        """
        Save the `BusinessSettings` instance after validating it.

        Args:
            *args: Variable length argument list.
            **kwargs: Arbitrary keyword arguments.
        """
        self.full_clean()
        super().save(*args, **kwargs)

    @classmethod
    def get_settings(cls):
        """
        Retrieve the first instance of `BusinessSettings`.

        Returns:
            BusinessSettings: The first (and only) instance of `BusinessSettings`.
        """
        return cls.objects.first()
