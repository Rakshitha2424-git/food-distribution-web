from django.urls import path
from .views import DonorDashboardStatsView
from .views import (
    DonationListCreateView,
    DonationDetailView,
    CancelDonationView,
    DonorRequestListView,
    ManageDonationRequestView,
)

urlpatterns = [
    path(
        "donations/",
        DonationListCreateView.as_view(),
        name="donation-list-create"
    ),
    path(
        "donations/<int:pk>/",
        DonationDetailView.as_view(),
        name="donation-detail"
    ),
    path(
        "donations/<int:pk>/cancel/",
        CancelDonationView.as_view(),
        name="donation-cancel"
    ),
    path(
    "requests/",
    DonorRequestListView.as_view(),
    name="donor-requests"
),
path(
    "requests/<int:pk>/manage/",
    ManageDonationRequestView.as_view(),
    name="manage-donation-request"
),
path(
    "dashboard/",
    DonorDashboardStatsView.as_view(),
    name="donor-dashboard"
),
]
