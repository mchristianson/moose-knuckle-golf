import React from 'react'

interface IconProps {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  ariaLabel?: string
}

/**
 * Icon wrapper component for consistent icon sizing and styling
 * Uses Heroicons SVG icons
 *
 * @param icon - Heroicons component (e.g., TrophyIcon)
 * @param size - Icon size: sm (16px), md (24px, default), lg (32px), xl (40px)
 * @param className - Additional Tailwind classes (e.g., 'text-blue-600')
 * @param ariaLabel - Accessibility label for screen readers
 */
export function Icon({
  icon: IconComponent,
  size = 'md',
  className = '',
  ariaLabel,
}: IconProps) {
  const sizeMap: Record<'sm' | 'md' | 'lg' | 'xl', string> = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10',
  }

  return (
    <IconComponent
      className={`${sizeMap[size]} ${className}`.trim()}
      aria-label={ariaLabel}
    />
  )
}
