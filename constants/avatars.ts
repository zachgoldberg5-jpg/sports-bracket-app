/**
 * Cartoon avatar catalogue powered by DiceBear (https://dicebear.com)
 * Categories describe the actual visual style, not character names.
 *
 * Styles:
 *   adventurer  → colorful anime-ish cartoon faces
 *   avataaars   → Bitmoji-style western cartoon people
 *   bottts      → cute robot characters
 *   pixel-art   → retro pixel art faces
 */

const D = (style: string, seed: string) =>
  `https://api.dicebear.com/9.x/${style}/png?seed=${encodeURIComponent(seed)}&size=128`;

export type AvatarSection = { label: string; avatars: string[] };

const ANIME_SEEDS = [
  'Mochi', 'Kira', 'Ryu', 'Hana', 'Taro', 'Yuki', 'Kenji', 'Sakura',
  'Hiro', 'Nami', 'Zhen', 'Luna', 'Kazu', 'Aiko', 'Sora', 'Ren',
  'Yui', 'Takumi', 'Akira', 'Mei',
];

const TOON_SEEDS = [
  'Ace', 'Buddy', 'Charlie', 'Duke', 'Eddie', 'Frank', 'Gus', 'Henry',
  'Iggy', 'Jack', 'Kobe', 'Leo', 'Max', 'Nate', 'Oscar', 'Pete',
  'Quinn', 'Rex', 'Sam', 'Theo',
];

const BOT_SEEDS = [
  'Alpha', 'Beta', 'Core', 'Delta', 'Echo', 'Flux', 'Grid', 'Hex',
  'Ion', 'Jolt', 'Kron', 'Lumo', 'Mega', 'Nova', 'Omega', 'Pixel',
  'Quark', 'Robo', 'Sigma', 'Turbo',
];

const PIXEL_SEEDS = [
  'Bit', 'Chip', 'Dash', 'Glitch', 'Hack', 'Jump', 'Lag', 'Mod',
  'Null', 'Proc', 'Quit', 'Ram', 'Sprite', 'Token', 'Undo', 'Void',
  'Warp', 'Xor', 'Zero', 'Zone',
];

export const AVATAR_SECTIONS: AvatarSection[] = [
  {
    label: 'Illustrated',
    avatars: ANIME_SEEDS.map((s) => D('adventurer', s)),
  },
  {
    label: 'Classic',
    avatars: TOON_SEEDS.map((s) => D('avataaars', s)),
  },
  {
    label: 'Bots',
    avatars: BOT_SEEDS.map((s) => D('bottts', s)),
  },
  {
    label: 'Pixel',
    avatars: PIXEL_SEEDS.map((s) => D('pixel-art', s)),
  },
];
