from rest_framework import serializers
from .models import DailySummary, Withdrawal


class DailySummarySerializer(serializers.ModelSerializer):
    """
    Serializer for the DailySummary model.

    This serializer is used to convert DailySummary model instances into JSON representations
    and vice versa. It includes all fields from the DailySummary model.

    Attributes:
        model (Model): The Django model class being serialized.
        fields (str): Specifies which fields should be included in the serialized output.
    """

    class Meta:
        model = DailySummary
        fields = '__all__'


class WithdrawalSerializer(serializers.ModelSerializer):
    """
    Serializer for the Withdrawal model.

    This serializer is used to convert Withdrawal model instances into JSON representations
    and vice versa. It includes all fields from the Withdrawal model.

    Attributes:
        model (Model): The Django model class being serialized.
        fields (str): Specifies which fields should be included in the serialized output.
    """

    class Meta:
        model = Withdrawal
        fields = '__all__'
