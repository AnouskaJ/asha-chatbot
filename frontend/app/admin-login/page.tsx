// frontend/app/admin-login/page.tsx

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { loginUser, isAdmin } from "@/lib/firebase"
import { Eye, EyeOff } from "lucide-react" // Import icons

export default function AdminLoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false); // State for password visibility

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      console.log('Admin Login: Attempting login with:', email);
      const user = await loginUser(email, password); // This function should ONLY log in, not redirect itself.

      // No need to check !user, loginUser should throw an error on failure
      console.log('Admin Login: Login successful, checking admin status for UID:', user.uid);
      const adminStatus = await isAdmin(user.uid);
      console.log('Admin Login: Admin status check result:', adminStatus);

      if (adminStatus === true) { // Explicitly check for true
        console.log('Admin Login: Admin access confirmed, redirecting to dashboard...');
        localStorage.setItem("isAdminLoggedIn", "true");
        // Redirect to the admin dashboard upon successful admin login
        router.push("/admin-dashboard");
        // IMPORTANT: Usually, you don't need anything after router.push as the component might unmount.
      } else {
         // User logged in successfully but is NOT an admin
         console.log('Admin Login: User is not an admin.');
         // It's good practice to log them out here if they reached the admin login page
         // but aren't admins, to avoid confusion. You might customize this behavior.
         // await logoutUser(); // Optional: Log them out immediately
         setError("Access Denied: This account does not have administrator privileges.");
      }

    } catch (err: any) {
      console.error('Admin Login Error:', err);
       console.error('Admin Login Error Code:', err.code); // Log the specific Firebase error code

      // Provide more specific error messages based on Firebase error codes
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
         setError("Invalid email or password.");
      } else if (err.code === 'auth/invalid-email') {
          setError("Please enter a valid email address.");
      } else if (err.code === "auth/too-many-requests") {
         setError("Access temporarily disabled due to too many failed login attempts. Please try again later.");
      }
      else {
          setError(err.message || "An unexpected error occurred during login.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };


  return (
    // Use flex container to center the card vertically
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center py-12 px-4"> {/* Adjust min-height */}
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
            <CardDescription>Enter admin credentials to access the dashboard</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
              {/* Password Input with Visibility Toggle */}
              <div className="space-y-2">
                 <Label htmlFor="password">Password</Label>
                 {/* Wrapper for Input + Toggle Button */}
                 <div className="relative">
                   <Input
                     id="password"
                     // Dynamically set type based on showPassword state
                     type={showPassword ? "text" : "password"}
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     required
                     disabled={isLoading}
                     autoComplete="current-password"
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
                     tabIndex={-1} // Remove from default tab order
                   >
                     {showPassword ? (
                       <EyeOff className="h-4 w-4" />
                     ) : (
                       <Eye className="h-4 w-4" />
                     )}
                   </Button>
                 </div>
              </div>
              {/* Error Display */}
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-sm" role="alert">
                  {error}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90" // Use primary foreground text
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

        {/* Back Link */}
        <div className="mt-6 text-center text-sm text-muted-foreground"> {/* Increased margin */}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Back to User Login
          </Link>
        </div>
      </div>
    </div>
  )
}