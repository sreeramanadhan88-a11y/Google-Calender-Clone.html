
from rest_framework import serializers
from .models import Calendar


class CalendarSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source="owner.username")

    class Meta:
        model = Calendar
        fields = [
            "id",
            "owner",
            "name",
            "description",
            "color",
            "is_default",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "owner",
            "created_at",
            "updated_at",
        ]
