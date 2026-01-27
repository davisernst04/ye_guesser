# Ye Guesser 🎵

A music guessing game featuring Kanye West tracks. Test your knowledge by listening to song previews and guessing the titles!

## 🚀 Features

- **Interactive Music Quiz**: Listen to 5-second previews of Kanye West tracks
- **Smart Search**: Real-time track search with autocomplete
- **Dark/Light Mode**: Theme switching with system preference detection
- **Responsive Design**: Optimized for all device sizes
- **Local Progress**: Game state persists in localStorage
- **3D Animated UI**: Beautiful marquee effect with album covers

## 🛠️ Tech Stack

- **Framework**: Next.js 15.2.4 with App Router
- **UI**: React 19 with TypeScript
- **Styling**: Tailwind CSS v4
- **Animations**: Motion (Framer Motion)
- **Components**: Radix UI primitives
- **API**: Deezer Music API

## 📦 Installation

```bash
npm install
```

## 🏃‍♂️ Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Build

```bash
npm run build
npm start
```

## 🎯 Performance Optimizations

### Image Optimization
- Next.js Image component with priority loading
- AVIF and WebP format support
- Responsive image sizes for different devices
- Lazy loading for non-critical images

### Code Splitting
- Dynamic imports for heavy components (AudioPlayer, ComboboxDemo)
- React.memo for preventing unnecessary re-renders
- Optimized bundle sizes with tree shaking

### Caching Strategy
- API route caching (7200s revalidation)
- Edge runtime for faster API responses
- Font preloading and display swap
- Prefetch links for instant navigation

### Performance Features
- Compressed assets (gzip/brotli)
- Disabled powered-by header
- React Strict Mode enabled
- Optimized font loading strategies

## 🔍 SEO Optimizations

### Meta Tags
- Comprehensive Open Graph tags
- Twitter Card support
- Semantic HTML structure
- Proper heading hierarchy

### Structured Data
- robots.txt for crawler instructions
- sitemap.xml for search indexing
- Web app manifest for PWA support
- Viewport and theme-color meta tags

### Accessibility
- ARIA labels and roles
- Keyboard navigation support
- Semantic HTML elements
- Screen reader friendly

## 📱 PWA Support

The app includes a web manifest for Progressive Web App capabilities:
- Installable on mobile devices
- Standalone display mode
- Custom theme colors
- App icons configured

## 🎨 UI/UX Enhancements

- Loading states with skeleton screens
- Error boundaries with retry mechanisms
- Smooth animations and transitions
- Visual feedback for user actions
- Responsive typography scaling

## 🔧 Configuration

### Environment Variables
No environment variables required - uses public Deezer API.

### Next.js Config
- Multiple image domains whitelisted
- Compression enabled
- Custom device and image sizes
- Security headers configured

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please feel free to submit a Pull Request.
