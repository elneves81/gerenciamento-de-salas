from django.contrib import admin
from agendamento import admin_custom
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from django.http import HttpResponse

def welcome(request):
    return HttpResponse("""
        <html>
        <head><title>Bem-vindo</title></head>
        <body style='font-family:sans-serif;text-align:center;margin-top:10vh;'>
            <h1>Bem-vindo à API do Sistema de Agendamento de Salas!</h1>
            <p>Consulte <a href='/api/'>/api/</a> para acessar os endpoints.</p>
        </body>
        </html>
    """)

urlpatterns = [
    path('', welcome),
    path('admin/', admin.site.urls),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/', include('agendamento.urls')),
]
