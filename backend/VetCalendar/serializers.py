from rest_framework import serializers
from .models import Todo, Calendar

class TodoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Todo
        fields = ('id', 'title', 'description', 'completed')

class CalendarSerializer(serializers.ModelSerializer):
    class Meta:
        model = Calendar
        fields = ('id', 'user_initials', 'shift', 'start', 'end', 'month', 'year')