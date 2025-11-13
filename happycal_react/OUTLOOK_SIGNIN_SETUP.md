# Outlook Sign-In Setup Guide

This guide will help you set up "Sign in with Outlook" functionality for HappyCal.

## Prerequisites

- An Azure account (free tier is sufficient)
- Access to Azure Portal

## Step 1: Register Your Application in Azure AD

1. Go to [Azure Portal](https://portal.azure.com/) and sign in
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Fill in the registration form:
   - **Name**: HappyCal (or your preferred name)
   - **Supported account types**: 
     - Choose "Accounts in any organizational directory and personal Microsoft accounts" for maximum compatibility
     - Or "Single tenant" if you only want your organization
   - **Redirect URI**: 
     - Platform: **Single-page application (SPA)**
     - URI: `http://localhost:5173` (for development)
     - For production, add your production URL: `https://yourdomain.com`
5. Click **Register**

## Step 2: Configure API Permissions

1. In your app registration, go to **API permissions**
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Choose **Delegated permissions**
5. Add the following permissions:
   - `User.Read` - Sign in and read user profile
   - `email` - View user's email address
   - `profile` - View user's basic profile
6. Click **Add permissions**
7. **Important**: Click **Grant admin consent** if you're an admin (for organizational accounts)

## Step 3: Get Your Client ID

1. In your app registration, go to **Overview**
2. Copy the **Application (client) ID** - you'll need this for the next step

## Step 4: Configure Environment Variables

1. Create a `.env` file in the `happycal_react` directory (or copy from `.env.example`)
2. Add your Azure AD configuration:

```env
VITE_AZURE_CLIENT_ID=your-client-id-here
VITE_AZURE_AUTHORITY=https://login.microsoftonline.com/common
VITE_AZURE_REDIRECT_URI=http://localhost:5173
```

Replace `your-client-id-here` with the Application (client) ID from Step 3.

## Step 5: Update Redirect URIs for Production

When deploying to production:

1. Go back to Azure Portal > Your App Registration > **Authentication**
2. Under **Single-page application** redirect URIs, add your production URL:
   - `https://yourdomain.com`
3. Save the changes

## Step 6: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the login page
3. Click "Sign in with Outlook"
4. You should be redirected to Microsoft's login page
5. After signing in, you'll be redirected back to your app

## Troubleshooting

### "AADSTS50011: The redirect URI specified in the request does not match"

- Make sure the redirect URI in your `.env` file exactly matches the one in Azure Portal
- Check that you're using the correct platform type (Single-page application)
- Ensure there are no trailing slashes

### "AADSTS7000215: Invalid client secret is provided"

- This usually means the Client ID is incorrect
- Double-check your `VITE_AZURE_CLIENT_ID` in the `.env` file

### Popup Blocked

- Some browsers block popups by default
- Users may need to allow popups for your site
- Alternatively, you can switch to redirect flow (see code comments in `LoginScreen.tsx`)

### Token Not Being Sent to API

- Check that the auth store is properly initialized
- Verify that `localStorage` is accessible
- Check browser console for any errors

## Additional Resources

- [Microsoft Identity Platform Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
- [MSAL React Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-react)
- [Azure AD App Registration Guide](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)

## Security Notes

- Never commit your `.env` file to version control
- The `.env.example` file is safe to commit (it contains no secrets)
- For production, use environment variables provided by your hosting platform
- Consider implementing token refresh logic for long-lived sessions
- Review and limit the API permissions to only what's necessary

