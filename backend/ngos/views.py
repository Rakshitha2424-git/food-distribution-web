
from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from django.db.models import Count, Sum, Q
from rest_framework.views import APIView
from rest_framework.response import Response
from donors.models import Donation
from donors.models import Donation
from .models import DonationRequest
from .serializers import (
    AvailableDonationSerializer,
    DonationRequestSerializer,
)


class IsVerifiedNGO(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user

        return (
            user.is_authenticated
            and hasattr(user, "profile")
            and user.profile.role == "ngo"
            and user.profile.verification_status == "verified"
        )


class AvailableDonationListView(generics.ListAPIView):
    serializer_class = AvailableDonationSerializer
    permission_classes = [
        permissions.IsAuthenticated,
        IsVerifiedNGO
    ]

    def get_queryset(self):
        return Donation.objects.filter(
            status="available"
        ).exclude(
            donor=self.request.user
        ).order_by("-created_at")


class DonationRequestListCreateView(generics.ListCreateAPIView):
    serializer_class = DonationRequestSerializer
    permission_classes = [
        permissions.IsAuthenticated,
        IsVerifiedNGO
    ]

    def get_queryset(self):
        return DonationRequest.objects.filter(
            ngo=self.request.user
        ).select_related(
            "donation",
            "donation__donor",
            "ngo"
        ).order_by("-created_at")

    def perform_create(self, serializer):
        donation = serializer.validated_data["donation"]

        if donation.status != "available":
            from rest_framework.exceptions import ValidationError
            raise ValidationError(
                {"donation": "This donation is no longer available."}
            )

        if DonationRequest.objects.filter(
            donation=donation,
            ngo=self.request.user
        ).exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError(
                {"donation": "You have already requested this donation."}
            )

        serializer.save(ngo=self.request.user)

class NGODashboardStatsView(APIView):
    permission_classes = [
        permissions.IsAuthenticated,
        IsVerifiedNGO
    ]

    def get(self, request):
        user = request.user

        requests = DonationRequest.objects.filter(ngo=user)

        request_stats = requests.aggregate(
            total=Count("id"),
            pending=Count("id", filter=Q(status="pending")),
            accepted=Count("id", filter=Q(status="accepted")),
            completed=Count("id", filter=Q(status="completed")),
            meals=Sum(
                "donation__servings",
                filter=Q(status="completed")
            )
        )

        available_food = Donation.objects.filter(
            status="available"
        ).exclude(
            donor=user
        ).count()

        recent_requests = requests.select_related(
            "donation",
            "donation__donor"
        ).order_by("-created_at")[:5]

        recent_activity = [
            {
                "id": item.id,
                "food_name": item.donation.food_name,
                "donor_name": item.donation.donor.profile.organization_name,
                "status": item.status,
                "servings": item.donation.servings,
                "created_at": item.created_at,
            }
            for item in recent_requests
        ]

        return Response({
            "role": "ngo",
            "available_donations": available_food,
            "requests": {
                "total": request_stats["total"],
                "pending": request_stats["pending"],
                "accepted": request_stats["accepted"],
                "completed": request_stats["completed"],
            },
            "meals_received": request_stats["meals"] or 0,
            "recent_requests": recent_activity,
        })
