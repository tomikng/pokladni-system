from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.urls import reverse
from .models import CustomUser


class UserRegistrationTestCase(APITestCase):

    def setUp(self):
        self.admin_user = CustomUser.objects.create_superuser(
            username="admin", email="admin@example.com", password="adminpassword"
        )
        self.client = APIClient()

    def authenticate_as_admin(self):
        self.client.force_authenticate(user=self.admin_user)

    def test_successful_registration(self):
        self.authenticate_as_admin()
        data = {
            "username": "testuser",
            "email": "testuser@example.com",
            "password": "strong_password",
            "password2": "strong_password",
            "first_name": "Test",
            "last_name": "User",
            "role": "CA",
        }
        response = self.client.post(reverse("register"), data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_unsuccessful_registration_no_username(self):
        self.authenticate_as_admin()
        data = {
            "username": "",
            "email": "testuser@example.com",
            "password": "strong_password",
            "password2": "strong_password",
            "first_name": "Test",
            "last_name": "User",
            "role": "CA",
        }
        response = self.client.post(reverse("register"), data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unsuccessful_registration_wrong_password2(self):
        self.authenticate_as_admin()
        data = {
            "username": "test",
            "email": "testuser@example.com",
            "password": "strong_password1",
            "password2": "strong_password",
            "first_name": "Test",
            "last_name": "User",
            "role": "CA",
        }
        response = self.client.post(reverse("register"), data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_successful_registration_with_roles(self):
        self.authenticate_as_admin()
        for role in CustomUser.ROLE_CHOICES:
            data = {
                "username": f"testuser_{role[0]}",
                "email": f"test_{role[0]}@example.com",
                "password": "strong_password",
                "password2": "strong_password",
                "first_name": "Test",
                "last_name": f"User_{role[0]}",
                "role": role[0],
            }
            response = self.client.post(reverse("register"), data)
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_unsuccessful_registration_invalid_role(self):
        self.authenticate_as_admin()
        data = {
            "username": "testuser",
            "email": "testuser@example.com",
            "password": "strong_password",
            "password2": "strong_password",
            "first_name": "Test",
            "last_name": "User",
            "role": "INVALID_ROLE",
        }
        response = self.client.post(reverse("register"), data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class JWTTokenTestCase(APITestCase):

    def setUp(self):
        self.user = CustomUser.objects.create_user(
            username="testuser", password="testpassword", role="CA"
        )
        self.client = APIClient()

    def test_successful_token_generation(self):
        data = {"username": "testuser", "password": "testpassword"}
        response = self.client.post(reverse("login"), data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue("access" in response.data)
        self.assertTrue("refresh" in response.data)

    def test_unsuccessful_token_generation(self):
        data = {"username": "testuser", "password": "wrongpassword"}
        response = self.client.post(reverse("login"), data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_successful_token_refresh(self):
        data = {"username": "testuser", "password": "testpassword"}
        response = self.client.post(reverse("login"), data)
        refresh_token = response.data["refresh"]

        data = {"refresh": refresh_token}
        response = self.client.post(reverse("token_refresh"), data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue("access" in response.data)

    def test_unsuccessful_token_refresh(self):
        data = {"refresh": "invalid_refresh_token"}
        response = self.client.post(reverse("token_refresh"), data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_successful_token_verify(self):
        data = {"username": "testuser", "password": "testpassword"}
        response = self.client.post(reverse("login"), data)
        access_token = response.data["access"]

        data = {"token": access_token}
        response = self.client.post(reverse("token_verify"), data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_unsuccessful_token_verify(self):
        data = {"token": "invalid_access_token"}
        response = self.client.post(reverse("token_verify"), data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class UpdateRolePermissionsTestCase(APITestCase):

    def setUp(self):
        self.client = APIClient()
        self.admin_user = CustomUser.objects.create_superuser(
            username="admin", email="admin@example.com", password="adminpassword"
        )
        self.client.force_authenticate(self.admin_user)

        content_type = ContentType.objects.get_for_model(CustomUser)
        self.permission1 = Permission.objects.create(
            codename="can_add", name="Can Add Something", content_type=content_type
        )
        self.permission2 = Permission.objects.create(
            codename="can_edit", name="Can Edit Something", content_type=content_type
        )

    def test_update_role_permissions_success(self):
        data = {
            "new_permissions": {
                "CA": ["can_add"],
                "MA": ["can_add", "can_edit"],
            }
        }
        response = self.client.post(reverse("update_role_permissions"), data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Role permissions updated successfully")

    def test_update_role_permissions_unauthorized(self):
        self.client.logout()
        data = {
            "new_permissions": {
                "CA": ["can_add"],
                "MA": ["can_add", "can_edit"],
            }
        }
        response = self.client.post(reverse("update_role_permissions"), data, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class UserManagementTestCase(APITestCase):

    def setUp(self):
        self.default_user = CustomUser.objects.create_user(
            username="testuser", password="testpassword", role="CA"
        )
        self.admin_user = CustomUser.objects.create_superuser(
            username="admin", email="admin@example.com", password="adminpassword"
        )
        self.manager_user = CustomUser.objects.create_user(
            username="manager", email="manager@example.com", password="managerpassword", role="MA"
        )
        self.client = APIClient()

    def authenticate_as(self, user):
        self.client.force_authenticate(user=user)

    def test_direct_user_creation(self):
        self.authenticate_as(self.default_user)
        user = CustomUser.objects.create_user(
            username="direct_testuser",
            email="direct_testuser@example.com",
            password="direct_password",
            role="MA",
        )
        self.assertIsNotNone(user)
        self.assertEqual(user.role, "MA")

    def test_user_deletion_by_admin(self):
        user = CustomUser.objects.create_user(
            username="tobedeleted",
            email="tobedeleted@example.com",
            password="delete_password",
            role="CA",
        )
        user_id = user.id

        self.authenticate_as(self.admin_user)
        response = self.client.delete(reverse("user-detail", args=[user_id]))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        with self.assertRaises(CustomUser.DoesNotExist):
            CustomUser.objects.get(id=user_id)

    def test_user_deletion_by_manager(self):
        user = CustomUser.objects.create_user(
            username="tobedeleted",
            email="tobedeleted@example.com",
            password="delete_password",
            role="CA",
        )
        user_id = user.id

        self.authenticate_as(self.manager_user)
        response = self.client.delete(reverse("user-detail", args=[user_id]))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        with self.assertRaises(CustomUser.DoesNotExist):
            CustomUser.objects.get(id=user_id)

    def test_unauthorized_user_deletion(self):
        unauth_client = APIClient()
        user = CustomUser.objects.create_user(
            username="tobenotdeleted",
            email="tobenotdeleted@example.com",
            password="dont_delete_password",
            role="CA",
        )
        user_id = user.id

        response = unauth_client.delete(reverse("user-detail", args=[user_id]))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        user_exists = CustomUser.objects.filter(id=user_id).exists()
        self.assertTrue(user_exists)

    def test_user_edit_by_admin(self):
        user = CustomUser.objects.create_user(
            username="to_be_edited",
            email="original@example.com",
            password="original_password",
            role="CA",
        )
        self.authenticate_as(self.admin_user)

        edit_data = {"email": "new@example.com"}
        response = self.client.patch(reverse("user-detail", args=[user.id]), edit_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertEqual(user.email, "new@example.com")

    def test_user_edit_by_manager(self):
        user = CustomUser.objects.create_user(
            username="to_be_edited",
            email="original@example.com",
            password="original_password",
            role="CA",
        )
        self.authenticate_as(self.manager_user)

        edit_data = {"email": "new@example.com"}
        response = self.client.patch(reverse("user-detail", args=[user.id]), edit_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertEqual(user.email, "new@example.com")

    def test_unauthorized_user_edit(self):
        user1 = CustomUser.objects.create_user(
            username="user1", email="user1@example.com", password="password1", role="CA"
        )
        user2 = CustomUser.objects.create_user(
            username="user2", email="user2@example.com", password="password2", role="CA"
        )

        self.authenticate_as(user1)
        edit_data = {"email": "new_email_for_user2@example.com"}
        response = self.client.patch(reverse("user-detail", args=[user2.id]), edit_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_invalid_data(self):
        user = CustomUser.objects.create_user(
            username="testuser_invalid",
            email="testuser@example.com",
            password="testpassword",
            role="CA",
        )
        user_id = user.id

        self.authenticate_as(self.admin_user)
        edit_data = {"email": "invalid_email_format"}
        response = self.client.patch(reverse("user-detail", args=[user_id]), edit_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_role_change_by_admin(self):
        user = CustomUser.objects.create_user(
            username="testuser_role_change",
            email="testuser@example.com",
            password="testpassword",
            role="CA",
        )
        user_id = user.id

        self.authenticate_as(self.admin_user)
        edit_data = {"role": "MA"}
        response = self.client.patch(reverse("user-detail", args=[user_id]), edit_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertEqual(user.role, "MA")

    def test_invalid_role_change_by_admin(self):
        user = CustomUser.objects.create_user(
            username="testuser_role_change_invalid",
            email="testuser@example.com",
            password="testpassword",
            role="CA",
        )
        user_id = user.id

        self.authenticate_as(self.admin_user)
        edit_data = {"role": "INVALID_ROLE"}
        response = self.client.patch(reverse("user-detail", args=[user_id]), edit_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
