// Google Fonts - Comprehensive Library
// Using dynamic loading via Google Fonts API for full library access

export const fontOptions = [
  // Custom Fonts
  { value: 'DonGraffiti, sans-serif', label: 'Don Graffiti', category: 'Custom' },
  { value: 'Tiempos, serif', label: 'Tiempos', category: 'Custom' },
  
  // Sans-Serif - Modern & Clean
  { value: 'Inter, sans-serif', label: 'Inter', category: 'Sans-Serif' },
  { value: 'Roboto, sans-serif', label: 'Roboto', category: 'Sans-Serif' },
  { value: 'Open Sans, sans-serif', label: 'Open Sans', category: 'Sans-Serif' },
  { value: 'Lato, sans-serif', label: 'Lato', category: 'Sans-Serif' },
  { value: 'Montserrat, sans-serif', label: 'Montserrat', category: 'Sans-Serif' },
  { value: 'Poppins, sans-serif', label: 'Poppins', category: 'Sans-Serif' },
  { value: 'Source Sans Pro, sans-serif', label: 'Source Sans Pro', category: 'Sans-Serif' },
  { value: 'Raleway, sans-serif', label: 'Raleway', category: 'Sans-Serif' },
  { value: 'Ubuntu, sans-serif', label: 'Ubuntu', category: 'Sans-Serif' },
  { value: 'Nunito, sans-serif', label: 'Nunito', category: 'Sans-Serif' },
  { value: 'Work Sans, sans-serif', label: 'Work Sans', category: 'Sans-Serif' },
  { value: 'Josefin Sans, sans-serif', label: 'Josefin Sans', category: 'Sans-Serif' },
  { value: 'Mulish, sans-serif', label: 'Mulish', category: 'Sans-Serif' },
  { value: 'Manrope, sans-serif', label: 'Manrope', category: 'Sans-Serif' },
  { value: 'Rubik, sans-serif', label: 'Rubik', category: 'Sans-Serif' },
  { value: 'Karla, sans-serif', label: 'Karla', category: 'Sans-Serif' },
  { value: 'Oxygen, sans-serif', label: 'Oxygen', category: 'Sans-Serif' },
  { value: 'Quicksand, sans-serif', label: 'Quicksand', category: 'Sans-Serif' },
  
  // Serif - Classic & Elegant
  { value: 'Playfair Display, serif', label: 'Playfair Display', category: 'Serif' },
  { value: 'Merriweather, serif', label: 'Merriweather', category: 'Serif' },
  { value: 'Lora, serif', label: 'Lora', category: 'Serif' },
  { value: 'PT Serif, serif', label: 'PT Serif', category: 'Serif' },
  { value: 'Crimson Text, serif', label: 'Crimson Text', category: 'Serif' },
  { value: 'Libre Baskerville, serif', label: 'Libre Baskerville', category: 'Serif' },
  { value: 'Cormorant, serif', label: 'Cormorant', category: 'Serif' },
  { value: 'EB Garamond, serif', label: 'EB Garamond', category: 'Serif' },
  { value: 'Source Serif Pro, serif', label: 'Source Serif Pro', category: 'Serif' },
  { value: 'Cardo, serif', label: 'Cardo', category: 'Serif' },
  
  // Display - Bold & Expressive
  { value: 'Bebas Neue, display', label: 'Bebas Neue', category: 'Display' },
  { value: 'Anton, display', label: 'Anton', category: 'Display' },
  { value: 'Righteous, display', label: 'Righteous', category: 'Display' },
  { value: 'Archivo Black, display', label: 'Archivo Black', category: 'Display' },
  { value: 'Fredoka One, display', label: 'Fredoka One', category: 'Display' },
  { value: 'Passion One, display', label: 'Passion One', category: 'Display' },
  { value: 'Russo One, display', label: 'Russo One', category: 'Display' },
  { value: 'Teko, display', label: 'Teko', category: 'Display' },
  { value: 'Saira Condensed, display', label: 'Saira Condensed', category: 'Display' },
  { value: 'Oswald, display', label: 'Oswald', category: 'Display' },
  
  // Handwriting & Script
  { value: 'Pacifico, cursive', label: 'Pacifico', category: 'Script' },
  { value: 'Dancing Script, cursive', label: 'Dancing Script', category: 'Script' },
  { value: 'Satisfy, cursive', label: 'Satisfy', category: 'Script' },
  { value: 'Great Vibes, cursive', label: 'Great Vibes', category: 'Script' },
  { value: 'Allura, cursive', label: 'Allura', category: 'Script' },
  { value: 'Caveat, cursive', label: 'Caveat', category: 'Script' },
  
  // Monospace
  { value: 'Roboto Mono, monospace', label: 'Roboto Mono', category: 'Monospace' },
  { value: 'Source Code Pro, monospace', label: 'Source Code Pro', category: 'Monospace' },
  { value: 'JetBrains Mono, monospace', label: 'JetBrains Mono', category: 'Monospace' },
  { value: 'Fira Code, monospace', label: 'Fira Code', category: 'Monospace' },
  { value: 'IBM Plex Mono, monospace', label: 'IBM Plex Mono', category: 'Monospace' },
  
  // Additional Popular Fonts
  { value: 'Noto Sans, sans-serif', label: 'Noto Sans', category: 'Sans-Serif' },
  { value: 'PT Sans, sans-serif', label: 'PT Sans', category: 'Sans-Serif' },
  { value: 'Barlow, sans-serif', label: 'Barlow', category: 'Sans-Serif' },
  { value: 'Exo 2, sans-serif', label: 'Exo 2', category: 'Sans-Serif' },
  { value: 'Titillium Web, sans-serif', label: 'Titillium Web', category: 'Sans-Serif' },
  { value: 'Abril Fatface, display', label: 'Abril Fatface', category: 'Display' },
  { value: 'Cinzel, serif', label: 'Cinzel', category: 'Serif' },
  { value: 'Alfa Slab One, display', label: 'Alfa Slab One', category: 'Display' },
  { value: 'Lobster, display', label: 'Lobster', category: 'Display' },
  { value: 'Comfortaa, display', label: 'Comfortaa', category: 'Display' },
]

// Dynamically load Google Font
export const loadGoogleFont = (fontFamily: string) => {
  if (typeof window === 'undefined') return;
  
  // Skip custom fonts
  if (fontFamily.includes('DonGraffiti') || fontFamily.includes('Tiempos')) return;
  
  // Extract font name before comma
  const fontName = fontFamily.split(',')[0].trim();
  const fontNameEncoded = fontName.replace(/\s+/g, '+');
  
  // Check if already loaded
  const existingLink = document.querySelector(`link[href*="${fontNameEncoded}"]`);
  if (existingLink) return;
  
  // Create and append link tag
  const link = document.createElement('link');
  link.href = `https://fonts.googleapis.com/css2?family=${fontNameEncoded}:wght@400;500;600;700&display=swap`;
  link.rel = 'stylesheet';
  document.head.appendChild(link);
  
  console.log('📝 Loaded Google Font:', fontName);
}
