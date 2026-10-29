export interface PhotoItem {
  id: string;
  file: string;
  title: string;
  album: string;
}

export const PHOTO_LIBRARY: PhotoItem[] = [
  { id: 'p1', file: 'photos/mountain-lake.jpg', title: 'Mountain Lake', album: 'Nature' },
  { id: 'p2', file: 'photos/city-night.jpg', title: 'Night City', album: 'City' },
  { id: 'p3', file: 'photos/desert-dunes.jpg', title: 'Sand Dunes', album: 'Nature' },
  { id: 'p4', file: 'wallpapers/aurora.jpg', title: 'Aurora', album: 'Wallpapers' },
  { id: 'p5', file: 'wallpapers/sierra.jpg', title: 'Sierra', album: 'Wallpapers' },
  { id: 'p6', file: 'wallpapers/monterey.jpg', title: 'Monterey', album: 'Wallpapers' },
  { id: 'p7', file: 'wallpapers/desert.jpg', title: 'Desert Dusk', album: 'Wallpapers' },
  { id: 'p8', file: 'wallpapers/dark-space.jpg', title: 'Deep Space', album: 'Wallpapers' },
  { id: 'p9', file: 'wallpapers/graphite.jpg', title: 'Graphite', album: 'Wallpapers' },
];

export const ALBUMS = ['All', 'Nature', 'City', 'Wallpapers'];
