// VocalTales - Main JavaScript Application

class VocalTalesApp {
    constructor() {
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.currentStory = null;
        this.speechSynthesis = window.speechSynthesis;
        this.currentUtterance = null;
        this.isPlaying = false;
        
        this.initializeApp();
    }
    
    initializeApp() {
        this.bindEvents();
        this.loadStoryLibrary();
        this.checkBrowserSupport();
    }
    
    bindEvents() {
        // Voice recording
        document.getElementById('recordBtn').addEventListener('click', () => this.toggleRecording());
        
        // Story generation
        document.getElementById('generateBtn').addEventListener('click', () => this.generateStory());
        
        // Story controls
        document.getElementById('playBtn').addEventListener('click', () => this.playStory());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pauseStory());
        document.getElementById('readAlongBtn').addEventListener('click', () => this.startReadAlong());
        document.getElementById('downloadAudioBtn').addEventListener('click', () => this.downloadAudio());
        document.getElementById('favoriteBtn').addEventListener('click', () => this.toggleFavorite());
        document.getElementById('newStoryBtn').addEventListener('click', () => this.createNewStory());
    }
    
    checkBrowserSupport() {
        const hasWebSpeech = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
        
        if (!hasWebSpeech) {
            console.warn('Web Speech API not supported in this browser');
            const recordBtn = document.getElementById('recordBtn');
            recordBtn.style.opacity = '0.5';
            recordBtn.title = 'Voice recognition requires Chrome, Edge, or Safari';
        } else {
            console.log('Web Speech API available - voice recognition enabled');
        }
        
        if (!window.speechSynthesis) {
            console.warn('Text-to-speech not supported in this browser');
        }
    }
    
    toggleRecording() {
        if (!this.isRecording) {
            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                this.startSpeechRecognition();
            } else {
                this.showError('Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari and type your story idea instead.');
            }
        } else {
            this.stopSpeechRecognition();
        }
    }
    
    startSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        // Set recognition language based on selected language
        const selectedLang = document.getElementById('language').value;
        const langMap = {
            'en': 'en-US', 'es': 'es-ES', 'fr': 'fr-FR', 'de': 'de-DE',
            'it': 'it-IT', 'pt': 'pt-PT', 'hi': 'hi-IN', 'zh': 'zh-CN',
            'ja': 'ja-JP', 'ko': 'ko-KR', 'ar': 'ar-SA', 'ru': 'ru-RU'
        };
        this.recognition.lang = langMap[selectedLang] || 'en-US';
        
        const recordBtn = document.getElementById('recordBtn');
        const recordText = recordBtn.querySelector('.record-text');
        const recordingStatus = document.getElementById('recordingStatus');
        
        this.recognition.onstart = () => {
            this.isRecording = true;
            recordBtn.classList.add('recording');
            recordText.textContent = 'Listening... Click to stop';
            recordingStatus.textContent = '🎤 Listening to your story idea...';
            recordingStatus.classList.remove('hidden');
        };
        
        this.recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }
            
            const textInput = document.getElementById('textInput');
            textInput.value = finalTranscript;
            
            if (interimTranscript) {
                recordingStatus.textContent = `🎤 "${interimTranscript}"`;
            }
        };
        
        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            recordingStatus.textContent = '❌ Could not understand. Please try again or type your idea.';
            this.stopSpeechRecognition();
        };
        
        this.recognition.onend = () => {
            this.stopSpeechRecognition();
        };
        
        this.recognition.start();
    }
    
    stopSpeechRecognition() {
        if (this.recognition) {
            this.recognition.stop();
            this.isRecording = false;
            
            const recordBtn = document.getElementById('recordBtn');
            const recordText = recordBtn.querySelector('.record-text');
            const recordingStatus = document.getElementById('recordingStatus');
            
            recordBtn.classList.remove('recording');
            recordText.textContent = 'Tell me your story idea!';
            recordingStatus.textContent = '✅ Got your idea! You can add more or generate your story.';
            
            setTimeout(() => {
                recordingStatus.classList.add('hidden');
            }, 3000);
        }
    }
    
    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];
            
            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };
            
            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                this.processAudioRecording(audioBlob);
            };
            
            this.mediaRecorder.start();
            this.isRecording = true;
            
            // Update UI
            const recordBtn = document.getElementById('recordBtn');
            const recordText = recordBtn.querySelector('.record-text');
            const recordingStatus = document.getElementById('recordingStatus');
            
            recordBtn.classList.add('recording');
            recordText.textContent = 'Recording... Click to stop';
            recordingStatus.textContent = '🎤 Listening to your story idea...';
            recordingStatus.classList.remove('hidden');
            
        } catch (error) {
            console.error('Error starting recording:', error);
            this.showError('Could not access microphone. Please check permissions.');
        }
    }
    
    stopRecording() {
        if (this.recognition) {
            this.stopSpeechRecognition();
        }
    }
    
    async processAudioRecording(audioBlob) {
        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.wav');
            
            const response = await fetch('/api/voice/upload/', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                document.getElementById('textInput').value = data.transcription;
                document.getElementById('recordingStatus').textContent = '✅ Voice processed successfully!';
                setTimeout(() => {
                    document.getElementById('recordingStatus').classList.add('hidden');
                }, 3000);
            } else {
                throw new Error(data.error || 'Failed to process audio');
            }
            
        } catch (error) {
            console.error('Error processing audio:', error);
            document.getElementById('recordingStatus').textContent = '❌ Could not process audio. Please try typing instead.';
            setTimeout(() => {
                document.getElementById('recordingStatus').classList.add('hidden');
            }, 5000);
        }
    }
    
    async generateStory() {
        const generateBtn = document.getElementById('generateBtn');
        const btnText = generateBtn.querySelector('.btn-text');
        const btnLoading = generateBtn.querySelector('.btn-loading');
        const loadingOverlay = document.getElementById('loadingOverlay');
        
        // Get form data
        const storyData = {
            voice_input: document.getElementById('textInput').value,
            genre: document.getElementById('genre').value,
            length: document.getElementById('length').value,
            language: document.getElementById('language').value,
            age_group: document.getElementById('ageGroup').value,
            characters: document.getElementById('characters').value,
            setting: document.getElementById('setting').value,
            moral_lesson: document.getElementById('moralLesson').value
        };
        
        // Validate input
        if (!storyData.voice_input.trim()) {
            this.showError('Please tell us your story idea by recording or typing!');
            return;
        }
        
        try {
            // Show loading state
            generateBtn.disabled = true;
            btnText.classList.add('hidden');
            btnLoading.classList.remove('hidden');
            loadingOverlay.classList.remove('hidden');
            
            const response = await fetch('/api/stories/create/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCSRFToken()
                },
                body: JSON.stringify(storyData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.currentStory = data.story;
                this.displayStory(data.story);
                this.loadStoryLibrary(); // Refresh library
            } else {
                throw new Error(data.error || 'Failed to generate story');
            }
            
        } catch (error) {
            console.error('Error generating story:', error);
            this.showError('Oops! Our storyteller is taking a break. Please try again!');
        } finally {
            // Hide loading state
            generateBtn.disabled = false;
            btnText.classList.remove('hidden');
            btnLoading.classList.add('hidden');
            loadingOverlay.classList.add('hidden');
        }
    }
    
    displayStory(story) {
        // Hide creator, show story
        document.getElementById('storyCreator').classList.add('hidden');
        document.getElementById('storyDisplay').classList.remove('hidden');
        
        // Populate story data
        document.getElementById('storyTitle').textContent = story.title;
        document.getElementById('storyText').textContent = story.content;
        document.getElementById('storyDuration').textContent = `⏱️ ${Math.ceil(story.estimated_duration / 60)} min`;
        document.getElementById('storyWords').textContent = `📖 ${story.word_count} words`;
        
        // Scroll to story
        document.getElementById('storyDisplay').scrollIntoView({ behavior: 'smooth' });
    }
    
    playStory() {
        if (!this.currentStory) {
            console.log('No current story');
            return;
        }
        
        const ttsMethod = document.getElementById('ttsMethod').value;
        const storyLanguage = this.currentStory.request?.language || 'en';
        let storyText = document.getElementById('storyText').textContent || this.currentStory.content;
        storyText = this.cleanTextForSpeech(storyText, storyLanguage);
        
        console.log('Playing story with', ttsMethod, 'in', storyLanguage);
        
        // Update UI
        document.getElementById('playBtn').classList.add('hidden');
        document.getElementById('pauseBtn').classList.remove('hidden');
        
        switch(ttsMethod) {
            case 'gtts':
                this.playWithGTTS(storyText, storyLanguage);
                break;
            case 'responsive':
                this.playWithResponsiveVoice(storyText, storyLanguage);
                break;
            case 'readalong':
                this.startReadAlong();
                break;
            default:
                this.playWithBrowserTTS(storyText, storyLanguage);
        }
    }
    
    async playWithGTTS(text, language) {
        try {
            console.log('Generating audio with gTTS for language:', language);
            
            const response = await fetch('/api/tts/gtts/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCSRFToken()
                },
                body: JSON.stringify({
                    text: text,
                    language: language
                })
            });
            
            if (response.ok) {
                const audioBlob = await response.blob();
                const audioUrl = URL.createObjectURL(audioBlob);
                this.currentAudio = new Audio(audioUrl);
                
                this.currentAudio.onended = () => {
                    console.log('gTTS audio ended');
                    document.getElementById('playBtn').classList.remove('hidden');
                    document.getElementById('pauseBtn').classList.add('hidden');
                    URL.revokeObjectURL(audioUrl);
                };
                
                this.currentAudio.onerror = (error) => {
                    console.error('Audio playback error:', error);
                    this.showError('Could not play audio');
                    document.getElementById('playBtn').classList.remove('hidden');
                    document.getElementById('pauseBtn').classList.add('hidden');
                };
                
                await this.currentAudio.play();
                console.log('gTTS audio started playing');
                
            } else {
                throw new Error('gTTS API failed');
            }
        } catch (error) {
            console.error('gTTS error:', error);
            this.showError('Google TTS failed. Trying browser voice...');
            this.playWithBrowserTTS(text, language);
        }
    }
    
    startReadAlong() {
        if (!this.currentStory) return;
        
        // Stop any existing audio
        this.pauseStory();
        
        const storyText = document.getElementById('storyText');
        const text = storyText.textContent;
        const words = text.split(/\s+/);
        
        // Clear existing highlights
        storyText.innerHTML = words.map(word => `<span class="word">${word}</span>`).join(' ');
        
        // Start visual reading
        this.highlightWords(words, 0);
        
        // Update UI
        document.getElementById('playBtn').classList.add('hidden');
        document.getElementById('pauseBtn').classList.remove('hidden');
    }
    
    highlightWords(words, index) {
        if (index >= words.length) {
            // Reading complete
            document.getElementById('playBtn').classList.remove('hidden');
            document.getElementById('pauseBtn').classList.add('hidden');
            return;
        }
        
        // Highlight current word
        const wordElements = document.querySelectorAll('.word');
        wordElements.forEach(el => el.classList.remove('highlight'));
        
        if (wordElements[index]) {
            wordElements[index].classList.add('highlight');
            wordElements[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        // Continue to next word
        const delay = words[index].length > 6 ? 800 : 600; // Longer words get more time
        this.readAlongTimeout = setTimeout(() => {
            this.highlightWords(words, index + 1);
        }, delay);
    }
    
    async downloadAudio() {
        if (!this.currentStory) return;
        
        const storyLanguage = this.currentStory.request?.language || 'en';
        let storyText = this.cleanTextForSpeech(
            document.getElementById('storyText').textContent || this.currentStory.content,
            storyLanguage
        );
        
        try {
            const response = await fetch('/api/tts/download/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCSRFToken()
                },
                body: JSON.stringify({
                    text: storyText,
                    language: storyLanguage,
                    title: this.currentStory.title
                })
            });
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${this.currentStory.title}.mp3`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                
                this.showSuccess('Audio downloaded successfully!');
            } else {
                throw new Error('Download failed');
            }
        } catch (error) {
            console.error('Download error:', error);
            this.showError('Could not download audio. Try the play button instead.');
        }
    }
    
    playWithResponsiveVoice(text, language) {
        // ResponsiveVoice language mapping
        const voiceMap = {
            'hi': 'Hindi Female',
            'en': 'US English Female',
            'es': 'Spanish Female',
            'fr': 'French Female',
            'de': 'Deutsch Female',
            'it': 'Italian Female',
            'pt': 'Portuguese Female',
            'zh': 'Chinese Female',
            'ja': 'Japanese Female',
            'ko': 'Korean Female',
            'ar': 'Arabic Female',
            'ru': 'Russian Female'
        };
        
        const voice = voiceMap[language] || 'US English Female';
        
        responsiveVoice.speak(text, voice, {
            rate: 0.8,
            pitch: 1,
            volume: 1,
            onstart: () => {
                console.log('ResponsiveVoice started');
                this.isPlaying = true;
            },
            onend: () => {
                console.log('ResponsiveVoice ended');
                this.isPlaying = false;
                document.getElementById('playBtn').classList.remove('hidden');
                document.getElementById('pauseBtn').classList.add('hidden');
            },
            onerror: (error) => {
                console.error('ResponsiveVoice error:', error);
                this.playWithBrowserTTS(text, language);
            }
        });
    }
    
    playWithBrowserTTS(text, language) {
        // Stop any existing speech
        this.speechSynthesis.cancel();
        
        // Create utterance
        this.currentUtterance = new SpeechSynthesisUtterance(text);
        this.currentUtterance.rate = 0.7;
        this.currentUtterance.pitch = 1.0;
        this.currentUtterance.volume = 1.0;
        
        // Language mapping
        const langMap = {
            'hi': 'hi-IN', 'es': 'es-ES', 'fr': 'fr-FR', 'de': 'de-DE',
            'it': 'it-IT', 'pt': 'pt-PT', 'zh': 'zh-CN', 'ja': 'ja-JP',
            'ko': 'ko-KR', 'ar': 'ar-SA', 'ru': 'ru-RU', 'en': 'en-US'
        };
        
        this.currentUtterance.lang = langMap[language] || 'en-US';
        
        // Event handlers
        this.currentUtterance.onstart = () => {
            console.log('Browser TTS started');
            this.isPlaying = true;
        };
        
        this.currentUtterance.onend = () => {
            console.log('Browser TTS ended');
            this.isPlaying = false;
            document.getElementById('playBtn').classList.remove('hidden');
            document.getElementById('pauseBtn').classList.add('hidden');
        };
        
        this.currentUtterance.onerror = (event) => {
            console.error('Browser TTS error:', event.error);
            document.getElementById('playBtn').classList.remove('hidden');
            document.getElementById('pauseBtn').classList.add('hidden');
            this.showError('Could not play story audio. Try installing language pack for ' + language.toUpperCase());
        };
        
        // Start speaking
        this.speechSynthesis.speak(this.currentUtterance);
    }
    
    pauseStory() {
        // Stop ResponsiveVoice if it's playing
        if (typeof responsiveVoice !== 'undefined' && responsiveVoice.isPlaying()) {
            responsiveVoice.cancel();
        }
        
        // Stop browser TTS if it's playing
        if (this.speechSynthesis.speaking) {
            this.speechSynthesis.cancel();
        }
        
        // Stop gTTS audio if playing
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
        }
        
        // Stop read-along if active
        if (this.readAlongTimeout) {
            clearTimeout(this.readAlongTimeout);
            this.readAlongTimeout = null;
            
            // Remove highlights
            const wordElements = document.querySelectorAll('.word');
            wordElements.forEach(el => el.classList.remove('highlight'));
            
            // Restore original text
            const storyText = document.getElementById('storyText');
            storyText.innerHTML = this.currentStory.content;
        }
        
        this.isPlaying = false;
        document.getElementById('playBtn').classList.remove('hidden');
        document.getElementById('pauseBtn').classList.add('hidden');
    }
    
    async toggleFavorite() {
        if (!this.currentStory) return;
        
        try {
            const response = await fetch(`/api/stories/${this.currentStory.id}/favorite/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': this.getCSRFToken()
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                const favoriteBtn = document.getElementById('favoriteBtn');
                const heartIcon = favoriteBtn.querySelector('.heart-icon');
                
                if (data.is_favorite) {
                    heartIcon.textContent = '❤️';
                    favoriteBtn.classList.add('favorited');
                } else {
                    heartIcon.textContent = '🤍';
                    favoriteBtn.classList.remove('favorited');
                }
                
                this.showSuccess(data.message);
            }
            
        } catch (error) {
            console.error('Error toggling favorite:', error);
            this.showError('Could not save favorite. Please try again!');
        }
    }
    
    createNewStory() {
        // Reset form
        document.getElementById('textInput').value = '';
        document.getElementById('characters').value = '';
        document.getElementById('setting').value = '';
        document.getElementById('moralLesson').value = '';
        
        // Show creator, hide story
        document.getElementById('storyDisplay').classList.add('hidden');
        document.getElementById('storyCreator').classList.remove('hidden');
        
        // Stop any playing audio
        if (this.speechSynthesis.speaking) {
            this.speechSynthesis.cancel();
        }
        
        this.currentStory = null;
        
        // Scroll to top
        document.getElementById('storyCreator').scrollIntoView({ behavior: 'smooth' });
    }
    
    cleanTextForSpeech(text, language) {
        try {
            let cleanText = text;
            
            // Remove language indicators
            cleanText = cleanText.replace(/\{[^}]*\}/g, '');
            
            // For Hindi, convert mixed words to pure Hindi or remove English parts
            if (language === 'hi') {
                // Replace common mixed words
                cleanText = cleanText.replace(/गOTHAM/g, 'गोथम');
                cleanText = cleanText.replace(/BATMAN/g, 'बैटमैन');
                cleanText = cleanText.replace(/JOKER/g, 'जोकर');
                
                // Remove standalone English words that might break TTS
                cleanText = cleanText.replace(/\b[A-Z][A-Z]+\b/g, '');
                
                // Clean up extra spaces
                cleanText = cleanText.replace(/\s+/g, ' ').trim();
            }
            
            console.log('Cleaned text:', cleanText);
            return cleanText;
        } catch (error) {
            console.error('Error cleaning text:', error);
            return text;
        }
    }
    
    async loadStoryLibrary() {
        try {
            const response = await fetch('/api/stories/');
            const stories = await response.json();
            
            const storiesList = document.getElementById('storiesList');
            storiesList.innerHTML = '';
            
            if (stories.length === 0) {
                storiesList.innerHTML = '<p style="text-align: center; color: white; font-size: 1.1rem;">No stories yet! Create your first magical tale above! ✨</p>';
                return;
            }
            
            stories.forEach(story => {
                const storyItem = document.createElement('div');
                storyItem.className = 'story-item';
                storyItem.innerHTML = `
                    <h3>${story.title}</h3>
                    <p>${story.content.substring(0, 150)}...</p>
                    <div style="margin-top: 10px; font-size: 0.8rem; color: #999;">
                        <span>📖 ${story.word_count} words</span>
                        <span style="margin-left: 15px;">⏱️ ${Math.ceil(story.estimated_duration / 60)} min</span>
                    </div>
                `;
                
                storyItem.addEventListener('click', () => {
                    this.currentStory = story;
                    this.displayStory(story);
                });
                
                storiesList.appendChild(storyItem);
            });
            
        } catch (error) {
            console.error('Error loading story library:', error);
        }
    }
    
    getCSRFToken() {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'csrftoken') {
                return value;
            }
        }
        return '';
    }
    
    showError(message) {
        // Simple error display - you can enhance this
        alert('❌ ' + message);
    }
    
    showSuccess(message) {
        // Simple success display - you can enhance this
        alert('✅ ' + message);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new VocalTalesApp();
});

// Load voices when they become available
window.speechSynthesis.onvoiceschanged = () => {
    console.log('Voices loaded:', window.speechSynthesis.getVoices().length);
};