
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Calendar
from .serializers import CalendarSerializer


class CalendarListCreateView(generics.ListCreateAPIView):
    serializer_class = CalendarSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Calendar.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        is_default = serializer.validated_data.get("is_default", False)

        if is_default:
            Calendar.objects.filter(
                owner=self.request.user,
                is_default=True,
            ).update(is_default=False)

        serializer.save(owner=self.request.user)


class CalendarDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CalendarSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Calendar.objects.filter(owner=self.request.user)

    def perform_update(self, serializer):
        is_default = serializer.validated_data.get("is_default")

        if is_default is True:
            Calendar.objects.filter(
                owner=self.request.user,
                is_default=True,
            ).exclude(
                pk=self.get_object().pk
            ).update(is_default=False)

        serializer.save()
