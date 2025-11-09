import os
import re
from groq import Groq
from django.conf import settings
from .models import StoryRequest, GeneratedStory

class GroqStoryGenerator:
    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY)
        self.model = "llama-3.1-8b-instant"
    
    def detect_language(self, text: str) -> str:
        """Simple language detection based on common words and patterns"""
        text_lower = text.lower()
        
        # Language patterns
        patterns = {
            'es': ['hola', 'gracias', 'por favor', 'sí', 'no', 'que', 'el', 'la', 'de', 'en', 'un', 'una'],
            'fr': ['bonjour', 'merci', 'oui', 'non', 'le', 'la', 'de', 'et', 'un', 'une', 'je', 'tu'],
            'de': ['hallo', 'danke', 'ja', 'nein', 'der', 'die', 'das', 'und', 'ich', 'du', 'ist'],
            'it': ['ciao', 'grazie', 'sì', 'no', 'il', 'la', 'di', 'e', 'un', 'una', 'io', 'tu'],
            'pt': ['olá', 'obrigado', 'sim', 'não', 'o', 'a', 'de', 'e', 'um', 'uma', 'eu', 'você'],
            'hi': ['नमस्ते', 'धन्यवाद', 'हाँ', 'नहीं', 'क्या', 'कैसे', 'कहाँ', 'कब'],
            'zh': ['你好', '谢谢', '是', '不', '什么', '怎么', '哪里', '什么时候'],
            'ja': ['こんにちは', 'ありがとう', 'はい', 'いいえ', '何', 'どう', 'どこ', 'いつ'],
            'ko': ['안녕하세요', '감사합니다', '네', '아니요', '무엇', '어떻게', '어디', '언제'],
            'ar': ['مرحبا', 'شكرا', 'نعم', 'لا', 'ما', 'كيف', 'أين', 'متى'],
            'ru': ['привет', 'спасибо', 'да', 'нет', 'что', 'как', 'где', 'когда']
        }
        
        # Count matches for each language
        scores = {}
        for lang, words in patterns.items():
            score = sum(1 for word in words if word in text_lower)
            if score > 0:
                scores[lang] = score
        
        # Return language with highest score, default to English
        return max(scores, key=scores.get) if scores else 'en'
    
    def generate_story(self, story_request: StoryRequest) -> GeneratedStory:
        """Generate a story based on the story request"""
        
        # Auto-detect language if not specified
        if not story_request.language or story_request.language == 'auto':
            detected_lang = self.detect_language(story_request.voice_input or story_request.transcription)
            story_request.language = detected_lang
            story_request.save()
        
        # Create the prompt based on user input
        prompt = self._create_story_prompt(story_request)
        
        try:
            # Generate story using Groq
            response = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "You are a creative children's storyteller. Create engaging, age-appropriate stories with positive messages and educational value. Always include a clear title and well-structured narrative."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                model=self.model,
                temperature=0.8,
                max_tokens=2000,
            )
            
            story_content = response.choices[0].message.content
            
            # Extract title and content
            title, content = self._parse_story_response(story_content)
            
            # Create GeneratedStory object
            generated_story = GeneratedStory.objects.create(
                request=story_request,
                title=title,
                content=content,
                ai_model_used=self.model,
                status='completed'
            )
            
            return generated_story
            
        except Exception as e:
            # Create failed story record
            generated_story = GeneratedStory.objects.create(
                request=story_request,
                title="Story Generation Failed",
                content=f"Sorry, we couldn't generate your story right now. Please try again! Error: {str(e)}",
                ai_model_used=self.model,
                status='failed'
            )
            return generated_story
    
    def _create_story_prompt(self, story_request: StoryRequest) -> str:
        """Create a detailed prompt for story generation"""
        
        length_mapping = {
            'short': '300-500 words',
            'medium': '500-800 words',
            'long': '800-1200 words'
        }
        
        language_names = {
            'en': 'English', 'es': 'Spanish', 'fr': 'French', 'de': 'German',
            'it': 'Italian', 'pt': 'Portuguese', 'hi': 'Hindi', 'zh': 'Chinese',
            'ja': 'Japanese', 'ko': 'Korean', 'ar': 'Arabic', 'ru': 'Russian'
        }
        
        language_name = language_names.get(story_request.language, 'English')
        
        prompt = f"""
Create a {story_request.genre} story for a {story_request.age_group}-year-old child.

Story Requirements:
- Length: {length_mapping.get(story_request.length, '500-800 words')}
- Genre: {story_request.get_genre_display()}
- Language: Write the entire story in {language_name}
- Age-appropriate for {story_request.age_group} years old

User Input: "{story_request.voice_input or story_request.transcription}"
"""
        
        if story_request.characters:
            prompt += f"\n- Include these characters: {story_request.characters}"
        
        if story_request.setting:
            prompt += f"\n- Setting: {story_request.setting}"
        
        if story_request.moral_lesson:
            prompt += f"\n- Include this moral lesson: {story_request.moral_lesson}"
        
        prompt += """

Please format your response as:
TITLE: [Story Title in {language_name}]

[Story content here in {language_name}...]

Make sure the story is:
- Written entirely in {language_name}
- Engaging and imaginative
- Age-appropriate with positive messages
- Educational and inspiring
- Safe for children (no violence, scary content, or inappropriate themes)
- Has a clear beginning, middle, and end
- Includes dialogue and descriptive language
- Uses simple vocabulary appropriate for the age group
"""
        
        return prompt
    
    def _parse_story_response(self, story_content: str) -> tuple:
        """Parse the AI response to extract title and content"""
        lines = story_content.strip().split('\n')
        
        title = "A Magical Story"
        content = story_content
        
        # Look for title in the response
        for i, line in enumerate(lines):
            if line.startswith('TITLE:'):
                title = line.replace('TITLE:', '').strip()
                # Join the remaining lines as content
                content = '\n'.join(lines[i+1:]).strip()
                break
            elif line.startswith('#'):
                title = line.replace('#', '').strip()
                content = '\n'.join(lines[i+1:]).strip()
                break
        
        return title, content

class VoiceTranscriptionService:
    """Service for handling voice transcription - browser-based only"""
    
    @staticmethod
    def transcribe_audio(audio_file) -> str:
        """
        Since we're using browser-based Web Speech API,
        this endpoint returns a message directing users to use the browser feature
        """
        return "Voice recognition is handled by your browser. Please use the microphone button on the webpage for real-time speech recognition."