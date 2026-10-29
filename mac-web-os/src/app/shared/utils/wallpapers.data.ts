export interface WallpaperDef {
  id: string;
  name: string;
  file: string;
  /** Used instantly and as a fallback if the image fails to load. */
  fallbackGradient: string;
}

export const WALLPAPERS: WallpaperDef[] = [
  {
    id: 'aurora-waves',
    name: 'Silk Flow',
    file: 'wallpapers/aurora-waves.jpg',
    fallbackGradient: 'linear-gradient(200deg, #1c2a63 0%, #7a2f6e 45%, #d9657a 70%, #f2a25c 100%)',
  },
  {
    id: 'lake-dusk',
    name: 'Lake Dusk',
    file: 'wallpapers/lake-dusk.jpg',
    fallbackGradient: 'linear-gradient(180deg, #2b3a55 0%, #8c7a98 40%, #e8b98a 65%, #4a6b7a 100%)',
  },
  {
    id: 'aurora',
    name: 'Aurora',
    file: 'wallpapers/aurora.jpg',
    fallbackGradient: 'linear-gradient(135deg, #1a2a6c, #3a1c71, #16222a)',
  },
  {
    id: 'sierra',
    name: 'Sierra',
    file: 'wallpapers/sierra.jpg',
    fallbackGradient: 'linear-gradient(135deg, #ff7e5f, #feb47b, #6a3093)',
  },
  {
    id: 'monterey',
    name: 'Monterey',
    file: 'wallpapers/monterey.jpg',
    fallbackGradient: 'linear-gradient(135deg, #005c97, #363795, #11998e)',
  },
  {
    id: 'desert',
    name: 'Desert Dusk',
    file: 'wallpapers/desert.jpg',
    fallbackGradient: 'linear-gradient(135deg, #f6d365, #fda085, #c94b4b)',
  },
  {
    id: 'dark-space',
    name: 'Deep Space',
    file: 'wallpapers/dark-space.jpg',
    fallbackGradient: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
  },
  {
    id: 'graphite',
    name: 'Graphite',
    file: 'wallpapers/graphite.jpg',
    fallbackGradient: 'linear-gradient(135deg, #3a3a3c, #636366, #1c1c1e)',
  },
];

export function getWallpaper(id: string): WallpaperDef {
  return WALLPAPERS.find((w) => w.id === id) ?? WALLPAPERS[0];
}
