import axios from 'axios';
import { asyncHandler } from '../middleware/errorHandler.js';

// Rachel is a well-liked, stable voice available on the free tier.
// Users can override via req.body.voiceId if they've cloned their own.
const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';

// Flash v2.5 is ~75ms latency and cheapest on characters — right choice
// for UI playback. Users can swap to `eleven_multilingual_v2` for higher
// quality long-form content via env var.
const DEFAULT_MODEL_ID = 'eleven_flash_v2_5';

// Hard cap to protect the free-tier quota. 10k chars/month disappears fast
// if a user tries to play a full document summary's worth of text in one go.
const MAX_CHARS = 2500;

/**
 * POST /api/tts/elevenlabs
 * Body: { text, voiceId?, modelId? }
 * Returns: audio/mpeg bytes (MP3)
 *
 * We stream the response directly to the client to avoid buffering large
 * audio blobs in Node memory — matters more on constrained Render free
 * tier instances.
 */
export const synthesize = asyncHandler(async (req, res) => {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return res.status(501).json({
      error:
        'ElevenLabs is not configured on this server. Falling back to browser TTS is recommended.',
    });
  }

  const { text, voiceId, modelId } = req.body || {};
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'text is required' });
  }

  // Clip to the free-tier budget. The frontend also clips, but enforcing
  // server-side is the only defence that actually matters.
  const clipped = text.slice(0, MAX_CHARS);

  const voice = voiceId || process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID;
  const model = modelId || process.env.ELEVENLABS_MODEL_ID || DEFAULT_MODEL_ID;

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voice}`;

  try {
    const upstream = await axios.post(
      url,
      {
        text: clipped,
        model_id: model,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0,
          use_speaker_boost: true,
        },
      },
      {
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        responseType: 'stream',
        timeout: 60_000,
      }
    );

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    upstream.data.pipe(res);
  } catch (err) {
    // Axios with responseType:'stream' buffers error bodies as streams too;
    // we need to collect the bytes to get a readable error message.
    let body = err.response?.data;
    if (body && typeof body.on === 'function') {
      try {
        const chunks = [];
        for await (const c of body) chunks.push(c);
        body = Buffer.concat(chunks).toString('utf8');
        try { body = JSON.parse(body); } catch { /* keep as string */ }
      } catch { /* give up on pretty errors */ }
    }
    const status = err.response?.status || 500;
    const msg =
      body?.detail?.message ||
      body?.detail ||
      body?.error ||
      (typeof body === 'string' ? body : null) ||
      err.message;
    res.status(status).json({ error: `ElevenLabs TTS failed: ${msg}` });
  }
});

/**
 * GET /api/tts/status — lets the frontend check whether ElevenLabs is
 * available at all without leaking whether a key is configured in the
 * response body of /synthesize.
 */
export const status = (_req, res) => {
  res.json({
    elevenlabsAvailable: Boolean(process.env.ELEVENLABS_API_KEY),
    maxChars: MAX_CHARS,
    defaultVoiceId: process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID,
  });
};
