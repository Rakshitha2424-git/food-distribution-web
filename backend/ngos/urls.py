
from django.urls import path
from django.db.models import Count, Sum, Q
from rest_framework.views import APIView
from donors.models import Donation
from .views import NGODashboardStatsView
from .views import (
    AvailableDonationListView,
    DonationRequestListCreateView,
)

urlpatterns = [
    path(
        "donations/",
        AvailableDonationListView.as_view(),
        name="available-donations"
    ),
    path(
        "requests/",
        DonationRequestListCreateView.as_view(),
        name="ngo-requests"
    ),
    path(
    "dashboard/",
    NGODashboardStatsView.as_view(),
    name="ngo-dashboard"
),
]
