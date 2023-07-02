from django.db import models

# Create your models here.


class User(models.Model):
  email = models.CharField(max_length=100)
  password = models.CharField(max_length=50)
  first_name = models.CharField(max_length=50)
  last_name = models.CharField(max_length=50)
  created_at = models.DateTimeField(auto_now_add=True)
  updated_at = models.DateTimeField(auto_now=True)
  @property
  def full_name(self):
    return f"{self.first_name} {self.last_name}"

class Address(models.Model):
  number = models.IntegerField()
  street= models.CharField(max_length=100)
  street2 = models.CharField(max_length=100, blank=True)
  apt_num = models.CharField(max_length=15, blank=True)
  user = models.ForeignKey(User, related_name='user_address', on_delete=models.CASCADE)  
  created_at = models.DateTimeField(auto_now_add=True)
  updated_at = models.DateTimeField(auto_now=True)
  @property
  def street_address(self):
    return f"{self.number} {self.street} {self.street2} {self.apt} {CityState.city} {CityState.state} {CityState.zipcode}"
    # NOTE: Double check, the city, state and zip here may not work
  
class CityState(models.Model):
  city = models.CharField(max_length=100)
  state = models.CharField(max_length=10)
  user = models.ForeignKey(User, related_name='user_city_state', on_delete=models.CASCADE)
  created_at = models.DateTimeField(auto_now_add=True)
  updated_at = models.DateTimeField(auto_now=True)
  @property
  def zipcode(self):
    return f"{self.city_zip}"
  # NOTE: double check this actually works.

class Zipcode(models.Model):
  zipcode = models.IntegerField()
  city = models.ForeignKey(CityState, related_name='city_zip', on_delete=models.CASCADE)
  created_at = models.DateTimeField(auto_now_add=True)
  updated_at = models.DateTimeField(auto_now=True)

class User_Level(models.Model):
  level_name = models.CharField(max_length=50, default=0)
  user = models.ForeignKey(User, related_name='user_level', on_delete=models.CASCADE)
  created_at = models.DateTimeField(auto_now_add=True)
  updated_at = models.DateTimeField(auto_now=True)

class User_Type(models.Model):
  type_name = models.CharField(max_length=50, default=0)
  user = models.ForeignKey(User, related_name='user_type', on_delete=models.CASCADE)
  created_at = models.DateTimeField(auto_now_add=True)
  updated_at = models.DateTimeField(auto_now=True)
