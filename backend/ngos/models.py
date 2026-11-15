
from django.db import models
from django.contrib.auth.models import User
from donors.models import Donation


class DonationRequest(models.Model):

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("accepted", "Accepted"),
        ("rejected", "Rejected"),
        ("completed", "Completed"),
    ]

    donation = models.ForeignKey(
        Donation,
        on_delete=models.CASCADE,
        related_name="requests"
    )

    ngo = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="food_requests"
    )

    message = models.TextField(blank=True)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["donation", "ngo"],
                name="unique_ngo_donation_request"
            )
        ]

    def __str__(self):
        return f"{self.ngo.username} - {self.donation.food_name}"
