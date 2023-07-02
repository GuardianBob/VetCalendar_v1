from django.shortcuts import render, redirect
from .models import User
from django.contrib import messages
from django.contrib.auth import logout
import bcrypt
from .forms import Register_Form, Login_Form

# Create your views here.
def login(request, login_form = Login_Form()):
  print("made it to views")
  context = {
    'login_form': login_form,
    'page_title': 'Login Form'    
  }
  return render(request, 'login.html', context)