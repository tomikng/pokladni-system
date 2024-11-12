from rest_framework.pagination import PageNumberPagination


class CustomPageNumberPagination(PageNumberPagination):
    """
    Custom pagination class that extends Django REST Framework's PageNumberPagination.

    This class provides customized pagination settings for API responses.

    Attributes:
        page_size (int): The default number of items to include on a page.
        page_size_query_param (str): The query parameter name for specifying the page size.
        max_page_size (int): The maximum allowable page size when specified by a client.
    """

    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 1000
