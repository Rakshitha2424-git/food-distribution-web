from django.db.models import Count, Sum
from django.db import transaction
from rest_framework.exceptions import ValidationError
from ngos.models import DonationRequest
from rest_framework import generics, permissions,status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import models
from django.utils import timezone

from .models import Donation
from .serializers import DonationSerializer


class IsDonor(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and hasattr(request.user, "profile")
            and request.user.profile.role == "donor"
        )


class DonationListCreateView(generics.ListCreateAPIView):
    serializer_class = DonationSerializer
    permission_classes = [permissions.IsAuthenticated, IsDonor]

    def get_queryset(self):
        return Donation.objects.filter(
            donor=self.request.user
        ).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(donor=self.request.user)


class DonationDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = DonationSerializer
    permission_classes = [permissions.IsAuthenticated, IsDonor]

    def get_queryset(self):
        return Donation.objects.filter(
            donor=self.request.user
        )


class CancelDonationView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsDonor]

    def post(self, request, pk):
        try:
            donation = Donation.objects.get(
                pk=pk,
                donor=request.user
            )
        except Donation.DoesNotExist:
            return Response(
                {"error": "Donation not found."},
                status=404
            )

        if donation.status != "available":
            raise ValidationError(
                "Only available donations can be cancelled."
            )

        donation.status = "cancelled"
        donation.save(update_fields=["status", "updated_at"])

        return Response({
            "message": "Donation cancelled successfully.",
            "donation": DonationSerializer(donation).data
        })

class DonorRequestListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated, IsDonor]

    def get_queryset(self):
        return DonationRequest.objects.filter(
            donation__donor=self.request.user
        ).select_related(
            "donation",
            "ngo"
        ).order_by("-created_at")

   
    def list(self, request, *args, **kwargs):

        requests = self.get_queryset()

        data = []

        for item in requests:

            donation = item.donation

            data.append({
                "id": item.id,
                "donation_id": donation.id,
                "food_name": donation.food_name,

                "ngo_name": item.ngo.profile.organization_name,
                "ngo_email": item.ngo.email,

                "quantity": str(donation.quantity),
                "unit": donation.unit,
                "pickup_address": donation.pickup_address,

                "availability_type": donation.availability_type,
                "price": str(donation.price),

                "message": item.message,
                "status": item.status,
                "created_at": item.created_at,
            })

        return Response(data)




class ManageDonationRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsDonor]

    def patch(self, request, pk):

        action = request.data.get("action")

        if action not in ["accept", "reject", "complete"]:
            raise ValidationError({
                "action": "Choose accept, reject, or complete."
            })

        with transaction.atomic():

            try:
                donation_request = (
                    DonationRequest.objects
                    .select_for_update()
                    .select_related("donation")
                    .get(
                        pk=pk,
                        donation__donor=request.user
                    )
                )

            except DonationRequest.DoesNotExist:
                return Response(
                    {"error": "Request not found."},
                    status=status.HTTP_404_NOT_FOUND
                )

            donation = Donation.objects.select_for_update().get(
                pk=donation_request.donation_id
            )

            if action == "accept":

                if donation_request.status != "pending":
                    raise ValidationError(
                        "Only pending requests can be accepted."
                    )

                if donation.status != "available":
                    raise ValidationError(
                        "This donation is no longer available."
                    )

                donation.status = "reserved"

                donation.save(
                    update_fields=["status", "updated_at"]
                )

                donation_request.status = "accepted"

                donation_request.save(
                    update_fields=["status", "updated_at"]
                )

                # Reject other pending requests for this donation.
                DonationRequest.objects.filter(
                    donation=donation,
                    status="pending"
                ).exclude(
                    pk=donation_request.pk
                ).update(
                    status="rejected",
                    updated_at=timezone.now()
                )

            elif action == "reject":

                if donation_request.status != "pending":
                    raise ValidationError(
                        "Only pending requests can be rejected."
                    )

                donation_request.status = "rejected"

                donation_request.save(
                    update_fields=["status", "updated_at"]
                )

            elif action == "complete":

                if donation_request.status != "accepted":
                    raise ValidationError(
                        "Only accepted requests can be completed."
                    )

                if donation.status != "reserved":
                    raise ValidationError(
                        "This donation is not reserved."
                    )

                donation_request.status = "completed"
                donation.status = "completed"

                donation_request.save(
                    update_fields=["status", "updated_at"]
                )

                donation.save(
                    update_fields=["status", "updated_at"]
                )

        return Response({
            "message": f"Request {action}ed successfully.",
            "request_id": donation_request.id,
            "request_status": donation_request.status,
            "donation_status": donation.status,
        })

class DonorDashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsDonor]

    def get(self, request):
        user = request.user

        donations = Donation.objects.filter(donor=user)
        requests = DonationRequest.objects.filter(
            donation__donor=user
        )

        donation_stats = donations.aggregate(
            total=Count("id"),
            available=Count(
                "id",
                filter=models.Q(status="available")
            ),
            reserved=Count(
                "id",
                filter=models.Q(status="reserved")
            ),
            completed=Count(
                "id",
                filter=models.Q(status="completed")
            ),
            meals=Sum(
                "servings",
                filter=models.Q(status="completed")
            )
        )

        request_stats = requests.aggregate(
            total=Count("id"),
            pending=Count(
                "id",
                filter=models.Q(status="pending")
            ),
            accepted=Count(
                "id",
                filter=models.Q(status="accepted")
            ),
            completed=Count(
                "id",
                filter=models.Q(status="completed")
            )
        )

        recent_donations = donations.order_by(
            "-created_at"
        )[:5]

        recent_activity = [
            {
                "id": donation.id,
                "food_name": donation.food_name,
                "quantity": str(donation.quantity),
                "unit": donation.unit,
                "servings": donation.servings,
                "status": donation.status,
                "created_at": donation.created_at,
            }
            for donation in recent_donations
        ]

        return Response({
            "role": "donor",
            "donations": {
                "total": donation_stats["total"],
                "available": donation_stats["available"],
                "reserved": donation_stats["reserved"],
                "completed": donation_stats["completed"],
            },
            "requests": {
                "total": request_stats["total"],
                "pending": request_stats["pending"],
                "accepted": request_stats["accepted"],
                "completed": request_stats["completed"],
            },
            "meals_redistributed": donation_stats["meals"] or 0,
            "recent_donations": recent_activity,
        })
