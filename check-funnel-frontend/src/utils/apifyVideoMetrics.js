const AUDIENCE_PLATFORMS = new Set(['facebook', 'instagram']);
const APIFY_VIDEO_METRIC_PLATFORMS = new Set(['facebook', 'instagram', 'tiktok']);

export function isAudiencePlatform(platform) {
  return AUDIENCE_PLATFORMS.has(String(platform || '').toLowerCase());
}

export function canUseApifyVideoViewsMetric(platform, analyzeMethod) {
  return analyzeMethod === 'apify' && APIFY_VIDEO_METRIC_PLATFORMS.has(String(platform || '').toLowerCase());
}

function firstValue(...values) {
  return values.find(value => value !== undefined && value !== null && value !== '');
}

function includesVideoText(value) {
  return String(value || '').toLowerCase().includes('video')
    || String(value || '').toLowerCase().includes('reel')
    || String(value || '').toLowerCase().includes('tv');
}

function includesImageText(value) {
  return String(value || '').toLowerCase().includes('image')
    || String(value || '').toLowerCase().includes('photo')
    || String(value || '').toLowerCase().includes('album')
    || String(value || '').toLowerCase().includes('carousel');
}

function mediaHasVideo(media) {
  if (!media) return false;
  const mediaItems = Array.isArray(media) ? media : [media];

  return mediaItems.some(item => {
    if (!item || typeof item !== 'object') return false;
    return includesVideoText(firstValue(
      item.type,
      item.mediaType,
      item.media_type,
      item.productType,
      item.product_type,
      item.__typename,
      item.url,
      item.videoUrl,
    ));
  });
}

export function isVideoPost(post) {
  const platform = String(post?.platform || '').toLowerCase();
  if (platform === 'tiktok') return true;

  const raw = post?.rawData || post?.rawExtensionData || {};
  const postUrl = String(firstValue(post?.postUrl, raw.url, raw.postUrl, raw.webVideoUrl) || '').toLowerCase();

  if (
    postUrl.includes('/reel/')
    || postUrl.includes('/tv/')
    || postUrl.includes('/video/')
    || postUrl.includes('/videos/')
    || postUrl.includes('/watch')
  ) {
    return true;
  }

  if (mediaHasVideo(post?.media) || mediaHasVideo(raw.media)) return true;

  const typeHint = firstValue(
    raw.type,
    raw.mediaType,
    raw.media_type,
    raw.productType,
    raw.product_type,
    raw.__typename,
    post?.type,
  );

  if (includesVideoText(typeHint)) return true;
  if (includesImageText(typeHint)) return false;

  if (raw.videoUrl || raw.videoMeta || raw.videoPlayCount || raw.videoViewCount) return true;

  return isAudiencePlatform(platform) && Number(post?.views) > 0;
}

export function engagementValue(post) {
  return (Number(post?.likes) || 0)
    + (Number(post?.commentsCount) || 0)
    + (Number(post?.shares) || 0);
}

export function viewValue(post) {
  return Number(post?.views) || 0;
}

export function postsForMetric(posts, metricMode) {
  const safePosts = Array.isArray(posts) ? posts : [];
  return metricMode === 'videoViews' ? safePosts.filter(isVideoPost) : safePosts;
}

export function postMetricValue(post, metricMode) {
  return metricMode === 'engagement' ? engagementValue(post) : viewValue(post);
}

export function averageMetricValue(posts, metricMode) {
  const metricPosts = postsForMetric(posts, metricMode);
  if (!metricPosts.length) return 0;
  const total = metricPosts.reduce((sum, post) => sum + postMetricValue(post, metricMode), 0);
  return Math.round(total / metricPosts.length);
}

export function topMetricValue(posts, metricMode) {
  const metricPosts = postsForMetric(posts, metricMode);
  return metricPosts.reduce((max, post) => Math.max(max, postMetricValue(post, metricMode)), 0);
}
