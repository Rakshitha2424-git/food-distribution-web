from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView,
    LoginView,
    CurrentUserView,
    AdminDashboardStatsView,
    AdminUsersView,
    NGOVerificationView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("me/", CurrentUserView.as_view(), name="current-user"),

    # JWT token refresh
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),

    path(
        "admin/stats/",
        AdminDashboardStatsView.as_view(),
        name="admin-stats"
    ),
    path(
        "admin/users/",
        AdminUsersView.as_view(),
        name="admin-users"
    ),
    path(
        "admin/ngos/<int:user_id>/verification/",
        NGOVerificationView.as_view(),
        name="ngo-verification"
    ),
]
