from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission


class CustomUser(AbstractUser):
    """
    A custom user model extending Django's `AbstractUser` model.

    This model introduces a `role` field to classify users into one of three categories:
    Cashier (CA), Manager (MA), or Admin (AD). The default role for a superuser is set to Admin (AD).

    Attributes:
        ROLE_CHOICES (tuple): A tuple containing the available roles for users.
        role (CharField): A character field to store the role of the user, with a maximum length of 2 characters.
                          Defaults to 'AD' (Admin) for superusers.
        groups (ManyToManyField): A many-to-many relationship with the `Group` model, allowing users to be assigned to multiple groups.
        user_permissions (ManyToManyField): A many-to-many relationship with the `Permission` model, allowing users to have specific permissions.
    """

    ROLE_CHOICES = (
        ("CA", "Cashier"),
        ("MA", "Manager"),
        ("AD", "Admin"),
    )

    role = models.CharField(max_length=2, choices=ROLE_CHOICES, default="AD")
    groups = models.ManyToManyField(Group, related_name="custom_user_set")
    user_permissions = models.ManyToManyField(Permission, related_name="custom_user_set")

    def save(self, *args, **kwargs):
        """
        Overrides the save method to enforce the role setting for superusers.

        If the user is a superuser, the role is automatically set to 'AD' (Admin).

        Args:
            *args: Variable length argument list.
            **kwargs: Arbitrary keyword arguments.
        """
        if self.is_superuser:
            self.role = "AD"
        super().save(*args, **kwargs)
