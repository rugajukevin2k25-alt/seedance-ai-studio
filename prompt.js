// Vision analysis (server-side key) + prompt building (free, no API needed).
const SNIFF = [
  ['image/jpeg', b => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff],
  ['image/png', b => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47],
  ['image/webp', b => b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP'],
];
export const sniffType = buf => (SNIFF.find(([, t]) => t(buf)) || [null])[0];
export const visionConfigured = () => Boolean(process.env.ANTHROPIC_API_KEY);

export async function analyzeImage(buf, mediaType) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.VISION_MODEL || 'claude-sonnet-4-6',
      max_tokens: 600,
      system: 'You describe images for video prompt writers. Only state what is visible or reasonably inferable. Use "unclear" when unsure. Never invent names, brands or text.',
      messages: [{ role: 'user', content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: buf.toString('base64') } },
        { type: 'text', text: 'Reply with JSON only: {"subject":"","setting":"","lighting":"","composition":"","style":""}. One short phrase each.' },
      ] }],
    }),
  });
  if (!res.ok) throw Object.assign(new Error('Vision request failed'), { status: res.status });
  const data = await res.json();
  const text = data.content?.map(c => c.text || '').join('') || '';
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('Could not parse analysis');
  const a = JSON.parse(m[0]);
  return Object.fromEntries(['subject', 'setting', 'lighting', 'composition', 'style'].map(k => [k, String(a[k] || 'unclear').slice(0, 200)]));
}

const STYLES = {
  cinematic: { look: 'anamorphic cinematic look, shallow depth of field, subtle film grain, graded teal-and-warm tones', sound: 'swelling orchestral score, soft ambient room tone' },
  realistic: { look: 'natural documentary realism, true-to-life color, handheld stability, no stylization', sound: 'authentic ambient sound, subtle foley' },
  anime: { look: 'hand-drawn anime animation, bold linework, painterly backgrounds, expressive motion', sound: 'light melodic score, whooshes and soft impacts' },
  'music video': { look: 'high-contrast stylized color, rhythmic motion, lens flares, energetic pacing', sound: 'driving beat that the cuts and movement lock to' },
  advertisement: { look: 'polished commercial lighting, clean premium look, product-forward framing', sound: 'upbeat modern bed, crisp sound design' },
  'social media': { look: 'vertical-friendly framing, punchy saturated color, fast clear motion in the first second', sound: 'trending-style hook beat, short sound accents' },
};
const CAMERA = ['slow push-in', 'gentle orbit to the right', 'slow dolly-out revealing the setting', 'smooth lateral tracking shot', 'subtle handheld drift', 'slow crane-up'];
const MOTION = ['moves with calm, natural motion', 'turns slightly and settles into a new pose', 'shifts weight as if mid-breath', 'responds to a light breeze'];
const TRANS = ['ends on a slow rack focus', 'closes with a soft fade', 'finishes on a held frame', 'ends with a gentle push toward the subject'];
const pick = (arr, n) => arr[Math.abs(n) % arr.length];

export function buildPrompt(a, style = 'cinematic', seed = 0) {
  const s = STYLES[style] || STYLES.cinematic;
  const subj = a.subject || 'the subject';
  return [
    `Image-to-video, ${style} style. Start from the provided image and keep ${subj} faithful to it.`,
    `Subject: ${subj} ${pick(MOTION, seed)}.`,
    `Environment: ${a.setting || 'the setting shown'}, with small ambient movement (dust, foliage, light shifts) where plausible.`,
    `Lighting: ${a.lighting || 'as in the image'}, evolving subtly across the shot.`,
    `Composition: ${a.composition || 'as in the image'}. Camera: ${pick(CAMERA, seed + 1)}.`,
    `Look: ${s.look}${a.style && a.style !== 'unclear' ? `, respecting the source style (${a.style})` : ''}.`,
    `Transition: ${pick(TRANS, seed + 2)}.`,
    `Sound: ${s.sound}.`,
    'Avoid: warped faces or hands, flicker, added text or logos, sudden scene changes.',
  ].join('\n');
}
