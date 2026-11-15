
from django.contrib import admin
from .models import Profile


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "role",
        "organization_name",
        "verification_status"
    )

    list_filter = ("role", "verification_status")

    search_fields = (
        "user__username",
        "user__email",
        "organization_name"
    )
