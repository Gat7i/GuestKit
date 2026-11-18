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
        src: '/icon-192.png.jpeg',
        sizes: '1024x1024',
        type: 'image/jpeg',
        purpose: 'any maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '1024x1024',
        type: 'image/jpeg',
        purpose: 'any maskable',
      },
    ],
  }
}