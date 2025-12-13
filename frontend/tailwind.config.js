export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        'primary-dark': '#1e40af',
        'primary-light': '#eff6ff',
        risk: '#ef4444',
        payment: '#22c55e',
        obligation: '#3b82f6',
        expiry: '#f97316',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
      }
    }
  },
  plugins: []
};
