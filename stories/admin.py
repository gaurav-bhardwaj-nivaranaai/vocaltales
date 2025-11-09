from django.contrib import admin
from .models import ChildProfile, StoryRequest, GeneratedStory, StorySession, FavoriteStory

@admin.register(ChildProfile)
class ChildProfileAdmin(admin.ModelAdmin):
    list_display = ['name', 'age', 'user', 'created_at']
    list_filter = ['age', 'created_at']
    search_fields = ['name', 'user__username']

@admin.register(StoryRequest)
class StoryRequestAdmin(admin.ModelAdmin):
    list_display = ['user', 'genre', 'length', 'age_group', 'created_at']
    list_filter = ['genre', 'length', 'age_group', 'created_at']
    search_fields = ['user__username', 'voice_input', 'transcription']
    readonly_fields = ['created_at']

@admin.register(GeneratedStory)
class GeneratedStoryAdmin(admin.ModelAdmin):
    list_display = ['title', 'status', 'word_count', 'estimated_duration', 'created_at']
    list_filter = ['status', 'ai_model_used', 'created_at']
    search_fields = ['title', 'content']
    readonly_fields = ['word_count', 'estimated_duration', 'created_at', 'updated_at']

@admin.register(StorySession)
class StorySessionAdmin(admin.ModelAdmin):
    list_display = ['user', 'story', 'started_at', 'duration_listened', 'rating']
    list_filter = ['rating', 'started_at']
    search_fields = ['user__username', 'story__title']

@admin.register(FavoriteStory)
class FavoriteStoryAdmin(admin.ModelAdmin):
    list_display = ['user', 'story', 'saved_at']
    list_filter = ['saved_at']
    search_fields = ['user__username', 'story__title']
