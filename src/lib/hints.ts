export type HintTier = 1 | 2 | 3 | 4

export interface HintDefinition {
  tier: HintTier
  cost: number
  label: string
  description: string
  icon: string  // Remix Icon class
}

export const HINT_TIERS: HintDefinition[] = [
  {
    tier: 1,
    cost: 1,
    label: 'Data Structure',
    description: 'A nudge toward the right data structure.',
    icon: 'ri-lightbulb-line',
  },
  {
    tier: 2,
    cost: 3,
    label: 'Algorithm Name',
    description: 'The name of the pattern or algorithm.',
    icon: 'ri-compass-3-line',
  },
  {
    tier: 3,
    cost: 7,
    label: 'Pseudocode',
    description: 'Step-by-step logic in plain English.',
    icon: 'ri-file-list-3-line',
  },
  {
    tier: 4,
    cost: 15,
    label: 'Full Walkthrough',
    description: 'Complete explanation. Streak survives, no clean badge.',
    icon: 'ri-eye-line',
  },
]

export function getHintCost(tier: HintTier): number {
  return HINT_TIERS[tier - 1].cost
}

export function canAffordHint(stars: number, tier: HintTier): boolean {
  return stars >= getHintCost(tier)
}
