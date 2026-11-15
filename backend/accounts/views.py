
from django.contrib.auth.models import User

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated, BasePermission
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from rest_framework_simplejwt.tokens import RefreshToken

from .models import Profile
from .serializers import RegisterSerializer, AccountSerializer


# 1. Admin permission
class IsFoodBridgeAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_superuser
        )


# 2. Registration
class RegisterView(APIView):
    permission_classes = [AllowAny]

    # Required for NGO certificate uploads
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()

            # Generate JWT tokens immediately after registration
            refresh = RefreshToken.for_user(user)

            account_serializer = AccountSerializer(
                user,
                context={"request": request}
            )

            return Response({
                "message": "Registration successful.",
                "user": account_serializer.data,
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token)
                }
            }, status=status.HTTP_201_CREATED)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


# 3. Login
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")

        user = User.objects.filter(email=email).first()

        if not user or not user.check_password(password):
            raise AuthenticationFailed("Invalid email or password.")

        refresh = RefreshToken.for_user(user)

        account_serializer = AccountSerializer(
            user,
            context={"request": request}
        )

        return Response({
            "message": "Login successful.",
            "user": account_serializer.data,
            "tokens": {
                "refresh": str(refresh),
                "access": str(refresh.access_token)
            }
        }, status=status.HTTP_200_OK)


# 4. Current logged-in user
class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = AccountSerializer(
            request.user,
            context={"request": request}
        )
        return Response(serializer.data)


# 5. Admin dashboard statistics
class AdminDashboardStatsView(APIView):
    permission_classes = [IsFoodBridgeAdmin]

    def get(self, request):
        total_users = User.objects.count()

        total_donors = Profile.objects.filter(role="donor").count()
        total_ngos = Profile.objects.filter(role="ngo").count()

        pending_verifications = Profile.objects.filter(
            role="ngo",
            verification_status="pending"
        ).count()

        verified_ngos = Profile.objects.filter(
            role="ngo",
            verification_status="verified"
        ).count()

        return Response({
            "total_users": total_users,
            "total_donors": total_donors,
            "total_ngos": total_ngos,
            "pending_verifications": pending_verifications,
            "verified_ngos": verified_ngos
        })


# 6. Admin users list
class AdminUsersView(APIView):
    permission_classes = [IsFoodBridgeAdmin]

    def get(self, request):
        users = User.objects.all().order_by("-date_joined")

        serializer = AccountSerializer(
            users,
            many=True,
            context={"request": request}
        )

        return Response(serializer.data)


# 7. NGO approve/reject
class NGOVerificationView(APIView):
    permission_classes = [IsFoodBridgeAdmin]

    def patch(self, request, user_id):
        verification_status = request.data.get("verification_status")
        rejection_reason = request.data.get("rejection_reason", "").strip()

        if verification_status not in ["verified", "rejected"]:
            return Response(
                {"error": "Status must be 'verified' or 'rejected'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if verification_status == "rejected" and not rejection_reason:
            return Response(
                {"error": "Please provide a reason for rejection."},
                status=status.HTTP_400_BAD_REQUEST
            )

        profile = Profile.objects.filter(
            user_id=user_id,
            role="ngo"
        ).first()

        if not profile:
            return Response(
                {"error": "NGO account not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        profile.verification_status = verification_status

        if verification_status == "rejected":
            profile.rejection_reason = rejection_reason
        else:
            profile.rejection_reason = ""

        profile.save(
            update_fields=[
                "verification_status",
                "rejection_reason"
            ]
        )

        return Response({
            "message": f"NGO {verification_status} successfully.",
            "user_id": user_id,
            "verification_status": profile.verification_status,
            "rejection_reason": profile.rejection_reason
        })
