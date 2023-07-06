from django.shortcuts import render, redirect, HttpResponse
from rest_framework import viewsets
from .serializers import TodoSerializer
from .models import Todo
from django.views.decorators.csrf import csrf_exempt
from .scripts import convert_schedule, test_calendar, test_event, get_users
import datetime
# Create your views here.

class TodoView(viewsets.ModelViewSet):
    serializer_class = TodoSerializer
    queryset = Todo.objects.all()

month_list = {
    "Jan": "01",
    "Feb": "02",
    "Mar": "03",
    "Apr": "04",
    "May": "05",
    "Jun": "06",
    "Jul": "07",
    "Aug": "08",
    "Sep": "09",
    "Oct": "10",
    "Nov": "11",
    "Dec": "12"
}



@csrf_exempt 
def upload_file(request):
    print (request.POST['date'])
    input_date = request.POST["date"]
    user= request.POST["user"]
    # gmail = request.POST["gmail"][:-10]
    month = month_list[input_date[:3]]
    year = input_date[4:]
    file_name = request.FILES['file']
    # print(file_name)
    # print(gmail)
    # contents = ''
    contents = convert_schedule(file_name, user, month, year)
    print("the contents are: ", contents) 
    return HttpResponse(contents)

@csrf_exempt 
def return_user_list(request):
    file_name = request.FILES['file']
    contents = get_users(file_name)
    return HttpResponse(contents)

@csrf_exempt 
def calendar_test(request):
    events = test_calendar()
    return HttpResponse(events) 

@csrf_exempt 
def event_test(request):
    new_event = test_event()
    return HttpResponse(new_event)

