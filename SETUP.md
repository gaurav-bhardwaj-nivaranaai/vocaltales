# VocalTales Setup Instructions

## Prerequisites
- Python 3.8 or higher
- pip (Python package installer)

## Installation Steps

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Environment Configuration
1. Copy the `.env` file and update the values:
   - Get your Groq API key from: https://console.groq.com/
   - Update `GROQ_API_KEY` with your actual API key
   - Change `SECRET_KEY` for production use

### 3. Database Setup
```bash
# Create and apply migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser
```

### 4. Run the Development Server
```bash
python manage.py runserver
```

### 5. Access the Application
- Main App: http://127.0.0.1:8000/
- Admin Panel: http://127.0.0.1:8000/admin/

## API Endpoints

### Story Creation
- `POST /api/stories/create/` - Create new story
- `GET /api/stories/` - List all stories
- `GET /api/stories/{id}/` - Get specific story

### Voice Processing
- `POST /api/voice/upload/` - Upload voice recording

### Favorites
- `POST /api/stories/{id}/favorite/` - Toggle favorite status

### Statistics
- `GET /api/stats/` - Get story statistics

## Features

### ✅ Implemented (MVP)
- Voice recording with Web Speech API
- Text input fallback
- Story generation with Groq AI
- Text-to-speech narration
- Story preferences (genre, length, age)
- Story library and favorites
- Responsive child-friendly UI
- Basic user management

### 🚧 Future Enhancements
- User authentication and profiles
- Advanced voice transcription (Whisper API)
- Background music and sound effects
- Story sharing capabilities
- Parental controls
- Mobile app version
- Offline story caching
- Multi-language support

## Troubleshooting

### Common Issues

1. **Groq API Errors**
   - Ensure your API key is valid
   - Check your API quota/limits
   - Verify internet connection

2. **Voice Recording Not Working**
   - Check browser permissions for microphone
   - Use HTTPS in production (required for microphone access)
   - Test with different browsers

3. **Text-to-Speech Issues**
   - Browser compatibility varies
   - Some browsers require user interaction before TTS works
   - Check browser voice settings

### Browser Compatibility
- **Recommended**: Chrome, Firefox, Safari (latest versions)
- **Voice Recording**: Requires modern browser with MediaRecorder API
- **Text-to-Speech**: Requires browser with SpeechSynthesis API

## Development Notes

### Project Structure
```
vocaltales/
├── config/          # Django settings
├── stories/         # Main app
│   ├── models.py    # Database models
│   ├── views.py     # API views
│   ├── services.py  # AI and voice services
│   └── serializers.py # API serializers
├── templates/       # HTML templates
├── static/         # CSS, JS, images
└── media/          # User uploads
```

### Key Components
- **GroqStoryGenerator**: Handles AI story generation
- **VoiceTranscriptionService**: Processes voice recordings
- **VocalTalesApp**: Frontend JavaScript application

## Security Considerations

### Production Deployment
- Change `DEBUG=False`
- Use strong `SECRET_KEY`
- Configure proper `ALLOWED_HOSTS`
- Use HTTPS for voice recording
- Implement rate limiting
- Add CSRF protection
- Sanitize user inputs

### Child Safety
- Content filtering implemented in AI prompts
- No external links in stories
- Minimal data collection
- Secure file handling

## Support
For issues or questions, please check the troubleshooting section or create an issue in the repository.