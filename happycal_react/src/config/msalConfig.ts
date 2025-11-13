import { PublicClientApplication, Configuration } from '@azure/msal-browser';

// Azure AD configuration
// These values should be set via environment variables
const getEnvVar = (key: string, defaultValue: string): string => {
  // @ts-ignore - Vite environment variables
  const value = import.meta.env[key];
  return value || defaultValue;
};

// Get redirect URI - must match Azure AD exactly
const redirectUri = getEnvVar('VITE_AZURE_REDIRECT_URI', window.location.origin);
const authority = getEnvVar('VITE_AZURE_AUTHORITY', 'https://login.microsoftonline.com/organizations');

console.log('MSAL Config - Redirect URI:', redirectUri);
console.log('MSAL Config - Authority:', authority);
console.log('MSAL Config - Client ID:', getEnvVar('VITE_AZURE_CLIENT_ID', ''));

const msalConfig: Configuration = {
  auth: {
    clientId: getEnvVar('VITE_AZURE_CLIENT_ID', ''), // Azure AD Application (client) ID
    // Use 'organizations' for any organizational account, or specific tenant ID for single tenant
    // 'common' only works for multi-tenant apps
    authority: authority,
    redirectUri: redirectUri, // Must match Azure AD redirect URI exactly
  },
  cache: {
    cacheLocation: 'localStorage', // This configures where your cache will be stored
    storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
  },
};

// Create MSAL instance
export const msalInstance = new PublicClientApplication(msalConfig);

// Initialize MSAL
msalInstance.initialize().then(() => {
  // Account selection logic is app dependent. Adjust accordingly.
  const accounts = msalInstance.getAllAccounts();
  if (accounts.length > 0) {
    msalInstance.setActiveAccount(accounts[0]);
  }
});

export default msalInstance;

