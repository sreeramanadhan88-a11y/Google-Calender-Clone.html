
from datetime import datetime, time, timedelta

from django.db.models import Q
from django.utils import timezone
from django.utils.dateparse import parse_date

from rest_framework import generics
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Event
from .serializers import EventSerializer


class EventListCreateView(generics.ListCreateAPIView):
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        events = Event.objects.filter(
            created_by=self.request.user
        )

        # Search events by title or description.
        search = self.request.query_params.get(
            "search", ""
        ).strip()

        if search:
            events = events.filter(
                Q(title__icontains=search)
                | Q(description__icontains=search)
            )

        # Filter events by start date.
        start_date_string = self.request.query_params.get(
            "start_date"
        )

        if start_date_string:
            start_date = parse_date(start_date_string)

            if start_date is None:
                raise ValidationError({
                    "start_date": "Use YYYY-MM-DD format."
                })

            start_datetime = timezone.make_aware(
                datetime.combine(start_date, time.min)
            )

            events = events.filter(
                end_time__gt=start_datetime
            )

        # Filter events by end date.
        end_date_string = self.request.query_params.get(
            "end_date"
        )

        if end_date_string:
            end_date = parse_date(end_date_string)

            if end_date is None:
                raise ValidationError({
                    "end_date": "Use YYYY-MM-DD format."
                })

            end_datetime = timezone.make_aware(
                datetime.combine(
                    end_date + timedelta(days=1),
                    time.min,
                )
            )

            events = events.filter(
                start_time__lt=end_datetime
            )

        return events.order_by("start_time")

    def perform_create(self, serializer):
        user = self.request.user

        # Get the calendar selected in the request.
        calendar = serializer.validated_data.get("calendar")

        # If no calendar was selected, use the user's default.
        if calendar is None:
            calendar = user.calendars.filter(
                is_default=True
            ).first()

        # Save the event with its creator and calendar.
        serializer.save(
            created_by=user,
            calendar=calendar,
        )


class EventDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Event.objects.filter(
            created_by=self.request.user
        )


class CalendarView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        view_type = request.query_params.get(
            "view", "month"
        ).lower()

        date_string = request.query_params.get("date")

        if view_type not in ["day", "week", "month", "agenda"]:
            raise ValidationError({
                "view": "Choose day, week, month, or agenda."
            })

        try:
            selected_date = (
                datetime.strptime(
                    date_string, "%Y-%m-%d"
                ).date()
                if date_string
                else timezone.localdate()
            )
        except ValueError:
            raise ValidationError({
                "date": "Use YYYY-MM-DD format."
            })

        events = Event.objects.filter(
            created_by=request.user
        ).select_related("calendar")

        # Agenda view: upcoming and currently active events.
        if view_type == "agenda":
            current_time = timezone.now()

            events = events.filter(
                end_time__gt=current_time
            ).order_by("start_time")[:50]

            serializer = EventSerializer(
                events,
                many=True,
                context={"request": request},
            )

            return Response({
                "view": view_type,
                "date": selected_date,
                "events": serializer.data,
            })

        # Day view.
        if view_type == "day":
            start_date = selected_date
            end_date = selected_date + timedelta(days=1)

        # Week view: Monday through Sunday.
        elif view_type == "week":
            start_date = selected_date - timedelta(
                days=selected_date.weekday()
            )
            end_date = start_date + timedelta(days=7)

        # Month view.
        else:
            start_date = selected_date.replace(day=1)

            if selected_date.month == 12:
                end_date = selected_date.replace(
                    year=selected_date.year + 1,
                    month=1,
                    day=1,
                )
            else:
                end_date = selected_date.replace(
                    month=selected_date.month + 1,
                    day=1,
                )

        start_datetime = timezone.make_aware(
            datetime.combine(start_date, time.min)
        )

        end_datetime = timezone.make_aware(
            datetime.combine(end_date, time.min)
        )

        # Include events that overlap the selected period.
        events = events.filter(
            start_time__lt=end_datetime,
            end_time__gt=start_datetime,
        ).order_by("start_time")

        serializer = EventSerializer(
            events,
            many=True,
            context={"request": request},
        )

        return Response({
            "view": view_type,
            "date": selected_date,
            "events": serializer.data,
        })
