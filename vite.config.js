import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: 'index.html',
        adminLogin: 'admin-login.html',
        adminUsers: 'admin-users.html',
        adminRegistrations: 'admin-registrations.html',
        adminDashboard: 'admin-dashboard.html'
      }
    }
  }
});

