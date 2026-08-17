import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Only used if the app is served via `vite preview` (Web Service fallback).
  // Allow Render's *.onrender.com host so preview doesn't 403 the Host header.
  // The recommended deploy is a Render Static Site, which doesn't use this.
  preview: {
    allowedHosts: ['.onrender.com'],
  },
})
