# Vet_Calendar_v2
 Vet Scheduler rebuilt with responsive frontend

## Setup
To initialize the virtual environment: pipenv shell
To install dependencies: pipenv install
To update: pipenv update

# IMPORTANT!!!
The following must be at the end of the .htaccess file for the frontend or there will be CORS errors when trying to hit the backend as well as 503 errors when reloading!!!
'''
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /sub/
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>
'''
# VetCalendar_v1
Calendar display for loaded vet shifts and google calendar sync
