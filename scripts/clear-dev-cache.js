#!/usr/bin/env node

/**
 * Development Cache Clearing Script
 * Run this script to clear all caches and restart the development server
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧹 Clearing development caches...');

try {
  // Clear Next.js cache
  const nextCachePath = path.join(__dirname, '..', '.next');
  if (fs.existsSync(nextCachePath)) {
    execSync('rm -rf .next', { cwd: path.join(__dirname, '..') });
    console.log('✅ Cleared .next directory');
  }

  // Clear node_modules/.cache if it exists
  const nodeModulesCachePath = path.join(__dirname, '..', 'node_modules', '.cache');
  if (fs.existsSync(nodeModulesCachePath)) {
    execSync('rm -rf node_modules/.cache', { cwd: path.join(__dirname, '..') });
    console.log('✅ Cleared node_modules/.cache');
  }

  // Kill existing Next.js processes
  try {
    execSync('pkill -f "next dev"', { stdio: 'ignore' });
    console.log('✅ Killed existing Next.js processes');
  } catch (e) {
    console.log('ℹ️  No existing Next.js processes to kill');
  }

  // Wait a moment
  console.log('⏳ Waiting for processes to clean up...');
  setTimeout(() => {
    console.log('🚀 Starting fresh development server...');
    
    // Start the development server
    execSync('npm run dev', { 
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });
  }, 2000);

} catch (error) {
  console.error('❌ Error clearing cache:', error.message);
  process.exit(1);
}
