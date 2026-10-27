
from django.urls import path

from .views import (
    EventListCreateView,
    EventDetailView,
    CalendarView,
)


urlpatterns = [
    path("", EventListCreateView.as_view(), name="event-list-create"),
    path("calendar/", CalendarView.as_view(), name="event-calendar-view"),
    path("<int:pk>/", EventDetailView.as_view(), name="event-detail"),
]
