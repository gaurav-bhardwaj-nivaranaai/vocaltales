from django.urls import path
from . import views

app_name = 'stories'

urlpatterns = [
    # Web views
    path('', views.HomeView.as_view(), name='home'),
    
    # API endpoints
    path('api/stories/create/', views.CreateStoryView.as_view(), name='create_story'),
    path('api/stories/', views.StoryListView.as_view(), name='story_list'),
    path('api/stories/<int:pk>/', views.StoryDetailView.as_view(), name='story_detail'),
    path('api/stories/<int:story_id>/favorite/', views.FavoriteStoryView.as_view(), name='favorite_story'),
    path('api/voice/upload/', views.VoiceUploadView.as_view(), name='voice_upload'),
    path('api/stats/', views.story_stats, name='story_stats'),
    path('api/tts/gtts/', views.GTTSAudioView.as_view(), name='gtts_audio'),
]