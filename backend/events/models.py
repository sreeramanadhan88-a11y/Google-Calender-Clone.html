
from django.conf import settings
from django.db import models


class Event(models.Model):

    # Event type choices
    EVENT_TYPE_CHOICES = [
        ("event", "Event"),
        ("task", "Task"),
        ("appointment", "Appointment"),
    ]

    # Calendar relationship
    calendar = models.ForeignKey(
        "calendars.Calendar",
        on_delete=models.CASCADE,
        related_name="events",
        null=True,
        blank=True,
    )

    # User who created the event
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_events",
    )

    # Event information
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    location = models.CharField(max_length=255, blank=True)

    # Date and time
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()

    # Event type
    event_type = models.CharField(
        max_length=20,
        choices=EVENT_TYPE_CHOICES,
        default="event",
    )

    # Additional settings
    all_day = models.BooleanField(default=False)
    color = models.CharField(max_length=7, default="#4285F4")

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["start_time"]

    def __str__(self):
        return self.title
