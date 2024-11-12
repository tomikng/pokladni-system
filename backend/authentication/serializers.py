from rest_framework import serializers

from .models import CustomUser


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for the `CustomUser` model. This serializer is used for
    serializing and deserializing `CustomUser` instances.

    Meta:
        model (CustomUser): The model associated with this serializer.
        fields (tuple): The fields to be included in the serialization.
        ref_name (str): A custom reference name for the serializer.
    """

    class Meta:
        model = CustomUser
        fields = (
            "username",
            "email",
            "role",
            "first_name",
            "last_name",
            "id",
            "is_active",
        )
        ref_name = "AuthUserSerializer"


class UserEditSerializer(serializers.ModelSerializer):
    """
    Serializer for editing `CustomUser` instances. This serializer allows
    updating specific fields of a `CustomUser` instance.

    Meta:
        model (CustomUser): The model associated with this serializer.
        fields (tuple): The fields to be included in the serialization.

    Methods:
        update(instance, validated_data):
            Updates the specified instance with validated data.
    """

    class Meta:
        model = CustomUser
        fields = (
            "username",
            "email",
            "role",
            "first_name",
            "last_name",
            "id",
            "is_active",
        )

    def update(self, instance, validated_data):
        """
        Update the specified `CustomUser` instance with the provided validated data.

        Args:
            instance (CustomUser): The `CustomUser` instance to update.
            validated_data (dict): The validated data to update the instance with.

        Returns:
            CustomUser: The updated `CustomUser` instance.
        """
        instance.username = validated_data.get("username", instance.username)
        instance.email = validated_data.get("email", instance.email)
        instance.role = validated_data.get("role", instance.role)
        instance.first_name = validated_data.get("first_name", instance.first_name)
        instance.last_name = validated_data.get("last_name", instance.last_name)
        instance.is_active = validated_data.get("is_active", instance.is_active)
        instance.save()
        return instance


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for registering new `CustomUser` instances. This serializer
    handles validation and creation of new `CustomUser` instances, including
    password validation.

    Attributes:
        password2 (CharField): A field for confirming the user's password.

    Meta:
        model (CustomUser): The model associated with this serializer.
        fields (list): The fields to be included in the serialization.
        extra_kwargs (dict): Additional keyword arguments for fields.

    Methods:
        save():
            Saves a new `CustomUser` instance with validated data.
    """

    password2 = serializers.CharField(style={"input_type": "password"}, write_only=True)

    class Meta:
        model = CustomUser
        fields = [
            "username",
            "email",
            "password",
            "password2",
            "role",
            "first_name",
            "last_name",
        ]
        extra_kwargs = {
            "password": {"write_only": True},
            "password2": {"write_only": True},
        }

    def save(self):
        """
        Save a new `CustomUser` instance with the provided validated data.

        Validates that the passwords match and creates a new user with the specified data.

        Raises:
            serializers.ValidationError: If the passwords do not match.

        Returns:
            CustomUser: The newly created `CustomUser` instance.
        """
        user = CustomUser(
            username=self.validated_data["username"],
            email=self.validated_data["email"],
            role=self.validated_data.get("role", "AD"),
            first_name=self.validated_data.get("first_name"),
            last_name=self.validated_data.get("last_name"),
        )
        password = self.validated_data["password"]
        password2 = self.validated_data["password2"]
        if password != password2:
            raise serializers.ValidationError({"password": "Passwords must match."})
        user.set_password(password)
        user.save()
        return user
