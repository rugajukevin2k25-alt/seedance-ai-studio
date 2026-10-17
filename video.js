// Video generation module — intentionally separate from the prompt prototype.
// NOT IMPLEMENTED: I could not verify a documented, authorized "Seedance 2.5" API,
// so no endpoint is guessed here. Implement startVideo/getVideoStatus from your
// provider's official docs (auth header, upload format, supported durations,
// aspect ratios, resolutions, status polling, error codes).
export const videoConfigured = () => Boolean(process.env.VIDEO_API_BASE && process.env.VIDEO_API_KEY);

export async function startVideo(/* { image, mediaType, prompt, duration, aspect, resolution } */) {
  throw Object.assign(new Error('Video provider adapter not implemented yet'), { status: 501 });
}
export async function getVideoStatus(/* jobId */) {
  throw Object.assign(new Error('Video provider adapter not implemented yet'), { status: 501 });
}
