import { initializeProviders } from './provider-registry';

/**
 * Initialize all providers on application startup
 * This should be called once when the application starts
 */
let initialized = false;

export function initializeProvidersOnce(): void {
  if (initialized) {
    console.log('Providers already initialized, skipping...');
    return;
  }

  try {
    console.log('Initializing provider registry...');
    initializeProviders();
    initialized = true;
    console.log('✓ Provider registry initialized successfully');
  } catch (error) {
    console.error('Failed to initialize providers:', error);
    throw error;
  }
}

/**
 * Check if providers are initialized
 */
export function areProvidersInitialized(): boolean {
  return initialized;
}

/**
 * Force re-initialization (useful for testing)
 */
export function resetProviders(): void {
  initialized = false;
}


