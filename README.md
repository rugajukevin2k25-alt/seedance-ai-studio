# Seedance AI Studio (prototype v0.1)

Upload an image → analyze → generate a cinematic image-to-video prompt.
Video generation is a separate module (`lib/video.js`) and is **not implemented yet**.

## Status (be honest with yourself)
- Written but **not yet run or tested**: no network was available to install dependencies or call any API.
- Run the checklist below before trusting anything.

## Run locally
    npm install
    cp .env.example .env     # add keys if you have them
    npm start                # http://localhost:3000

Free mode: no keys needed. Prompts work from manually typed details.
Add `ANTHROPIC_API_KEY` to enable AI image analysis (uses your own paid API credit).

## Test checklist
1. Upload JPG, PNG, WEBP: preview, replace, remove work.
2. Upload a .gif or a renamed .txt: rejected. Upload >5 MB: rejected.
3. Without keys: type a subject, Generate / Regenerate / Copy work.
4. With ANTHROPIC_API_KEY: Analyze fills the fields.
5. `curl -X POST localhost:3000/api/video` returns 501 when unconfigured.

## Connect a Seedance API key
Use your provider's official docs (auth, image upload format, durations, aspect ratios,
resolutions, status polling, error codes). Set `VIDEO_API_BASE` and `VIDEO_API_KEY` in `.env`,
then implement `startVideo` / `getVideoStatus` in `lib/video.js` and add a status route and UI controls.
Only expose options the provider documents.

## Deploy free (Render)
New Web Service from your GitHub repo, build `npm install`, start `npm start`, add env vars in the dashboard.
Free instances sleep when idle.

## Privacy
Uploads are held in memory for the request only and never written to disk. When analysis is enabled, the image is sent to the vision provider.
