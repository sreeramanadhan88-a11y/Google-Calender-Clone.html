
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from rest_framework import serializers

from calendars.models import Calendar

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        validators=[validate_password],
    )

    class Meta:
        model = User
        fields = ["id", "username", "email", "password"]

    @transaction.atomic
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)

        Calendar.objects.get_or_create(
            owner=user,
            name="Personal",
            defaults={
                "color": "#4285F4",
                "is_default": True,
            },
        )

        Calendar.objects.get_or_create(
            owner=user,
            name="Work",
            defaults={
                "color": "#0F9D58",
                "is_default": False,
            },
        )

        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email"]
