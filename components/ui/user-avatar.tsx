'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { generateAvatar, getInitials } from '@/lib/utils/avatar'
import { isValidImageUrl } from '@/lib/utils/images'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export interface UserAvatarProps {
  /** Name of the person/entity for generating avatar */
  name: string
  /** Optional image URL - will use generated avatar as fallback */
  imageUrl?: string | null
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  /** Custom size in pixels (overrides size variant) */
  customSize?: number
  /** Additional CSS classes */
  className?: string
  /** Alt text for accessibility */
  alt?: string
  /** Show online indicator */
  showOnline?: boolean
  /** Is user online */
  isOnline?: boolean
}

const sizeMap = {
  xs: 'size-6',
  sm: 'size-8',
  md: 'size-10',
  lg: 'size-14',
  xl: 'size-20',
  '2xl': 'size-32',
} as const

const sizePixels = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
  '2xl': 128,
} as const

export function UserAvatar({
  name,
  imageUrl,
  size = 'md',
  customSize,
  className,
  alt,
  showOnline = false,
  isOnline = false,
}: UserAvatarProps) {
  // Check if we should use the provided image
  const shouldUseImage = isValidImageUrl(imageUrl)

  // Generate avatar fallback
  const actualSize = customSize || sizePixels[size]
  const generatedAvatar = generateAvatar(name, actualSize)
  const initials = getInitials(name)

  // Calculate online indicator size
  const indicatorSize = Math.max(Math.floor(actualSize * 0.25), 8)

  return (
    <div className={cn('relative inline-flex shrink-0', className)}>
      <Avatar className={cn(customSize ? '' : sizeMap[size])}>
        {shouldUseImage && (
          <AvatarImage
            src={imageUrl!}
            alt={alt || name}
          />
        )}
        <AvatarFallback>
          <img
            src={generatedAvatar}
            alt={alt || `${name}'s avatar`}
            className="h-full w-full"
          />
        </AvatarFallback>
      </Avatar>

      {/* Online indicator */}
      {showOnline && (
        <span
          className={cn(
            'absolute bottom-0 right-0 block rounded-full ring-2 ring-background',
            isOnline ? 'bg-green-500' : 'bg-gray-400'
          )}
          style={{
            width: indicatorSize,
            height: indicatorSize,
          }}
          aria-label={isOnline ? 'Online' : 'Offline'}
        />
      )}
    </div>
  )
}

/**
 * Avatar group component for displaying multiple avatars
 */
export interface AvatarGroupProps {
  /** Array of avatar data */
  avatars: Array<{
    name: string
    imageUrl?: string | null
    isOnline?: boolean
  }>
  /** Maximum number of avatars to show */
  max?: number
  /** Size of avatars */
  size?: UserAvatarProps['size']
  /** Custom size in pixels */
  customSize?: number
  /** Additional CSS classes */
  className?: string
}

export function AvatarGroup({
  avatars,
  max = 5,
  size = 'md',
  customSize,
  className,
}: AvatarGroupProps) {
  const actualSize = customSize || sizePixels[size]
  const displayAvatars = avatars.slice(0, max)
  const remainingCount = Math.max(0, avatars.length - max)

  // Calculate overlap (30% of avatar size)
  const overlap = Math.floor(actualSize * 0.3)

  return (
    <div className={cn('flex items-center', className)}>
      {displayAvatars.map((avatar, index) => (
        <div
          key={index}
          className="relative"
          style={{
            marginLeft: index > 0 ? -overlap : 0,
            zIndex: displayAvatars.length - index,
          }}
        >
          <UserAvatar
            name={avatar.name}
            imageUrl={avatar.imageUrl}
            size={size}
            customSize={customSize}
            className="ring-2 ring-background"
          />
        </div>
      ))}

      {remainingCount > 0 && (
        <div
          className="relative flex items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground ring-2 ring-background"
          style={{
            width: actualSize,
            height: actualSize,
            marginLeft: -overlap,
            zIndex: 0,
          }}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  )
}

/**
 * Simple initials avatar (no image loading)
 */
export interface InitialsAvatarProps {
  name: string
  size?: UserAvatarProps['size']
  customSize?: number
  className?: string
}

export function InitialsAvatar({
  name,
  size = 'md',
  customSize,
  className,
}: InitialsAvatarProps) {
  const actualSize = customSize || sizePixels[size]
  const generatedAvatar = generateAvatar(name, actualSize)

  return (
    <Avatar className={cn(customSize ? '' : sizeMap[size], className)}>
      <AvatarFallback>
        <img
          src={generatedAvatar}
          alt={`${name}'s avatar`}
          className="h-full w-full"
        />
      </AvatarFallback>
    </Avatar>
  )
}
