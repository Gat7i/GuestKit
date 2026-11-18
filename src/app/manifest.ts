import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Les Orangers Resort',
    short_name: 'Les Orangers',
    description: 'Votre compagnon de séjour à The Orangers Beach Resort & Bungalows',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#746865',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}