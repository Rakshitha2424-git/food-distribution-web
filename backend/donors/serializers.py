
from rest_framework import serializers
from urllib.parse import quote_plus

from .models import Donation


class DonationSerializer(serializers.ModelSerializer):

    donor_name = serializers.CharField(
        source="donor.profile.organization_name",
        read_only=True
    )

    pickup_maps_url = serializers.SerializerMethodField()

    class Meta:
        model = Donation

        fields = [
            "id",
            "donor",
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
            "status",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "donor",
            "donor_name",
            "pickup_maps_url",
            "status",
            "created_at",
            "updated_at",
        ]

    def get_pickup_maps_url(self, obj):
        address = obj.pickup_address

        if not address:
            return None

        return (
            "https://www.google.com/maps/search/?api=1&query="
            + quote_plus(address)
        )

    def validate(self, data):

        prepared_at = data.get(
            "prepared_at",
            getattr(self.instance, "prepared_at", None)
        )

        expires_at = data.get(
            "expires_at",
            getattr(self.instance, "expires_at", None)
        )

        if prepared_at and expires_at and expires_at <= prepared_at:
            raise serializers.ValidationError(
                "Expiry time must be later than preparation time."
            )

        quantity = data.get(
            "quantity",
            getattr(self.instance, "quantity", None)
        )

        if quantity is not None and quantity <= 0:
            raise serializers.ValidationError(
                "Quantity must be greater than zero."
            )

        availability_type = data.get(
            "availability_type",
            getattr(self.instance, "availability_type", "free")
        )

        price = data.get(
            "price",
            getattr(self.instance, "price", 0)
        )

        if availability_type == "free":
            data["price"] = 0

        elif availability_type == "paid":
            if price is None or price <= 0:
                raise serializers.ValidationError({
                    "price": "Paid donations must have a price greater than zero."
                })

        else:
            raise serializers.ValidationError({
                "availability_type": "Choose either free or paid."
            })

        return data
