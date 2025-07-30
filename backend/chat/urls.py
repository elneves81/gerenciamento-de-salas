# chat/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'conversations', views.ConversationViewSet, basename='conversation')
router.register(r'messages', views.MessageViewSet, basename='message')
router.register(r'notifications', views.NotificationViewSet, basename='notification')
router.register(r'notification-settings', views.NotificationSettingsViewSet, basename='notificationsettings')
router.register(r'users', views.UserViewSet, basename='user')

urlpatterns = [
    path('', include(router.urls)),
    path('push/subscribe/', views.PushSubscriptionViewSet.as_view({'post': 'subscribe'}), name='push-subscribe'),
    path('push/unsubscribe/', views.PushSubscriptionViewSet.as_view({'post': 'unsubscribe'}), name='push-unsubscribe'),
]
