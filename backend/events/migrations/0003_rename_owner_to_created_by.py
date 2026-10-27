
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("events", "0002_event_calendar"),
    ]

    operations = [
        migrations.RenameField(
            model_name="event",
            old_name="owner",
            new_name="created_by",
        ),
        migrations.AlterField(
            model_name="event",
            name="created_by",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="created_events",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
