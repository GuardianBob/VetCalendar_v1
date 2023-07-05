from django.urls import path
from . import views

urlpatterns = [
    path('upload_file', views.upload_file, name='upload_file'),
    path('calendar/test', views.calendar_test, name='calendar_test'),
    path('calendar/test_event', views.event_test, name='event_test'),
    path('return_user_list', views.return_user_list, name='return_user_list'),
]