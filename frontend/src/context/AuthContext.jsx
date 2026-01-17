/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

// Fixed business information - can be moved to .env file if needed
const FIXED_BUSINESS_INFO = {
  businessName: "Cotton Stock Kids Wear",
  email: "cottonstockkidswear27@gmail.com",
  phone: "9892613808",
  // Address will be stored in user profile
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);

  // Initialize user with fixed business info if not present
  const initializeUserWithBusinessInfo = (userData) => {
    if (!userData) return null;
    
    return {
      ...userData,
      // Add fixed business info to user object for easy access
      businessName: userData.businessName || FIXED_BUSINESS_INFO.businessName,
      businessEmail: userData.businessEmail || FIXED_BUSINESS_INFO.email,
      businessPhone: userData.businessPhone || FIXED_BUSINESS_INFO.phone,
      // User's personal/address info
      address: userData.address || "",
      phone: userData.phone || "",
      email: userData.email || "",
    };
  };

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");

      console.log("🛡️ Auth check - Token exists:", !!token);
      console.log("🛡️ Auth check - User string:", userStr);

      if (token && userStr && userStr !== "undefined") {
        try {
          const userData = JSON.parse(userStr);
          console.log("🛡️ Auth check - Parsed user:", userData);
          
          // Initialize with business info
          const initializedUser = initializeUserWithBusinessInfo(userData);
          setUser(initializedUser);
          setIsAuthenticated(true);
        } catch (parseError) {
          console.error("🛡️ Auth check - Error parsing user:", parseError);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setIsAuthenticated(false);
        }
      } else {
        console.log("🛡️ Auth check - No valid auth data");
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("🛡️ Auth check - Error:", error);
      setIsAuthenticated(false);
    } finally {
      console.log("🛡️ Auth check - Loading set to false");
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("🛡️ AuthContext: useEffect running");
    checkAuthStatus();
  }, []);

  const login = (_userData, _token) => {
    console.log("🛡️ Login called with:", { _userData, _token });
    
    // Clear previous errors
    setError(null);
    
    // ✅ FIXED: Check if data is valid
    if (!_userData || !_token) {
      const errorMessage = "Invalid login data: Missing user data or token";
      console.error("🛡️", errorMessage);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }

    // Check if userData is a proper object
    if (typeof _userData !== 'object' || _userData === null) {
      const errorMessage = "Invalid user data format";
      console.error("🛡️", errorMessage, _userData);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }

    // ✅ FIXED: Check for essential user fields - your backend returns _id, not id
    if (!_userData.email || (!_userData._id && !_userData.id)) {
      const errorMessage = "User data missing required information";
      console.error("🛡️ Missing fields:", { 
        email: _userData.email, 
        _id: _userData._id,
        id: _userData.id 
      });
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }

    try {
      // Normalize user data - ensure we have consistent field names
      const normalizedUserData = {
        ..._userData,
        id: _userData._id || _userData.id, // Use _id if available, fall back to id
      };
      
      // Remove duplicate _id if we created id from it
      if (_userData._id && _userData.id && _userData._id === _userData.id) {
        delete normalizedUserData._id;
      }
      
      // Initialize with business info
      const initializedUser = initializeUserWithBusinessInfo(normalizedUserData);
      
      console.log("🛡️ Initialized user data with business info:", initializedUser);
      
      // Save to localStorage
      localStorage.setItem("token", _token);
      localStorage.setItem("user", JSON.stringify(initializedUser));
      
      console.log("🛡️ LocalStorage after login:");
      console.log("   - Token:", localStorage.getItem("token")?.substring(0, 20) + "...");
      console.log("   - User:", JSON.parse(localStorage.getItem("user")));
      
      // Update state
      setUser(initializedUser);
      setIsAuthenticated(true);
      setError(null);
      
      return { success: true, user: initializedUser };
      
    } catch (storageError) {
      console.error("🛡️ Storage error:", storageError);
      const errorMessage = "Failed to save authentication data";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    console.log("🛡️ Logout called");
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    window.location.href = "/";
  };

  const updateUser = (_updatedUserData) => {
    const newUserData = initializeUserWithBusinessInfo({ ...user, ..._updatedUserData });
    localStorage.setItem("user", JSON.stringify(newUserData));
    setUser(newUserData);
    
    // Return updated user for convenience
    return newUserData;
  };

  // Specific function to update user address
  const updateUserAddress = (address) => {
    if (!user) {
      console.error("🛡️ Cannot update address: No user logged in");
      return { success: false, error: "No user logged in" };
    }
    
    try {
      const updatedUser = updateUser({ address });
      console.log("🛡️ User address updated:", address);
      return { success: true, user: updatedUser };
    } catch (error) {
      console.error("🛡️ Error updating address:", error);
      return { success: false, error: "Failed to update address" };
    }
  };

  // Get business info for forms
  const getBusinessInfo = () => {
    return {
      businessName: user?.businessName || FIXED_BUSINESS_INFO.businessName,
      email: user?.businessEmail || FIXED_BUSINESS_INFO.email,
      phone: user?.businessPhone || FIXED_BUSINESS_INFO.phone,
      address: user?.address || "", // User will fill this
    };
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    error,
    login,
    logout,
    updateUser,
    updateUserAddress,
    getBusinessInfo,
    checkAuthStatus,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;