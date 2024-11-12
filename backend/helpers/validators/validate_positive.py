from django.core.exceptions import ValidationError


def validate_positive(value: int):
    if value <= 0:
        raise ValidationError("This field must be positive.")
