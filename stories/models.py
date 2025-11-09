from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class ChildProfile(models.Model):
    AGE_CHOICES = [
        (4, '4 years'),
        (5, '5 years'),
        (6, '6 years'),
        (7, '7 years'),
        (8, '8 years'),
        (9, '9 years'),
        (10, '10 years'),
        (11, '11 years'),
        (12, '12 years'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    age = models.IntegerField(choices=AGE_CHOICES)
    favorite_genres = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name} ({self.age} years)"

class StoryRequest(models.Model):
    GENRE_CHOICES = [
        ('adventure', 'Adventure'),
        ('fairy_tale', 'Fairy Tale'),
        ('educational', 'Educational'),
        ('bedtime', 'Bedtime'),
        ('mystery', 'Mystery'),
        ('friendship', 'Friendship'),
    ]
    
    LENGTH_CHOICES = [
        ('short', 'Short (3-5 min)'),
        ('medium', 'Medium (5-8 min)'),
        ('long', 'Long (8-12 min)'),
    ]
    
    LANGUAGE_CHOICES = [
        ('en', 'English'),
        ('es', 'Spanish'),
        ('fr', 'French'),
        ('de', 'German'),
        ('it', 'Italian'),
        ('pt', 'Portuguese'),
        ('hi', 'Hindi'),
        ('zh', 'Chinese'),
        ('ja', 'Japanese'),
        ('ko', 'Korean'),
        ('ar', 'Arabic'),
        ('ru', 'Russian'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    voice_input = models.TextField(blank=True)
    transcription = models.TextField(blank=True)
    genre = models.CharField(max_length=20, choices=GENRE_CHOICES, default='adventure')
    length = models.CharField(max_length=10, choices=LENGTH_CHOICES, default='medium')
    language = models.CharField(max_length=5, choices=LANGUAGE_CHOICES, default='en')
    age_group = models.IntegerField(default=6)
    characters = models.CharField(max_length=200, blank=True)
    setting = models.CharField(max_length=200, blank=True)
    moral_lesson = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Story request by {self.user.username} - {self.genre}"

class GeneratedStory(models.Model):
    STATUS_CHOICES = [
        ('generating', 'Generating'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    request = models.OneToOneField(StoryRequest, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    content = models.TextField()
    ai_model_used = models.CharField(max_length=50, default='groq-llama')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='generating')
    word_count = models.IntegerField(default=0)
    estimated_duration = models.IntegerField(default=0)  # in seconds
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        if self.content:
            self.word_count = len(self.content.split())
            # Estimate 150 words per minute reading speed
            self.estimated_duration = int((self.word_count / 150) * 60)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.title} - {self.status}"

class StorySession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    story = models.ForeignKey(GeneratedStory, on_delete=models.CASCADE)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    duration_listened = models.IntegerField(default=0)  # in seconds
    rating = models.IntegerField(null=True, blank=True, choices=[(i, i) for i in range(1, 6)])
    
    def __str__(self):
        return f"{self.user.username} - {self.story.title}"

class FavoriteStory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    story = models.ForeignKey(GeneratedStory, on_delete=models.CASCADE)
    saved_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'story')
    
    def __str__(self):
        return f"{self.user.username} - {self.story.title}"
