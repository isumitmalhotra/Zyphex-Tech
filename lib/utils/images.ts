/**
 * Image utility functions for handling placeholders and validation
 */

/**
 * Validate if a URL is a valid image URL
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Check for placeholder paths
  if (url.includes('/placeholder') || url.includes('placeholder.')) {
    return false;
  }

  // Check for valid URL structure
  try {
    new URL(url);
    return true;
  } catch {
    // Not a valid absolute URL, check if it's a valid relative path
    return url.startsWith('/') && !url.includes('/placeholder');
  }
}

/**
 * Generate placeholder image with specific dimensions and color
 */
export function generatePlaceholder(
  width: number,
  height: number,
  text?: string,
  backgroundColor?: string
): string {
  const bgColor = backgroundColor || getPlaceholderColor();
  const displayText = text || `${width}×${height}`;
  const textColor = isLightColor(bgColor) ? '#333333' : '#ffffff';

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#${bgColor}"/>
      <text
        x="50%"
        y="50%"
        dominant-baseline="middle"
        text-anchor="middle"
        fill="${textColor}"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="${Math.min(width, height) * 0.15}"
        font-weight="500"
      >${displayText}</text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

/**
 * Generate a gradient placeholder for projects/companies
 */
export function generateGradientPlaceholder(
  width: number,
  height: number,
  seed?: string
): string {
  const gradients = [
    ['6366f1', '8b5cf6'], // Indigo to Violet
    ['ec4899', 'f43f5e'], // Pink to Rose
    ['f59e0b', 'f97316'], // Amber to Orange
    ['10b981', '14b8a6'], // Emerald to Teal
    ['06b6d4', '3b82f6'], // Cyan to Blue
    ['8b5cf6', 'ec4899'], // Violet to Pink
  ];

  // Select gradient based on seed or random
  let index = 0;
  if (seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    index = Math.abs(hash) % gradients.length;
  } else {
    index = Math.floor(Math.random() * gradients.length);
  }

  const [color1, color2] = gradients[index];

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#${color1};stop-opacity:1" />
          <stop offset="100%" style="stop-color:#${color2};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#grad)"/>
    </svg>
  `;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

/**
 * Get a consistent placeholder color
 */
function getPlaceholderColor(): string {
  const colors = [
    'e5e7eb', // Gray
    'dbeafe', // Blue
    'd1fae5', // Green
    'fef3c7', // Yellow
    'fed7aa', // Orange
    'fce7f3', // Pink
    'e0e7ff', // Indigo
  ];

  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Check if a color is light (for determining text color)
 */
function isLightColor(hexColor: string): boolean {
  const color = hexColor.replace('#', '');
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5;
}

/**
 * Get image URL with fallback
 */
export function getImageWithFallback(
  imageUrl: string | null | undefined,
  fallbackUrl: string
): string {
  return isValidImageUrl(imageUrl) ? imageUrl! : fallbackUrl;
}

/**
 * Handle image load error
 */
export function handleImageError(
  event: React.SyntheticEvent<HTMLImageElement>,
  fallbackUrl: string
): void {
  const img = event.currentTarget;
  if (img.src !== fallbackUrl) {
    img.src = fallbackUrl;
  }
}

/**
 * Preload image to check if it exists
 */
export async function preloadImage(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

/**
 * Size presets for common use cases
 */
export const ImageSizes = {
  avatar: {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 56,
    xl: 80,
    '2xl': 128,
  },
  thumbnail: {
    sm: 64,
    md: 128,
    lg: 256,
  },
  card: {
    sm: { width: 200, height: 150 },
    md: { width: 400, height: 300 },
    lg: { width: 800, height: 600 },
  },
} as const;
