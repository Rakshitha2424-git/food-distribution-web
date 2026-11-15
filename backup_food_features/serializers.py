
from rest_framework import serializers

from donors.models import Donation
from .models import DonationRequest


class AvailableDonationSerializer(serializers.ModelSerializer):
    donor_name = serializers.CharField(
        source="donor.profile.organization_name",
        read_only=True
    )

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
            "created_at",
        ]


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

    class Meta:
        model = DonationRequest
        fields = [
            "id",
            "donation",
            "food_name",
            "donor_name",
            "ngo_name",
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
            "status",
            "created_at",
            "updated_at",
        ]

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
