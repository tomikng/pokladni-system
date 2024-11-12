def can_modify_or_delete(request_user, target_user):
    """
    Determine if a `request_user` has the necessary permission to modify or delete a `target_user`.

    This function checks the role hierarchy and ensures that the `request_user` has a higher role level
    than the `target_user`.

    Args:
        request_user (CustomUser): The user making the request.
        target_user (CustomUser): The user being targeted for modification or deletion.

    Returns:
        bool: `True` if the `request_user` has a higher role level than the `target_user`, `False` otherwise.

    Example:
        >>> can_modify_or_delete(request_user, target_user)
        True
    """
    hierarchy = {"CA": 1, "MA": 2, "AD": 3}

    request_user_level = hierarchy.get(request_user.role, 0)
    target_user_level = hierarchy.get(target_user.role, 0)

    return request_user_level > target_user_level
