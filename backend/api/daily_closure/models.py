from django.db import models
from authentication.models import CustomUser


class DailySummary(models.Model):
    """
    Model representing a daily summary of transactions for a cashier.

    This model stores various financial metrics for each cashier on a daily basis.

    Attributes:
        cashier (ForeignKey): Reference to the CustomUser who is the cashier.
        date (DateField): The date of the summary.
        total_sales (DecimalField): Total sales amount for the day.
        total_cash (DecimalField): Total cash transactions for the day.
        total_card (DecimalField): Total card transactions for the day.
        total_tips (DecimalField): Total tips received for the day.
        cash_difference (DecimalField): Any discrepancy in cash.
        closing_cash (DecimalField): Cash amount at closing.
        total_withdrawals (DecimalField): Total withdrawals made during the day.
    """

    cashier = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    date = models.DateField()
    total_sales = models.DecimalField(max_digits=10, decimal_places=2)
    total_cash = models.DecimalField(max_digits=10, decimal_places=2)
    total_card = models.DecimalField(max_digits=10, decimal_places=2)
    total_tips = models.DecimalField(max_digits=10, decimal_places=2)
    cash_difference = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    closing_cash = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    total_withdrawals = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    class Meta:
        unique_together = ('cashier', 'date')
        verbose_name = "Daily Summary"
        verbose_name_plural = "Daily Summaries"

    def __str__(self):
        """
        Returns a string representation of the DailySummary instance.
        """
        return f"{self.cashier} - {self.date}"


class Withdrawal(models.Model):
    """
    Model representing a cash withdrawal made by a cashier.

    This model tracks individual withdrawal transactions.

    Attributes:
        cashier (ForeignKey): Reference to the CustomUser who made the withdrawal.
        amount (DecimalField): The amount withdrawn.
        date (DateTimeField): The date and time of the withdrawal.
        note (TextField): Additional notes about the withdrawal (optional).
    """

    cashier = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateTimeField(auto_now_add=True)
    note = models.TextField(blank=True, null=True)

    def __str__(self):
        """
        Returns a string representation of the Withdrawal instance.
        """
        return f"{self.cashier.username} - {self.amount} - {self.date.strftime('%Y-%m-%d %H:%M:%S')}"
