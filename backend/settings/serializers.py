from rest_framework import serializers
from .models import BusinessSettings


class BusinessSettingsSerializer(serializers.ModelSerializer):
    """
    Serializer for the `BusinessSettings` model.

    This serializer provides validation to ensure that only one set of business settings exists
    and that the `euro_rate` field is a positive number.

    Meta:
        model (BusinessSettings): The model associated with this serializer.
        fields (str): The fields to be included in the serialization, all fields are included.

    Methods:
        validate(data):
            Validates that only one instance of `BusinessSettings` can be created.
        validate_euro_rate(value):
            Ensures the `euro_rate` is a positive number.
    """

    class Meta:
        model = BusinessSettings
        fields = '__all__'

    def validate(self, data):
        """
        Validate that only one instance of `BusinessSettings` exists.

        Args:
            data (dict): The data to validate.

        Raises:
            serializers.ValidationError: If more than one instance of `BusinessSettings` is attempted to be created.

        Returns:
            dict: The validated data.
        """
        if self.instance is None and BusinessSettings.objects.exists():
            raise serializers.ValidationError("Only one set of business settings is allowed.")
        return data

    @staticmethod
    def validate_euro_rate(value):
        """
        Validate that the `euro_rate` is a positive number.

        Args:
            value (float): The value to validate.

        Raises:
            serializers.ValidationError: If the `euro_rate` is not a positive number.

        Returns:
            float: The validated euro rate.
        """
        try:
            value = float(value)
        except ValueError:
            raise serializers.ValidationError("Euro rate must be a positive number.")

        if value <= 0:
            raise serializers.ValidationError("Euro rate must be a positive number.")
        return value
