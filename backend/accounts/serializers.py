
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from rest_framework import serializers

from .models import Profile


class RegisterSerializer(serializers.Serializer):

    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(
        write_only=True,
        validators=[validate_password]
    )
    role = serializers.ChoiceField(choices=["donor", "ngo"])
    organization_name = serializers.CharField(max_length=200)

    phone = serializers.CharField(
        max_length=20,
        required=False,
        allow_blank=True
    )

    registration_number = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True
    )
    address = serializers.CharField(required=False, allow_blank=True)
    contact_person = serializers.CharField(
        max_length=150,
        required=False,
        allow_blank=True
    )
    description = serializers.CharField(required=False, allow_blank=True)

    registration_certificate = serializers.FileField(
        required=False,
        allow_null=True
    )

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "An account with this email already exists."
            )
        return value.lower()

    def validate(self, attrs):
        if attrs["role"] == "ngo":
            required_fields = [
                "registration_number",
                "address",
                "contact_person",
                "description",
                "registration_certificate",
            ]

            missing_fields = [
                field for field in required_fields
                if not attrs.get(field)
            ]

            if missing_fields:
                raise serializers.ValidationError({
                    field: "This field is required for NGO registration."
                    for field in missing_fields
                })

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        role = validated_data.pop("role")
        organization_name = validated_data.pop("organization_name")

        profile_fields = {
            "phone": validated_data.pop("phone", ""),
            "registration_number": validated_data.pop(
                "registration_number", ""
            ),
            "address": validated_data.pop("address", ""),
            "contact_person": validated_data.pop("contact_person", ""),
            "description": validated_data.pop("description", ""),
            "registration_certificate": validated_data.pop(
                "registration_certificate", None
            ),
        }

        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"]
        )

        Profile.objects.create(
            user=user,
            role=role,
            organization_name=organization_name,
            verification_status=(
                "pending" if role == "ngo" else "not_required"
            ),
            **profile_fields
        )

        return user


class AccountSerializer(serializers.ModelSerializer):

    role = serializers.SerializerMethodField()
    organization_name = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()
    verification_status = serializers.SerializerMethodField()

    registration_number = serializers.SerializerMethodField()
    address = serializers.SerializerMethodField()
    contact_person = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    registration_certificate = serializers.SerializerMethodField()
    rejection_reason = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "role",
            "organization_name",
            "phone",
            "verification_status",
            "registration_number",
            "address",
            "contact_person",
            "description",
            "registration_certificate",
            "rejection_reason",
        ]

    def get_profile(self, obj):
        try:
            return obj.profile
        except Profile.DoesNotExist:
            return None

    def get_role(self, obj):
        if obj.is_superuser:
            return "admin"
        profile = self.get_profile(obj)
        return profile.role if profile else "user"

    def get_organization_name(self, obj):
        if obj.is_superuser:
            return "FoodBridge Administration"
        profile = self.get_profile(obj)
        return profile.organization_name if profile else ""

    def get_phone(self, obj):
        profile = self.get_profile(obj)
        return profile.phone if profile else ""

    def get_verification_status(self, obj):
        profile = self.get_profile(obj)
        return profile.verification_status if profile else "not_required"

    def get_registration_number(self, obj):
        profile = self.get_profile(obj)
        return profile.registration_number if profile else ""

    def get_address(self, obj):
        profile = self.get_profile(obj)
        return profile.address if profile else ""

    def get_contact_person(self, obj):
        profile = self.get_profile(obj)
        return profile.contact_person if profile else ""

    def get_description(self, obj):
        profile = self.get_profile(obj)
        return profile.description if profile else ""

    def get_registration_certificate(self, obj):
        profile = self.get_profile(obj)

        if not profile or not profile.registration_certificate:
            return None

        request = self.context.get("request")
        file_url = profile.registration_certificate.url

        if request:
            return request.build_absolute_uri(file_url)

        return file_url

    def get_rejection_reason(self, obj):
        profile = self.get_profile(obj)
        return profile.rejection_reason if profile else ""
