
from rest_framework import serializers

from .models import Event


class EventSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source="owner.username")

    class Meta:
        model = Event
        fields = [
            "id",
            "owner",
            "title",
            "description",
            "location",
            "start_time",
            "end_time",
            "all_day",
            "color",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "owner", "created_at", "updated_at"]

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
                {"end_time": "End time must be after start time."}
            )

        return data
