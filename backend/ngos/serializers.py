
from urllib.parse import quote_plus

from rest_framework import serializers

from donors.models import Donation
from .models import DonationRequest


class AvailableDonationSerializer(serializers.ModelSerializer):

    donor_name = serializers.CharField(
        source="donor.profile.organization_name",
        read_only=True
    )

    pickup_maps_url = serializers.SerializerMethodField()

    class Meta:
        model = Donation

        fields = [
            "id",
            "donor_name",
            "food_name",
            "description",
            "quantity",
            "unit",
            "servings",
            "prepared_at",
            "expires_at",
            "pickup_address",
            "pickup_maps_url",
            "availability_type",
            "price",
            "created_at",
        ]

    def get_pickup_maps_url(self, obj):
        if not obj.pickup_address:
            return None

        return (
            "https://www.google.com/maps/search/?api=1&query="
            + quote_plus(obj.pickup_address)
        )


class DonationRequestSerializer(serializers.ModelSerializer):

    ngo_name = serializers.CharField(
        source="ngo.profile.organization_name",
        read_only=True
    )

    food_name = serializers.CharField(
        source="donation.food_name",
        read_only=True
    )

    donor_name = serializers.CharField(
        source="donation.donor.profile.organization_name",
        read_only=True
    )

    quantity = serializers.DecimalField(
        source="donation.quantity",
        max_digits=10,
        decimal_places=2,
        read_only=True
    )

    unit = serializers.CharField(
        source="donation.unit",
        read_only=True
    )

    pickup_address = serializers.CharField(
        source="donation.pickup_address",
        read_only=True
    )

    availability_type = serializers.CharField(
        source="donation.availability_type",
        read_only=True
    )

    price = serializers.DecimalField(
        source="donation.price",
        max_digits=10,
        decimal_places=2,
        read_only=True
    )

    pickup_maps_url = serializers.SerializerMethodField()

    donor_phone = serializers.SerializerMethodField()
    donor_email = serializers.SerializerMethodField()

    class Meta:
        model = DonationRequest

        fields = [
            "id",
            "donation",
            "food_name",
            "donor_name",
            "ngo_name",
            "quantity",
            "unit",
            "pickup_address",
            "pickup_maps_url",
            "availability_type",
            "price",
            "donor_phone",
            "donor_email",
            "message",
            "status",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "ngo_name",
            "food_name",
            "donor_name",
            "quantity",
            "unit",
            "pickup_address",
            "pickup_maps_url",
            "availability_type",
            "price",
            "donor_phone",
            "donor_email",
            "status",
            "created_at",
            "updated_at",
        ]

    def get_pickup_maps_url(self, obj):
        address = obj.donation.pickup_address

        if not address:
            return None

        return (
            "https://www.google.com/maps/search/?api=1&query="
            + quote_plus(address)
        )

    def can_view_donor_contact(self, obj):
        request = self.context.get("request")

        return (
            request
            and request.user.is_authenticated
            and request.user == obj.ngo
            and obj.status in ["accepted", "completed"]
        )

    def get_donor_phone(self, obj):
        if not self.can_view_donor_contact(obj):
            return None

        donor = obj.donation.donor

        if hasattr(donor, "profile"):
            return donor.profile.phone

        return None

    def get_donor_email(self, obj):
        if not self.can_view_donor_contact(obj):
            return None

        return obj.donation.donor.email

    def validate_donation(self, donation):

        if donation.status != "available":
            raise serializers.ValidationError(
                "This donation is no longer available."
            )

        if donation.donor == self.context["request"].user:
            raise serializers.ValidationError(
                "You cannot request your own donation."
            )

        return donation
