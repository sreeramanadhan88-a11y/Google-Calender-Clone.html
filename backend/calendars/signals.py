
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Calendar


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_calendars(sender, instance, created, **kwargs):
    if not created:
        return

    Calendar.objects.get_or_create(
        owner=instance,
        name="Personal",
        defaults={
            "color": "#4285F4",
            "is_default": True,
        },
    )

    Calendar.objects.get_or_create(
        owner=instance,
        name="Work",
        defaults={
            "color": "#0F9D58",
            "is_default": False,
        },
    )
