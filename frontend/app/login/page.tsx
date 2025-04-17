"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { loginUser } from "@/lib/firebase";
import { Eye, EyeOff } from "lucide-react"; // Import icons

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false); // State for password visibility

  useEffect(() => {
    const registered = searchParams?.get("registered");
    if (registered) {
      setSuccessMessage("Account created successfully! Please log in.");
       // Clear the query param after displaying message (optional)
       // router.replace('/login', undefined); // Or router.replace('/login', { shallow: true }); depending on Next version
    }
  }, [searchParams, router]); // Added router dependency if using replace

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccessMessage(""); // Clear success message on new attempt

    try {
      const user = await loginUser(email, password);
      console.log("Login successful:", user);
      // Redirect to dashboard or home page after successful login
      // Check if there's a 'redirect' query param or default to '/'
      const redirectUrl = searchParams?.get("redirect") || "/";
      router.push(redirectUrl);
    } catch (err: any) {
      console.error("Login error code:", err.code); // Log the code for debugging
      console.error("Login error message:", err.message);

      // Set user-friendly error message
      if (err.code === "auth/invalid-credential") {
        setError("Incorrect email or password. Please try again.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (err.code === "auth/too-many-requests") {
         setError("Access temporarily disabled due to too many failed login attempts. Please try again later or reset your password.");
      }
       else {
        // Fallback for other errors
        setError("An unexpected error occurred during login. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    // Center the login card vertically and horizontally
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center py-12 px-4"> {/* Adjust min-height based on header/footer */}
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center space-y-1"> {/* Center header text */}
            <CardTitle className="text-2xl font-bold">Log in</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {/* Error Message Area */}
              {error && (
                 // Added padding and background for better visibility
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-sm" role="alert">
                  {error}
                </div>
              )}
              {/* Success Message Area */}
              {successMessage && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative text-sm" role="alert">
                  {successMessage}
                </div>
              )}
              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jane.doe@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  aria-required="true"
                  disabled={isLoading}
                />
              </div>
              {/* Password Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                </div>
                {/* Wrapper for Input + Toggle Button */}
                <div className="relative">
                  <Input
                    id="password"
                    // Dynamically set type based on showPassword state
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    aria-required="true"
                    disabled={isLoading}
                    // Add padding to the right to make space for the icon
                    className="pr-10"
                  />
                  {/* Toggle Button */}
                  <Button
                    type="button" // Important: Prevent form submission
                    variant="ghost"
                    size="icon"
                    onClick={togglePasswordVisibility}
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    disabled={isLoading}
                    tabIndex={-1} // Don't include in normal tab order
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              {/* Remember Me Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" disabled={isLoading} />
                <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground"> {/* Style tweaks */}
                  Remember me
                </Label>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90" // Use primary foreground for text
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging in...
                  </>
                ) : (
                  "Log in"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Links below card */}
        <div className="mt-6 text-center text-sm text-muted-foreground"> {/* Increased top margin */}
          Don't have an account?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
          <div className="mt-2">
            <Link href="/admin-login" className="font-medium text-primary hover:underline">
              Admin Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- END OF FILE login.tsx ---