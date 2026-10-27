
from django.urls import path
from .views import CalendarListCreateView, CalendarDetailView

urlpatterns = [
    path("", CalendarListCreateView.as_view(), name="calendar-list-create"),
    path("<int:pk>/", CalendarDetailView.as_view(), name="calendar-detail"),
]
