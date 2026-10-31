
from rest_framework import serializers

from .models import Event


class EventSerializer(serializers.ModelSerializer):
    created_by = serializers.ReadOnlyField(
        source="created_by.username"
    )

    calendar_name = serializers.ReadOnlyField(
        source="calendar.name"
    )

    class Meta:
        model = Event

        fields = [
            "id",
            "calendar",
            "calendar_name",
            "created_by",
            "title",
            "description",
            "location",
            "start_time",
            "end_time",
            "event_type",
            "all_day",
            "color",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_by",
            "calendar_name",
            "created_at",
            "updated_at",
        ]

    def validate_calendar(self, value):
        if value and value.owner != self.context["request"].user:
            raise serializers.ValidationError(
                "You can only assign events to your own calendars."
            )

        return value

    def validate(self, data):
        start_time = data.get(
            "start_time",
            getattr(self.instance, "start_time", None),
        )

        end_time = data.get(
            "end_time",
            getattr(self.instance, "end_time", None),
        )

        if start_time and end_time and end_time <= start_time:
            raise serializers.ValidationError(
                {
                    "end_time": "End time must be after start time."
                }
            )

        return data
