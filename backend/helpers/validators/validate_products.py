from django.forms import ValidationError


def validate_products(self, products):
    """
    Validate a list of products to ensure that their prices with VAT and quantities are positive numbers.

    This function iterates through a list of product data and performs the following checks:
    1. Ensures that the price with VAT is a positive number.
    2. Ensures that the quantity is a positive number.

    Args:
        self: The instance of the class containing this method.
        products (list of dict): A list of dictionaries where each dictionary contains product data.

    Returns:
        list of dict: The validated list of product data.

    Raises:
        ValidationError: If any of the validation checks fail with appropriate error messages.

    Example:
        >>> products = [
                {"price_with_vat": 120.0, "quantity": 10},
                {"price_with_vat": 100.0, "quantity": 5}
            ]
        >>> validate_products(self, products)
        [{"price_with_vat": 120.0, "quantity": 10}, {"price_with_vat": 100.0, "quantity": 5}]

    Errors:
        - "Price with VAT must be a positive number."
        - "Quantity must be a positive number."
    """
    for product_data in products:
        price_with_vat = product_data.get("price_with_vat")
        quantity = product_data.get("quantity")
        if price_with_vat is not None and price_with_vat <= 0:
            raise ValidationError("Price with VAT must be a positive number.")
        if quantity is not None and quantity <= 0:
            raise ValidationError("Quantity must be a positive number.")
    return products
