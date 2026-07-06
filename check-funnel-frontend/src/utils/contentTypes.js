export const ALL_CONTENT_TYPES = 'All Content Types';

export const CONTENT_TYPE_FILTER_OPTIONS = [
  ALL_CONTENT_TYPES,
  'Static',
  'Reel',
  'Carousel',
];

const CONTENT_TYPE_ALIASES = {
  static: 'static',
  'static post': 'static',
  'static posts': 'static',
  reel: 'reel',
  reels: 'reel',
  carousel: 'carousel',
  carousels: 'carousel',
};

export const normalizeContentType = (value) => {
  const key = String(value || '').trim().toLowerCase();
  return CONTENT_TYPE_ALIASES[key] || key;
};

export const contentTypeMatchesFilter = (contentType, filter) => (
  !filter
  || filter === ALL_CONTENT_TYPES
  || normalizeContentType(contentType) === normalizeContentType(filter)
);

export const getContentTypeFilterValue = (value) => (
  CONTENT_TYPE_FILTER_OPTIONS.includes(value) ? value : ALL_CONTENT_TYPES
);
