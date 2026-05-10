/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  darkMode: "class",
  theme: {
      extend: {
          "colors": {
              "background": "#020412",
              "on-background": "#e2e2e9",
              "surface": "#020412",
              "surface-dim": "#020412",
              "surface-bright": "#1a1c2e",
              "surface-container-lowest": "#010108",
              "surface-container-low": "#0b0c1b",
              "surface-container": "#111226",
              "surface-container-high": "#1a1b3a",
              "surface-container-highest": "#24254f",
              "on-surface": "#e2e2e9",
              "on-surface-variant": "#c4c5d0",
              "inverse-surface": "#e2e2e9",
              "inverse-on-surface": "#1a1b23",
              "outline": "#8e9099",
              "outline-variant": "#44474e",
              "surface-tint": "#1800ad",
              "primary": "#1800ad",
              "on-primary": "#ffffff",
              "primary-container": "#1a1b4b",
              "on-primary-container": "#e0e0ff",
              "inverse-primary": "#b0b0ff",
              "secondary": "#595d7e",
              "on-secondary": "#ffffff",
              "secondary-container": "#414565",
              "on-secondary-container": "#dee0ff",
              "tertiary": "#745470",
              "on-tertiary": "#ffffff",
              "tertiary-container": "#5c3d58",
              "on-tertiary-container": "#ffd7f6",
              "error": "#ffb4ab",
              "on-error": "#690005",
              "error-container": "#93000a",
              "on-error-container": "#ffdad6",
              "primary-fixed": "#1800ad",
              "primary-fixed-dim": "#414eff",
              "on-primary-fixed": "#ffffff",
              "on-primary-fixed-variant": "#00006e",
              "secondary-fixed": "#dee0ff",
              "secondary-fixed-dim": "#c2c5eb",
              "on-secondary-fixed": "#161b37",
              "on-secondary-fixed-variant": "#414565",
              "tertiary-fixed": "#ffd7f6",
              "tertiary-fixed-dim": "#e9b9db",
              "on-tertiary-fixed": "#2b122a",
              "on-tertiary-fixed-variant": "#5c3d58",
              "surface-variant": "#1a1b23"
          },

          "borderRadius": {
              "DEFAULT": "2px",
              "lg": "4px",
              "xl": "8px",
              "full": "9999px"
          },
          "spacing": {
              "base": "8px",
              "xs": "4px",
              "sm": "12px",
              "md": "24px",
              "lg": "48px",
              "xl": "80px",
              "container-max": "1280px",
              "gutter": "24px"
          },
          "fontFamily": {
              "body": ["Manrope", "sans-serif"],
              "body-md": ["Manrope", "sans-serif"],
              "body-lg": ["Manrope", "sans-serif"],
              "hero": ["Manrope", "sans-serif"],
              "h1": ["Manrope", "sans-serif"],
              "h2": ["Manrope", "sans-serif"],
              "eyebrow": ["Manrope", "sans-serif"],
              "label-sm": ["Manrope", "sans-serif"],
              "headline-xl": ["Manrope", "sans-serif"],
              "headline-lg": ["Manrope", "sans-serif"],
              "headline-md": ["Manrope", "sans-serif"],
              "hero-display": ["Manrope", "sans-serif"]
          },
          "fontSize": {
              "hero-display": ["64px", { "lineHeight": "1.1", "letterSpacing": "0.15em", "fontWeight": "200" }],
              "hero-display-mobile": ["40px", { "lineHeight": "1.1", "letterSpacing": "0.1em", "fontWeight": "200" }],
              "h1": ["32px", { "lineHeight": "1.2", "letterSpacing": "0.1em", "fontWeight": "300" }],
              "h2": ["24px", { "lineHeight": "1.3", "letterSpacing": "0.05em", "fontWeight": "400" }],
              "headline-xl": ["48px", { "lineHeight": "1.1", "letterSpacing": "0.1em", "fontWeight": "300" }],
              "headline-lg": ["36px", { "lineHeight": "1.2", "letterSpacing": "0.05em", "fontWeight": "400" }],
              "headline-md": ["28px", { "lineHeight": "1.3", "letterSpacing": "0.05em", "fontWeight": "400" }],
              "eyebrow": ["12px", { "lineHeight": "1.5", "letterSpacing": "0.2em", "fontWeight": "600" }],
              "body": ["16px", { "lineHeight": "1.6", "letterSpacing": "normal", "fontWeight": "400" }],
              "body-lg": ["18px", { "lineHeight": "1.6", "letterSpacing": "normal", "fontWeight": "400" }],
              "body-md": ["16px", { "lineHeight": "1.6", "letterSpacing": "normal", "fontWeight": "400" }],
              "body-sm": ["14px", { "lineHeight": "1.6", "letterSpacing": "normal", "fontWeight": "400" }],
              "label-sm": ["10px", { "lineHeight": "1.2", "letterSpacing": "0.1em", "fontWeight": "600" }]
          },
          "keyframes": {
            "revealUp": {
              "0%": { "transform": "translateY(20px)", "opacity": "0" },
              "100%": { "transform": "translateY(0)", "opacity": "1" }
            },
            "revealIn": {
              "0%": { "transform": "scale(0.95)", "opacity": "0" },
              "100%": { "transform": "scale(1)", "opacity": "1" }
            },
            "slowZoom": {
              "0%": { "transform": "scale(1)" },
              "100%": { "transform": "scale(1.05)" }
            },
            "fadeIn": {
              "0%": { "opacity": "0" },
              "100%": { "opacity": "1" }
            },
            "shimmer": {
              "100%": { "left": "100%" }
            }
          },
          "animation": {
            "reveal-up": "revealUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
            "reveal-in": "revealIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
            "slow-zoom": "slowZoom 20s ease-in-out infinite alternate",
            "fade-in": "fadeIn 1s ease-out forwards",
            "shimmer": "shimmer 2s infinite"
          }
      }
  },
  plugins: []

}
