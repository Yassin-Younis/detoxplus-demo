/* DETOX PLUS + — landing icon set.
   One consistent family: 24-unit grid, 1.5px stroke, round caps/joins,
   currentColor. Default 18px; sized down contextually by landing.css
   (.l-chips .l-ic 15px, .l-stats .l-ic 17px, .l-cue-ic 14px). */

import type { ReactNode, SVGProps } from 'react'

export type IconProps = SVGProps<SVGSVGElement> & {
  /** Rendered size in px (width = height). CSS width/height wins if set. */
  size?: number
}

function Icon({ size = 18, children, ...rest }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  )
}

/* ---------- chips: placements ---------- */

/** Graduation cap — Schools */
export function SchoolIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2.5 9.75 12 5l9.5 4.75L12 14.5 2.5 9.75Z" />
      <path d="M6.75 11.9v3.85c0 1.15 2.35 2.35 5.25 2.35s5.25-1.2 5.25-2.35V11.9" />
      <path d="M21.5 9.75v4.75" />
    </Icon>
  )
}

/** Rounded square with cross — Hospitals */
export function HospitalIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.75" y="3.75" width="16.5" height="16.5" rx="3.5" />
      <path d="M12 8.25v7.5M8.25 12h7.5" />
    </Icon>
  )
}

/** Dumbbell — Gyms */
export function GymIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4.75" y="8" width="3" height="8" rx="1.2" />
      <rect x="16.25" y="8" width="3" height="8" rx="1.2" />
      <path d="M7.75 12h8.5" />
      <path d="M2.25 12h2.5M19.25 12h2.5" />
    </Icon>
  )
}

/** Building with windows and door — Offices */
export function OfficeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="5.25" y="3.5" width="13.5" height="17" rx="1.5" />
      <path d="M9 7.5h1.5M13.5 7.5H15M9 11h1.5M13.5 11H15M9 14.5h1.5M13.5 14.5H15" />
      <path d="M10.5 20.5v-3.25h3v3.25" />
    </Icon>
  )
}

/* ---------- stats: benefits ---------- */

/** Leaf — Deep cleanse */
export function LeafIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M11 20.5A7.3 7.3 0 0 1 9.7 6.2C15.3 5.1 17 4.5 19 2.5c1 2 2 4.2 2 7.8 0 5.6-4.7 10.2-10 10.2Z" />
      <path d="M2.5 21.5c0-3 1.9-5.4 5.1-6.1 2.4-.5 4.9-2 5.9-3" />
    </Icon>
  )
}

/** Gentle double wave — Light digestion */
export function DigestionIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2.5 9c2.1-2 4.2-2 6.3 0s4.2 2 6.4 0 4.2-2 6.3 0" />
      <path d="M2.5 15c2.1-2 4.2-2 6.3 0s4.2 2 6.4 0 4.2-2 6.3 0" />
    </Icon>
  )
}

/** Four-point sparkle — Skin glow */
export function SparkleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M11 3.5c.6 3.9 2.6 5.9 6.5 6.5-3.9.6-5.9 2.6-6.5 6.5-.6-3.9-2.6-5.9-6.5-6.5 3.9-.6 5.9-2.6 6.5-6.5Z" />
      <path d="M18.75 15.5v4M16.75 17.5h4" />
    </Icon>
  )
}

/** Droplet — All-day hydration */
export function DropletIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.25S5.75 10.3 5.75 14.4a6.25 6.25 0 0 0 12.5 0C18.25 10.3 12 3.25 12 3.25Z" />
    </Icon>
  )
}

/* ---------- scroll cue ---------- */

/** Chevron down — scroll cue */
export function ChevronDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m6.5 9.75 5.5 5.5 5.5-5.5" />
    </Icon>
  )
}
