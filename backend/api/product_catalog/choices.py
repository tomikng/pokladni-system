from django.db import models


class ColorChoices(models.TextChoices):
    """
    Enumeration of color choices.

    This class defines a set of color choices that can be used as a field in Django models.
    It uses Django's TextChoices to create a enum-like structure with human-readable names.

    Attributes:
        RED (str): Represents the red color, with "Červená" as the human-readable name.
        BLUE (str): Represents the blue color, with "Modrá" as the human-readable name.
        GREEN (str): Represents the green color, with "Zelená" as the human-readable name.
        YELLOW (str): Represents the yellow color, with "Žlutá" as the human-readable name.
    """

    RED = "RED", "Červená"
    BLUE = "BLUE", "Modrá"
    GREEN = "GREEN", "Zelená"
    YELLOW = "YELLOW", "Žlutá"


class TaxRateChoices(models.TextChoices):
    """
    Enumeration of tax rate choices.

    This class defines a set of tax rate choices that can be used as a field in Django models.
    It uses Django's TextChoices to create a enum-like structure with human-readable names.

    Attributes:
        TWENTY_ONE (str): Represents a 21% tax rate, stored as "0.21".
        TWELVE (str): Represents a 12% tax rate, stored as "0.12".
        ZERO (str): Represents a 0% tax rate, stored as "0.0".
    """

    TWENTY_ONE = "0.21", "21%"
    TWELVE = "0.12", "12%"
    ZERO = "0.0", "0%"
