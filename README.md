# Mohammad I. Nassiri - Interactive Resume

A modern, responsive, and interactive resume website built with HTML, CSS, and JavaScript.

## ✨ Features

- **Responsive Design**: Optimized for all devices including smartphones, tablets, and desktops
- **Interactive Sections**: Click or tap section titles to expand/collapse details
- **Mobile-First Approach**: Touch-friendly interface with proper mobile optimizations
- **Modern UI**: Clean, professional design with smooth animations
- **Accessibility**: ARIA labels, keyboard navigation, and screen reader support
- **Cross-Platform**: Works seamlessly across all modern browsers and devices

## 🚀 Mobile Responsiveness Features

### Responsive Breakpoints
- **Mobile**: ≤768px - Single column layout, touch-optimized
- **Tablet**: 769px-1024px - Optimized spacing and sizing
- **Desktop**: ≥1025px - Full two-column layout with enhanced effects

### Mobile Optimizations
- ✅ Touch-friendly buttons (44px minimum touch targets)
- ✅ Responsive typography and spacing
- ✅ Mobile-optimized navigation
- ✅ Touch event handling
- ✅ Proper viewport meta tags
- ✅ Mobile-specific CSS optimizations
- ✅ Improved scrolling on mobile devices
- ✅ Touch-friendly interactions

### Device Support
- **Smartphones**: iPhone, Android, etc.
- **Tablets**: iPad, Android tablets
- **Desktop**: Windows, macOS, Linux
- **Touch Devices**: All touch-enabled devices

## 🛠️ Technical Implementation

### CSS Features
- CSS Grid and Flexbox for responsive layouts
- CSS Custom Properties (variables) for theming
- Media queries for device-specific styling
- Touch-friendly hover states and interactions
- Mobile-first responsive design approach

### JavaScript Features
- Device detection (mobile vs desktop)
- Touch event handling for mobile devices
- Mouse event handling for desktop
- Interactive section toggling
- Responsive content loading

### HTML Features
- Semantic HTML5 structure
- Proper meta tags for mobile devices
- Accessibility attributes (ARIA)
- SEO-friendly markup

## 📱 Mobile Testing

### Test File
Use `test-mobile.html` to preview your site on different screen sizes:
- Mobile (375x667)
- Tablet (768x1024) 
- Desktop (1200x800)

### Real Device Testing
1. Open the site on your smartphone or tablet
2. Test touch interactions (tapping sections)
3. Check scrolling behavior
4. Verify text readability
5. Test different orientations
6. Check loading performance

## 🎨 Customization

### Colors
The site uses CSS custom properties for easy theming:
```css
:root {
  --hue: 210;
  --sat: 75%;
  --light: 98%;
  --accent: hsl(calc(var(--hue) + 30), 80%, 50%);
}
```

### Layout
- Adjust breakpoints in CSS media queries
- Modify grid layouts for different screen sizes
- Customize spacing and typography per device

## 🌐 Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile Browsers**: iOS Safari, Chrome Mobile, Samsung Internet
- **Legacy Support**: IE11+ (with some feature limitations)

## 📄 File Structure

```
├── index.html          # Main HTML file
├── style.css           # Responsive CSS styles
├── script.js           # Interactive JavaScript
├── converted.html      # Resume content
├── test-mobile.html    # Mobile testing tool
├── background.jpg      # Background image
├── MohaMMaD2.jpeg     # Profile photo
└── README.md           # This file
```

## 🚀 Getting Started

1. **Local Development**: Open `index.html` in your browser
2. **HTTP Server**: Run `python3 -m http.server 8000` and visit `http://localhost:8000`
3. **Mobile Testing**: Use `test-mobile.html` or test on real devices

## 📱 Mobile Best Practices Implemented

- **Touch Targets**: Minimum 44px for interactive elements
- **Typography**: Readable font sizes on small screens
- **Spacing**: Optimized padding and margins for mobile
- **Navigation**: Touch-friendly section toggling
- **Performance**: Optimized animations and effects for mobile
- **Accessibility**: Proper touch and keyboard support

## 🔧 Future Enhancements

- [ ] Dark mode toggle
- [ ] Print-optimized styles
- [ ] Offline support (PWA)
- [ ] Multi-language support
- [ ] Advanced animations
- [ ] Contact form integration

---

**Built with ❤️ for modern web standards and mobile-first design**
