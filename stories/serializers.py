from rest_framework import serializers
from .models import StoryRequest, GeneratedStory, StorySession, FavoriteStory, ChildProfile

class ChildProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChildProfile
        fields = ['id', 'name', 'age', 'favorite_genres', 'created_at']

class StoryRequestSerializer(serializers.ModelSerializer):
    genre_display = serializers.CharField(source='get_genre_display', read_only=True)
    length_display = serializers.CharField(source='get_length_display', read_only=True)
    
    class Meta:
        model = StoryRequest
        fields = [
            'id', 'voice_input', 'transcription', 'genre', 'genre_display',
            'length', 'length_display', 'age_group', 'characters', 'setting',
            'moral_lesson', 'created_at'
        ]

class GeneratedStorySerializer(serializers.ModelSerializer):
    request = StoryRequestSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = GeneratedStory
        fields = [
            'id', 'title', 'content', 'ai_model_used', 'status', 'status_display',
            'word_count', 'estimated_duration', 'created_at', 'updated_at', 'request'
        ]

class StorySessionSerializer(serializers.ModelSerializer):
    story = GeneratedStorySerializer(read_only=True)
    
    class Meta:
        model = StorySession
        fields = [
            'id', 'story', 'started_at', 'completed_at', 
            'duration_listened', 'rating'
        ]

class FavoriteStorySerializer(serializers.ModelSerializer):
    story = GeneratedStorySerializer(read_only=True)
    
    class Meta:
        model = FavoriteStory
        fields = ['id', 'story', 'saved_at']