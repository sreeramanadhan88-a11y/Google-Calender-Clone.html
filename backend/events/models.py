
from django.conf import settings
from django.db import models


class Event(models.Model):
    calendar = models.ForeignKey(
        "calendars.Calendar",
        on_delete=models.CASCADE,
        related_name="events",
        null=True,
        blank=True,
    )
    created_by = models.ForeignKey(
    settings.AUTH_USER_MODEL,
    on_delete=models.CASCADE,
    related_name="created_events",
)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    location = models.CharField(max_length=255, blank=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    all_day = models.BooleanField(default=False)
    color = models.CharField(max_length=7, default="#4285F4")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["start_time"]

    def __str__(self):
        return self.title
