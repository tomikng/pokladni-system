from django.core.exceptions import ValidationError


def check_vat(price_without_vat, price_with_vat, tax_rate):
    """
    Validate that the price with VAT is correctly calculated based on the price without VAT and the tax rate.

    This function performs the following checks:
    1. Ensures that the price with VAT is greater than the price without VAT.
    2. Ensures that the tax rate is positive.
    3. Ensures that the difference between the price with VAT and the price without VAT corresponds to the tax rate.

    Args:
        price_without_vat (float): The price of the product without VAT.
        price_with_vat (float): The price of the product including VAT.
        tax_rate (float): The applicable tax rate.

    Raises:
        ValidationError: If any of the validation checks fail with appropriate error messages.

    Example:
        >>> check_vat(100.0, 120.0, 20.0)
        None

    Errors:
        - "Price with VAT must be greater than price without VAT."
        - "Tax rate must be positive."
        - "Price with VAT does not correspond to tax rate. Expected: {expected_difference}, got: {difference}"
    """
    if price_with_vat <= price_without_vat:
        raise ValidationError("Price with VAT must be greater than price without VAT.")

    if tax_rate <= 0:
        raise ValidationError("Tax rate must be positive.")

    difference = price_with_vat - price_without_vat
    expected_difference = (tax_rate / 100) * price_without_vat

    if difference != expected_difference:
        raise ValidationError(
            f"Price with VAT does not correspond to tax rate. Expected: {expected_difference}, got: {difference}"
        )
