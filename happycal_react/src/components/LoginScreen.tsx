import { useState } from "react";
import { motion } from "motion/react";
import { useMsal } from "@azure/msal-react";
import { Button } from "./ui/button";
import { CalendarDays } from "lucide-react";
import OutlookIcon from "./OutlookIcon";
import { useAuthStore } from "../stores/authStore";
import { LoginRequest } from "@azure/msal-browser";

interface LoginScreenProps {
  onLogin: () => void;
}

const springTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

const smoothTransition = {
  duration: 0.4,
  ease: [0.4, 0, 0.2, 1],
};

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const { instance } = useMsal();
  const { setAccount, setAccessToken } = useAuthStore();
  const [isLoadingOutlook, setIsLoadingOutlook] = useState(false);
  const [outlookError, setOutlookError] = useState<string | null>(null);

  const handleOutlookSignIn = async () => {
    setIsLoadingOutlook(true);
    setOutlookError(null);
    
    try {
      // Get redirect URI from config (should match Azure AD)
      const redirectUri = import.meta.env.VITE_AZURE_REDIRECT_URI || window.location.origin;
      
      // Define the login request with the scopes you need
      const loginRequest: LoginRequest = {
        scopes: ['User.Read', 'email', 'profile'],
        redirectUri: redirectUri,
      };

      // Use popup for better UX
      const response = await instance.loginPopup(loginRequest);
      
      // Set the account in the store
      if (response.account) {
        setAccount(response.account);
        
        // Get access token
        try {
          const tokenResponse = await instance.acquireTokenSilent({
            scopes: loginRequest.scopes,
            account: response.account,
          });
          
          setAccessToken(tokenResponse.accessToken);
          
          // Call the onLogin callback to proceed
          onLogin();
        } catch (tokenError: any) {
          console.error("Token acquisition error:", tokenError);
          setOutlookError(`Failed to get access token: ${tokenError.message || 'Unknown error'}`);
        }
      } else {
        setOutlookError('No account returned from login');
      }
    } catch (error: any) {
      console.error("Outlook sign-in error:", error);
      
      // Provide user-friendly error messages
      if (error.errorCode === 'user_cancelled') {
        setOutlookError('Sign-in was cancelled. Please try again.');
      } else if (error.errorCode === 'popup_window_error') {
        setOutlookError('Popup was blocked. Please allow popups for this site and try again.');
      } else if (error.errorCode === 'invalid_request') {
        setOutlookError('Configuration error: Redirect URI mismatch. Please check Azure AD settings.');
      } else {
        setOutlookError(`Sign-in failed: ${error.message || error.errorCode || 'Unknown error'}. Check console for details.`);
      }
    } finally {
      setIsLoadingOutlook(false);
    }
  };

  const floatingElements = [
    { top: "10%", left: "10%", delay: 0, duration: 6, size: "w-32 h-32" },
    { top: "20%", right: "15%", delay: 1, duration: 7, size: "w-24 h-24" },
    { top: "60%", left: "5%", delay: 2, duration: 8, size: "w-28 h-28" },
    { top: "70%", right: "10%", delay: 0.5, duration: 6.5, size: "w-20 h-20" },
    { top: "40%", left: "85%", delay: 1.5, duration: 7.5, size: "w-36 h-36" },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-6">
      {/* Animated floating elements */}
      {floatingElements.map((elem, idx) => (
        <motion.div
          key={idx}
          className={`absolute ${elem.size} rounded-full backdrop-blur-xl bg-white/10 border border-white/20`}
          style={{
            top: elem.top,
            left: elem.left,
            right: elem.right,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 15, 0],
            scale: [1, 1.08, 1],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: elem.duration,
            repeat: Infinity,
            delay: elem.delay,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Main login card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={springTransition}
        className="relative z-10 w-full max-w-md"
      >
        <div className="backdrop-blur-2xl bg-white/15 border border-white/20 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
          {/* Logo and title */}
          <div className="flex flex-col items-center mb-8">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ ...springTransition, delay: 0.1 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 shadow-lg shadow-sky-500/50 flex items-center justify-center mb-4"
            >
              <CalendarDays className="w-8 h-8 text-white" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...smoothTransition, delay: 0.2 }}
              className="text-gray-900 mb-2"
            >
              Welcome to HappyCal
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...smoothTransition, delay: 0.3 }}
              className="text-gray-600 text-center"
            >
              Sign in with your Outlook account to manage your university events
            </motion.p>
          </div>

          {/* Outlook Sign In Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...smoothTransition, delay: 0.4 }}
            className="space-y-2"
          >
            <Button
              type="button"
              onClick={handleOutlookSignIn}
              disabled={isLoadingOutlook}
              className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-lg shadow-sky-500/30 border-0 transition-all disabled:opacity-50"
              size="lg"
            >
              {isLoadingOutlook ? (
                <>
                  <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <OutlookIcon className="w-5 h-5 mr-2" />
                  <span>Sign in with Outlook</span>
                </>
              )}
            </Button>
            {outlookError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-sm text-red-700"
              >
                {outlookError}
              </motion.div>
            )}
          </motion.div>

          {/* Decorative elements */}
          <motion.div
            className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-sky-400/20 to-blue-500/20 blur-3xl pointer-events-none"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2],
              rotate: [0, 90, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-gradient-to-br from-blue-400/20 to-cyan-500/20 blur-3xl pointer-events-none"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2],
              rotate: [0, -90, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 4,
            }}
          />
        </div>

        {/* Bottom text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mt-6 text-sm text-gray-600"
        >
          Made with ❤️ for Kellogg Students
        </motion.p>
      </motion.div>
    </div>
  );
}
