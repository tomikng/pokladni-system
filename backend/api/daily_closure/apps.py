from django.apps import AppConfig


class DailyClosureConfig(AppConfig):
    """
    AppConfig for the 'daily_closure' Django app.

    This class configures the 'daily_closure' app within the Django project.

    Attributes:
        default_auto_field (str): Specifies the default auto field type for models
                                  in this app. Set to use BigAutoField.
        name (str): The Python dotted path to the application configuration class.
                    It defines the app's label used in various Django internals.
    """

    default_auto_field = "django.db.models.BigAutoField"
    name = "api.daily_closure"
