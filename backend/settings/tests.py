from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from authentication.models import CustomUser
from settings.models import BusinessSettings
from api.product_catalog.choices import ColorChoices, TaxRateChoices


class BusinessSettingsViewSetTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = CustomUser.objects.create_superuser(
            username="admin", password="adminpassword", role="AD", email="admin@example.com"
        )
        self.ca_user = CustomUser.objects.create_user(
            username="ca_user", password="capassword", role="CA", email="ca_user@example.com"
        )
        self.settings_data = {
            "business_name": "Test Business",
            "ico": "12345678",
            "dic": "CZ12345678",
            "contact_email": "test@business.com",
            "contact_phone": "+420123456789",
            "address": "Test Street 123, Test City",
            "euro_rate": 25.5,
        }

    def create_settings(self, user, data=None):
        self.client.force_authenticate(user=user)
        if data is None:
            data = self.settings_data
        return self.client.post(reverse('business-settings-list'), data, format="json")

    def test_create_business_settings(self):
        response = self.create_settings(self.admin_user)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(BusinessSettings.objects.count(), 1)

    def test_create_business_settings_unauthenticated(self):
        response = self.client.post(reverse('business-settings-list'), self.settings_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_business_settings_non_admin(self):
        response = self.create_settings(self.ca_user)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_duplicate_business_settings(self):
        BusinessSettings.objects.create(**self.settings_data)
        response = self.create_settings(self.admin_user)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def retrieve_settings(self, user, settings_id):
        self.client.force_authenticate(user=user)
        return self.client.get(reverse('business-settings-detail', args=[settings_id]), format="json")

    def test_retrieve_business_settings(self):
        settings = BusinessSettings.objects.create(**self.settings_data)
        response = self.retrieve_settings(self.admin_user, settings.id)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['business_name'], self.settings_data['business_name'])

    def update_settings(self, user, settings_id, data):
        self.client.force_authenticate(user=user)
        return self.client.patch(reverse('business-settings-detail', args=[settings_id]), data, format="json")

    def test_update_business_settings(self):
        settings = BusinessSettings.objects.create(**self.settings_data)
        updated_data = {"business_name": "Updated Business Name"}
        response = self.update_settings(self.admin_user, settings.id, updated_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['business_name'], "Updated Business Name")

    def test_update_business_settings_non_admin(self):
        settings = BusinessSettings.objects.create(**self.settings_data)
        updated_data = {"business_name": "Updated Business Name"}
        response = self.update_settings(self.ca_user, settings.id, updated_data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def delete_settings(self, user, settings_id):
        self.client.force_authenticate(user=user)
        return self.client.delete(reverse('business-settings-detail', args=[settings_id]), format="json")

    def test_delete_business_settings(self):
        settings = BusinessSettings.objects.create(**self.settings_data)
        response = self.delete_settings(self.admin_user, settings.id)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def list_settings(self, user):
        self.client.force_authenticate(user=user)
        return self.client.get(reverse('business-settings-list'), format="json")

    def test_list_business_settings(self):
        BusinessSettings.objects.create(**self.settings_data)
        response = self.list_settings(self.admin_user)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['business_name'], self.settings_data['business_name'])

    def test_list_business_settings_unauthenticated(self):
        BusinessSettings.objects.create(**self.settings_data)
        response = self.client.get(reverse('business-settings-list'), format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_business_settings_with_invalid_data(self):
        invalid_data = self.settings_data.copy()
        invalid_data['euro_rate'] = 'invalid'
        response = self.create_settings(self.admin_user, data=invalid_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_business_settings_with_invalid_data(self):
        settings = BusinessSettings.objects.create(**self.settings_data)
        invalid_data = {"euro_rate": 'invalid'}
        response = self.update_settings(self.admin_user, settings.id, invalid_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
