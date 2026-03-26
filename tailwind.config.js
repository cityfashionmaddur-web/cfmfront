/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Playfair Display", "serif"],
        sans: ["Space Grotesk", "Inter", "system-ui", "sans-serif"]
      },
      colors: {
        ink: "#050505",
        accent: "#171717",
        paper: "#ffffff"
      },
      boxShadow: {
        card: "0 20px 60px -35px rgba(5, 5, 5, 0.15)",
        ring: "0 10px 30px -18px rgba(5, 5, 5, 0.25)",
        glass: "0 18px 50px -30px rgba(5, 5, 5, 0.3)"
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "1.75rem"
      }
    }
  },
  plugins: [],
}
