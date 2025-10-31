/**
 * ENStream Custom Chromecast Receiver
 *
 * This receiver handles authenticated audio streaming from ENStream Android app.
 * It receives media URLs and authentication headers from the sender and plays them.
 */

const context = cast.receiver.context;
const playerManager = context.getPlayerManager();
const messageBus = context.getMessageBus();

// Custom namespace for ENStream communication
const ENSTREAM_NAMESPACE = 'urn:x-cast:com.enstream.app.receiver';

// UI elements
const audioElement = document.getElementById('audioElement');
const trackTitle = document.getElementById('trackTitle');
const trackArtist = document.getElementById('trackArtist');
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stopBtn = document.getElementById('stopBtn');
const progressFill = document.getElementById('progressFill');
const currentTimeSpan = document.getElementById('currentTime');
const durationSpan = document.getElementById('duration');
const errorMessage = document.getElementById('errorMessage');

// State
let currentAuthHeader = null;
let currentMediaInfo = null;

// Initialize the receiver
console.log('ENStream Receiver initializing...');
context.start();

// Listen for messages from the sender app
messageBus.onMessage((event) => {
    const message = event.data;
    console.log('Received message:', message);

    if (message.type === 'LOAD_MEDIA') {
        loadMedia(message);
    } else if (message.type === 'PLAY') {
        audioElement.play();
    } else if (message.type === 'PAUSE') {
        audioElement.pause();
    } else if (message.type === 'STOP') {
        audioElement.pause();
        audioElement.src = '';
        updateUI();
    } else if (message.type === 'SET_AUTH') {
        currentAuthHeader = message.authHeader;
        console.log('Auth header updated');
    }
});

/**
 * Load and play media with authentication
 */
function loadMedia(message) {
    currentAuthHeader = message.authHeader;
    currentMediaInfo = message.media;

    if (!message.mediaUrl) {
        showError('No media URL provided');
        return;
    }

    console.log('Loading media:', message.mediaUrl);
    updateUI();

    // Create an XMLHttpRequest with auth header to fetch the audio
    // This allows us to add the Authorization header that Chromecast normally can't do
    fetch(message.mediaUrl, {
        headers: currentAuthHeader ? {
            'Authorization': currentAuthHeader,
            'Range': 'bytes=0-'
        } : {},
        mode: 'cors'
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.blob();
        })
        .then(blob => {
            // Create a blob URL for the audio
            const blobUrl = URL.createObjectURL(blob);
            audioElement.src = blobUrl;
            audioElement.play()
                .catch(err => {
                    console.error('Playback error:', err);
                    showError('Failed to play audio: ' + err.message);
                });
        })
        .catch(error => {
            console.error('Error loading media:', error);
            showError('Failed to load media: ' + error.message);
        });
}

/**
 * Update UI with current media info and playback state
 */
function updateUI() {
    if (currentMediaInfo) {
        trackTitle.textContent = currentMediaInfo.title || 'Unknown Title';
        trackArtist.textContent = currentMediaInfo.artist || '';
    } else {
        trackTitle.textContent = 'No media loaded';
        trackArtist.textContent = '';
    }
    clearError();
}

/**
 * Display error message
 */
function showError(message) {
    errorMessage.textContent = '⚠️ ' + message;
    errorMessage.style.display = 'block';
    console.error('Error:', message);
}

/**
 * Clear error message
 */
function clearError() {
    errorMessage.textContent = '';
    errorMessage.style.display = 'none';
}

/**
 * Format time in MM:SS
 */
function formatTime(seconds) {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Audio element event listeners
audioElement.addEventListener('play', () => {
    console.log('Playback started');
    playBtn.disabled = true;
    pauseBtn.disabled = false;
});

audioElement.addEventListener('pause', () => {
    console.log('Playback paused');
    playBtn.disabled = false;
    pauseBtn.disabled = true;
});

audioElement.addEventListener('timeupdate', () => {
    const progress = audioElement.duration > 0
        ? (audioElement.currentTime / audioElement.duration) * 100
        : 0;
    progressFill.style.width = progress + '%';
    currentTimeSpan.textContent = formatTime(audioElement.currentTime);
    durationSpan.textContent = formatTime(audioElement.duration);
});

audioElement.addEventListener('loadedmetadata', () => {
    durationSpan.textContent = formatTime(audioElement.duration);
});

audioElement.addEventListener('ended', () => {
    console.log('Playback ended');
    playBtn.disabled = false;
    pauseBtn.disabled = true;
});

audioElement.addEventListener('error', (e) => {
    console.error('Audio error:', e);
    showError('Audio playback error: ' + (audioElement.error?.message || 'Unknown error'));
});

// UI button handlers
playBtn.addEventListener('click', () => {
    audioElement.play().catch(err => {
        console.error('Play error:', err);
        showError('Failed to play: ' + err.message);
    });
});

pauseBtn.addEventListener('click', () => {
    audioElement.pause();
});

stopBtn.addEventListener('click', () => {
    audioElement.pause();
    audioElement.src = '';
    audioElement.currentTime = 0;
    playBtn.disabled = false;
    pauseBtn.disabled = true;
    progressFill.style.width = '0%';
    currentTimeSpan.textContent = '0:00';
});

// Log ready state
console.log('ENStream Receiver ready');
console.log('Custom namespace:', ENSTREAM_NAMESPACE);
