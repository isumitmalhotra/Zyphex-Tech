import { createAvatar } from '@dicebear/core';
import { initials } from '@dicebear/collection';

// Cache for generated avatars to avoid regeneration
const avatarCache = new Map<string, string>();

/**
 * Generate a consistent avatar based on a name
 * @param name - The name to generate avatar for
 * @param size - Size of the avatar in pixels (default: 40)
 * @returns Data URI string for the avatar SVG
 */
export function generateAvatar(name: string, size: number = 40): string {
  // Handle empty or invalid names
  if (!name || typeof name !== 'string' || name.trim() === '') {
    name = 'User';
  }

  // Create cache key
  const cacheKey = `${name.trim()}-${size}`;

  // Check cache first
  if (avatarCache.has(cacheKey)) {
    return avatarCache.get(cacheKey)!;
  }

  try {
    // Generate avatar using initials style
    const avatar = createAvatar(initials, {
      seed: name.trim(),
      size,
      // Customize colors for consistency and aesthetics
      backgroundColor: [
        '6366f1', // Indigo
        '8b5cf6', // Violet
        'ec4899', // Pink
        'f59e0b', // Amber
        '10b981', // Emerald
        '06b6d4', // Cyan
        'ef4444', // Red
        'f97316', // Orange
      ],
      // Text color - white for better contrast
      textColor: ['ffffff'],
      // Font weight
      fontWeight: 600,
    });

    // Convert to data URI
    const svg = avatar.toString();
    const dataUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

    // Cache the result
    avatarCache.set(cacheKey, dataUri);

    return dataUri;
  } catch (error) {
    // Fallback to a simple colored circle with initials
    const fallback = createFallbackAvatar(name, size);
    avatarCache.set(cacheKey, fallback);
    return fallback;
  }
}

/**
 * Create a simple fallback avatar if generation fails
 */
function createFallbackAvatar(name: string, size: number): string {
  const initials = getInitials(name);
  const color = getConsistentColor(name);

  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#${color}" rx="${size / 2}"/>
      <text
        x="50%"
        y="50%"
        dominant-baseline="middle"
        text-anchor="middle"
        fill="#ffffff"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="${size * 0.4}"
        font-weight="600"
      >${initials}</text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

/**
 * Get initials from a name (max 2 characters)
 */
export function getInitials(name: string): string {
  if (!name || typeof name !== 'string') {
    return 'U';
  }

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Generate a consistent color based on string hash
 */
function getConsistentColor(str: string): string {
  const colors = [
    '6366f1', // Indigo
    '8b5cf6', // Violet
    'ec4899', // Pink
    'f59e0b', // Amber
    '10b981', // Emerald
    '06b6d4', // Cyan
    'ef4444', // Red
    'f97316', // Orange
    '3b82f6', // Blue
    '14b8a6', // Teal
  ];

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

/**
 * Clear the avatar cache (useful for memory management)
 */
export function clearAvatarCache(): void {
  avatarCache.clear();
}

/**
 * Get cache size
 */
export function getAvatarCacheSize(): number {
  return avatarCache.size;
}
