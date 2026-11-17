export default {
  content: [
    "./resources/**/*.blade.php",
    "./resources/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{ts,tsx}",
    "./App.tsx",
  ],
  theme: {
    extend: {
      colors: {
        red: Object.fromEntries(
          [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(
            (shade) => [
              shade,
              "rgb(var(--primary-rgb, 220 20 60) / <alpha-value>)",
            ],
          ),
        ),
        neutral: Object.fromEntries(
          [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(
            (shade) => [shade, `rgb(var(--neutral-${shade}) / <alpha-value>)`],
          ),
        ),
        white: "rgb(var(--white, 255 255 255) / <alpha-value>)",
        black: "rgb(var(--black, 0 0 0) / <alpha-value>)",
      },
    },
  },
  plugins: [],
};
