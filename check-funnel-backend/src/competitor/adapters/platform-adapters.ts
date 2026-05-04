/**
 * Parses human-readable view counts like "11.3K", "51.3K", "2.5M" into numbers.
 * Also handles plain numeric strings.
 */
export function parseViewCount(value: string | number): number {
  if (typeof value === 'number') return Math.floor(value);
  if (!value || value === '') return 0;

  const str = String(value).trim().replace(/,/g, '');

  if (str.toUpperCase().endsWith('K')) {
    return Math.floor(parseFloat(str.slice(0, -1)) * 1000);
  }
  if (str.toUpperCase().endsWith('M')) {
    return Math.floor(parseFloat(str.slice(0, -1)) * 1000000);
  }
  if (str.toUpperCase().endsWith('B')) {
    return Math.floor(parseFloat(str.slice(0, -1)) * 1000000000);
  }

  const num = parseFloat(str);
  return isNaN(num) ? 0 : Math.floor(num);
}

/**
 * Extracts a username from a Facebook URL.
 * e.g. "https://www.facebook.com/Thedigitalkinggg" → "Thedigitalkinggg"
 */
export function extractFacebookUsername(url: string): string {
  if (!url) return '';
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname.replace(/^\/+|\/+$/g, '');
    
    // Handle profile.php?id=...
    if (path.includes('profile.php')) {
      return urlObj.searchParams.get('id') || path;
    }
    
    return path.split('/')[0] || '';
  } catch {
    return url;
  }
}

export interface NormalizedPost {
  username: string;
  postId: string;
  postUrl: string;
  createdAt: string;
  views: number;
  likes: number;
  commentsCount: number;
  shares: number;
  followers?: number;
  rawData: Record<string, any>;
}

/**
 * TikTok CSV Adapter
 */
export function normalizeTikTokRow(row: Record<string, any>): NormalizedPost {
  return {
    username: row['profile_username'] || '',
    postId: String(row['post_id'] || ''),
    postUrl: row['post_url'] || '',
    createdAt: row['created_at'] || '',
    views: parseViewCount(row['views_text']),
    likes: parseViewCount(row['likes']),
    commentsCount: parseViewCount(row['comments_count']),
    shares: parseViewCount(row['shares']),
    followers: parseViewCount(row['profile_followers'] || row['follower_count']),
    rawData: { ...row },
  };
}

/**
 * Instagram CSV Adapter
 */
export function normalizeInstagramRow(row: Record<string, any>): NormalizedPost {
  // Extract post ID from URL like https://www.instagram.com/p/DXdwsPHj0oG/
  let postId = '';
  const postUrl = row['post_url'] || '';
  const match = postUrl.match(/\/(p|reel|tv)\/([^/]+)/);
  if (match) postId = match[2];

  return {
    username: row['username'] || '',
    postId,
    postUrl,
    createdAt: row['publish_time'] || '',
    views: 0, // Instagram CSV typically doesn't provide views for all post types
    likes: parseViewCount(row['like_count']),
    commentsCount: parseViewCount(row['comment_count']),
    shares: parseViewCount(row['media_repost_count']),
    followers: parseViewCount(row['follower_count']),
    rawData: { ...row },
  };
}

/**
 * Facebook CSV Adapter
 */
export function normalizeFacebookRow(row: Record<string, any>): NormalizedPost | null {
  // Skip SUMMARY rows (they have empty Source Page URL or non-numeric #)
  const rowIndex = row['#'];
  if (!rowIndex || isNaN(Number(rowIndex))) return null;

  const sourceUrl = row['Source Page URL'] || '';
  const username = extractFacebookUsername(sourceUrl);
  
  // Clean Post Link: remove tracking params like &fbclid=...
  let postLink = row['Post Link'] || '';
  if (postLink.includes('&')) {
    postLink = postLink.split('&')[0];
  }
  if (postLink.includes('?')) {
    // If it's a share link, keep the base but remove tracking
    const [base, query] = postLink.split('?');
    const params = new URLSearchParams(query);
    ['fbclid', 'mibextid', 'rdid', 'share_url_id'].forEach(p => params.delete(p));
    const newQuery = params.toString();
    postLink = newQuery ? `${base}?${newQuery}` : base;
  }
  
  // Clean Description: replace '|' with newlines '\n'
  let description = row['Description'] || '';
  if (description) {
    // Replace " | " or "|" with newline and trim extra spaces
    description = description.replace(/\s*\|\s*/g, '\n').trim();
    row['Description'] = description; // Update for frontend display
  }

  return {
    username,
    postId: postLink, // Use full URL as unique identifier
    postUrl: postLink,
    createdAt: row['Scraped At'] || '',
    views: 0,
    likes: parseViewCount(row['Likes']),
    commentsCount: parseViewCount(row['Comments']),
    shares: parseViewCount(row['Shares']),
    followers: parseViewCount(row['Followers Count']),
    rawData: { ...row },
  };
}
