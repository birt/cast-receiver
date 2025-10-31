# ENStream Custom Chromecast Receiver

This is a custom Chromecast receiver application for ENStream that handles authenticated audio streaming. It allows the Chromecast device to play password-protected content from Easynews by receiving authentication headers from the Android sender app.

## How It Works

1. The ENStream Android app initiates casting and sends:
   - Media URL (from Easynews)
   - Authentication header (Basic auth for Easynews)
   - Media metadata (title, artist)

2. The custom receiver:
   - Receives messages via the Cast protocol
   - Uses the auth header to fetch media from Easynews
   - Plays the authenticated audio on Chromecast

## Registration with Google Cast SDK

To use this receiver, you need to register it with Google's Cast SDK. Follow these steps:

### 1. Create a Google Cast Developer Account

Visit: https://cast.google.com/publish/

- Sign in with your Google account
- Pay the $5 registration fee
- You get one custom receiver application

### 2. Register the Receiver Application

In the Cast Developer Console:

1. Click "Add New Application"
2. Select "Custom Receiver"
3. Fill in the form:
   - **Application Name**: `ENStream Audio Receiver`
   - **URL**: Point to where you'll host this receiver (see deployment below)
   - **Icon URL**: (optional) Your app icon
   - **Guest Mode**: Check if you want to allow guest casting
   - **Audio Only**: Check (since this is audio streaming)
   - **Device Families**: Select your Chromecast devices

4. Click "Publish" - you'll receive an **Application ID** (looks like `1234567890ABCDEF`)

### 3. Deploy the Receiver

Host the receiver files (`index.html` and `receiver.js`) on a public HTTPS web server:

**Option A: Using GitHub Pages (Free)**
```bash
# Create a gh-pages branch
git checkout --orphan gh-pages
git rm -rf .
cp cast-receiver/* .
git add .
git commit -m "Deploy ENStream receiver"
git push origin gh-pages
```

Your receiver URL will be: `https://yourusername.github.io/ENStream/cast-receiver/index.html`

**Option B: Using a Web Server**
- Host on any HTTPS server (Netlify, Vercel, AWS S3+CloudFront, etc.)
- Receiver URL: `https://your-domain.com/cast-receiver/index.html`

### 4. Update Android App

In the Android app, update `ENStreamCastOptionsProvider.kt`:

```kotlin
setReceiverApplicationId("YOUR_APPLICATION_ID_HERE")
```

Replace `YOUR_APPLICATION_ID_HERE` with the ID you received from Google.

## Technical Details

### Message Protocol

The receiver listens for messages on the custom namespace `urn:x-cast:com.enstream.app.receiver`:

**LOAD_MEDIA message:**
```json
{
  "type": "LOAD_MEDIA",
  "mediaUrl": "https://members.easynews.com/...",
  "authHeader": "Basic dXNlcjpwYXNz",
  "media": {
    "title": "Song Title",
    "artist": "Artist Name"
  }
}
```

**PLAY message:**
```json
{
  "type": "PLAY"
}
```

**PAUSE message:**
```json
{
  "type": "PAUSE"
}
```

**STOP message:**
```json
{
  "type": "STOP"
}
```

### Authentication Flow

1. Android app sends auth header to receiver
2. Receiver uses `fetch()` with Authorization header
3. Browser fetches audio blob from Easynews
4. Audio is played via HTML5 `<audio>` element

This approach works because the receiver code runs ON the Chromecast device itself, so it can make authenticated requests.

## Security Notes

- Auth headers are sent over the Cast protocol (encrypted by default on modern Chromecast devices)
- Audio is fetched directly from Easynews, not proxied
- The receiver is deployed on HTTPS only
- Never hardcode credentials in the receiver

## Testing

Before registering, you can test locally:

1. Serve the files locally: `python3 -m http.server 8000`
2. Access: `http://localhost:8000/index.html`
3. Open browser console to see debug logs
4. Use the Cast SDK test tools to send messages

## Troubleshooting

### "No media selected" error
- Ensure the Android app has valid Easynews credentials
- Check that the media URL is valid
- Verify auth header format

### Playback fails
- Check receiver console logs (Cast SDK debugging)
- Verify CORS headers are set correctly
- Ensure media URL is HTTPS

### Receiver not found
- Verify Application ID is correct in Android app
- Check receiver is deployed and HTTPS accessible
- Wait a few minutes after publishing for Google to propagate

## Development

To modify the receiver:

1. Edit `index.html` for UI changes
2. Edit `receiver.js` for functionality changes
3. Test locally before deploying
4. Re-publish to your hosting

## References

- [Google Cast Web Receiver Documentation](https://developers.google.com/cast/docs/web_receiver/basic)
- [Cast Protocol](https://developers.google.com/cast/docs/protocol)
- [Jellyfin Chromecast Receiver](https://github.com/jellyfin/jellyfin-chromecast) - Reference implementation
