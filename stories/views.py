from django.shortcuts import render
from rest_framework import status, generics
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login
from django.http import HttpResponse
from .models import StoryRequest, GeneratedStory, StorySession, FavoriteStory, ChildProfile
from .serializers import (
    StoryRequestSerializer, GeneratedStorySerializer, 
    StorySessionSerializer, FavoriteStorySerializer,
    ChildProfileSerializer
)
from .services import GroqStoryGenerator, VoiceTranscriptionService
import json

class HomeView(APIView):
    """Home page view"""
    def get(self, request):
        return render(request, 'stories/index.html')

class CreateStoryView(APIView):
    """Create a new story from voice input or text"""
    
    def post(self, request):
        try:
            # Get or create anonymous user for demo
            user, created = User.objects.get_or_create(
                username='demo_user',
                defaults={'email': 'demo@vocaltales.com'}
            )
            
            data = request.data
            
            # Create story request
            story_request = StoryRequest.objects.create(
                user=user,
                voice_input=data.get('voice_input', ''),
                transcription=data.get('transcription', ''),
                genre=data.get('genre', 'adventure'),
                length=data.get('length', 'medium'),
                language=data.get('language', 'auto'),
                age_group=int(data.get('age_group', 6)),
                characters=data.get('characters', ''),
                setting=data.get('setting', ''),
                moral_lesson=data.get('moral_lesson', '')
            )
            
            # Generate story using Groq
            story_generator = GroqStoryGenerator()
            generated_story = story_generator.generate_story(story_request)
            
            # Serialize and return the generated story
            serializer = GeneratedStorySerializer(generated_story)
            
            return Response({
                'success': True,
                'story': serializer.data,
                'message': 'Story generated successfully!'
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e),
                'message': 'Failed to generate story'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class StoryListView(generics.ListAPIView):
    """List all stories for a user"""
    serializer_class = GeneratedStorySerializer
    
    def get_queryset(self):
        # For demo, show all stories
        return GeneratedStory.objects.filter(status='completed').order_by('-created_at')

class StoryDetailView(generics.RetrieveAPIView):
    """Get a specific story"""
    queryset = GeneratedStory.objects.all()
    serializer_class = GeneratedStorySerializer

class VoiceUploadView(APIView):
    """Handle voice file uploads and transcription"""
    
    def post(self, request):
        try:
            audio_file = request.FILES.get('audio')
            
            if not audio_file:
                return Response({
                    'success': False,
                    'error': 'No audio file provided'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Transcribe audio (placeholder implementation)
            transcription_service = VoiceTranscriptionService()
            transcription = transcription_service.transcribe_audio(audio_file)
            
            return Response({
                'success': True,
                'transcription': transcription,
                'message': 'Audio transcribed successfully'
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e),
                'message': 'Failed to process audio'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class FavoriteStoryView(APIView):
    """Add or remove stories from favorites"""
    
    def post(self, request, story_id):
        try:
            # Get or create demo user
            user, created = User.objects.get_or_create(
                username='demo_user',
                defaults={'email': 'demo@vocaltales.com'}
            )
            
            story = GeneratedStory.objects.get(id=story_id)
            
            favorite, created = FavoriteStory.objects.get_or_create(
                user=user,
                story=story
            )
            
            if created:
                message = 'Story added to favorites'
            else:
                favorite.delete()
                message = 'Story removed from favorites'
            
            return Response({
                'success': True,
                'message': message,
                'is_favorite': created
            })
            
        except GeneratedStory.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Story not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def story_stats(request):
    """Get basic statistics about stories"""
    try:
        total_stories = GeneratedStory.objects.filter(status='completed').count()
        total_requests = StoryRequest.objects.count()
        
        return Response({
            'total_stories': total_stories,
            'total_requests': total_requests,
            'success_rate': round((total_stories / total_requests * 100) if total_requests > 0 else 0, 2)
        })
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class GTTSAudioView(APIView):
    """Generate audio using Google Text-to-Speech"""
    
    def post(self, request):
        try:
            from gtts import gTTS
            import io
            
            text = request.data.get('text', '')
            language = request.data.get('language', 'en')
            
            if not text:
                return Response({
                    'error': 'No text provided'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Language mapping for gTTS
            gtts_lang_map = {
                'hi': 'hi', 'en': 'en', 'es': 'es', 'fr': 'fr',
                'de': 'de', 'it': 'it', 'pt': 'pt', 'zh': 'zh',
                'ja': 'ja', 'ko': 'ko', 'ar': 'ar', 'ru': 'ru'
            }
            
            gtts_lang = gtts_lang_map.get(language, 'en')
            
            # Generate TTS
            tts = gTTS(text=text, lang=gtts_lang, slow=False)
            
            # Create audio file in memory
            audio_buffer = io.BytesIO()
            tts.write_to_fp(audio_buffer)
            audio_buffer.seek(0)
            
            # Return audio file
            response = HttpResponse(audio_buffer.getvalue(), content_type='audio/mpeg')
            response['Content-Disposition'] = 'inline; filename="story_audio.mp3"'
            
            return response
            
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
