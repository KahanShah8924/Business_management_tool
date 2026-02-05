/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Customizing blue if needed, but Tailwind's default blue is usually fine
                // User asked for "white and light blue theme"
                // We can extend 'primary' to be a specific blue
            }
        },
    },
    plugins: [],
}
