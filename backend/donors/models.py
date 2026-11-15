
from django.db import models
from django.contrib.auth.models import User


class Donation(models.Model):

    STATUS_CHOICES = [
        ("available", "Available"),
        ("reserved", "Reserved"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    AVAILABILITY_CHOICES = [
        ("free", "Free"),
        ("paid", "Paid"),
    ]

    donor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="food_donations"
    )

    food_name = models.CharField(max_length=200)
    description = models.TextField(blank=True)

    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=30, default="kg")
    servings = models.PositiveIntegerField(default=0)

    prepared_at = models.DateTimeField()
    expires_at = models.DateTimeField()

    pickup_address = models.TextField()

    # New fields
    availability_type = models.CharField(
        max_length=10,
        choices=AVAILABILITY_CHOICES,
        default="free"
    )

    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="available"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.food_name} - {self.donor.username}"

