
from django.db import models
from django.contrib.auth.models import User


class Profile(models.Model):

    ROLE_CHOICES = [
        ("donor", "Donor"),
        ("ngo", "NGO"),
    ]

    VERIFICATION_CHOICES = [
        ("pending", "Pending"),
        ("verified", "Verified"),
        ("rejected", "Rejected"),
        ("not_required", "Not Required"),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profile"
    )

    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    organization_name = models.CharField(max_length=200)
    phone = models.CharField(max_length=20, blank=True)

    # NGO verification details
    registration_number = models.CharField(
        max_length=100,
        blank=True,
        default=""
    )
    address = models.TextField(blank=True, default="")
    contact_person = models.CharField(
        max_length=150,
        blank=True,
        default=""
    )
    description = models.TextField(blank=True, default="")

    registration_certificate = models.FileField(
        upload_to="ngo_certificates/",
        blank=True,
        null=True
    )

    verification_status = models.CharField(
        max_length=20,
        choices=VERIFICATION_CHOICES,
        default="pending"
    )

    rejection_reason = models.TextField(blank=True, default="")

    def __str__(self):
        return f"{self.organization_name} ({self.role})"
