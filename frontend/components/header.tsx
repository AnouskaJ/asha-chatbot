// frontend/components/header.tsx

"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image" // <-- Import Image component
import { Button } from "@/components/ui/button"
import { ClientOnlyButton } from "@/components/client-only-button"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { cn } from "@/lib/utils"
import { Heart, Menu, X, User } from "lucide-react" // Heart icon is no longer needed for the logo itself
import React from "react"
import { useAuth } from "@/hooks/useAuth"
import { logoutUser } from "@/lib/firebase"
import { useRouter } from "next/navigation"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, isAdminUser } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await logoutUser()
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center">

          {/* === LOGO SECTION: UPDATED === */}
          <Link href="/" className="mr-6 flex items-center" aria-label="JobsForHer Foundation Homepage">
            {/* Replace Heart icon and text with Image */}
            <Image
              src="/logo.png" // Path relative to the 'public' directory
              alt="JobsForHer Foundation Logo" // Descriptive alt text
              width={160} // Adjust width as needed (example value)
              height={35} // Adjust height as needed (example value - maintain aspect ratio)
              priority // Load the logo eagerly
              className="h-8 w-auto" // Tailwind classes for responsive height
            />
            {/* Optional: Keep text if you want it next to the logo, otherwise remove */}
            {/* <span className="ml-2 text-lg font-bold hidden sm:inline-block">JobsForHer Foundation</span> */}
          </Link>
          {/* === END LOGO SECTION === */}

          <NavigationMenu className="hidden md:flex">
            {/* ... rest of your NavigationMenu ... */}
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>About</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-3 p-4 w-[400px] md:w-[500px] lg:w-[600px] grid-cols-2">
                    <li className="row-span-3">
                      <NavigationMenuLink asChild>
                        <a
                          className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-accent to-primary/20 p-6 no-underline outline-none focus:shadow-md"
                          href="/about"
                        >
                          {/* You might want to keep the Heart icon here if relevant */}
                          <Heart className="h-6 w-6 text-primary" />
                          <div className="mb-2 mt-4 text-lg font-medium">JobsForHer Foundation</div>
                          <p className="text-sm leading-tight text-muted-foreground">
                            Dedicated to enhancing the status of women in the workplace and beyond.
                          </p>
                        </a>
                      </NavigationMenuLink>
                    </li>
                    <ListItem href="/about" title="Our Mission">
                      Foster women's career advancement and unlock their potential
                    </ListItem>
                    <ListItem href="/about" title="Our Team">
                      Meet the passionate team behind our foundation
                    </ListItem>
                    <ListItem href="/about" title="Our Impact">
                      See how we're helping thousands of women restart their careers
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Programs</NavigationMenuTrigger>
                <NavigationMenuContent>
                   <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    <ListItem href="/discover" title="herShakti">
                      Upskill in emerging technologies including AI/ML, Blockchain and more
                    </ListItem>
                    <ListItem href="/discover" title="Career Coaching">
                      Get personalized guidance from experienced career coaches
                    </ListItem>
                    <ListItem href="/discover" title="DivHERsity Club">
                      Member-only community for diversity and inclusion leaders
                    </ListItem>
                    <ListItem href="/discover" title="Entrepreneurship Support">
                      Resources and community for women entrepreneurs
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/faq" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    FAQ
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/contact" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Contact
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* ... rest of your header actions (buttons, mobile menu logic) ... */}
        <div className="flex items-center space-x-2 md:space-x-4">
          <div className="hidden md:flex space-x-2">
            <Link href="/chat">
              <ClientOnlyButton variant="outline">
                Chat with Asha
              </ClientOnlyButton>
            </Link>
            {user ? (
              <>
                <Link href="/profile">
                  <ClientOnlyButton variant="outline" className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    Profile
                  </ClientOnlyButton>
                </Link>
                <ClientOnlyButton variant="outline" onClick={handleLogout}>
                  Logout
                </ClientOnlyButton>
                {isAdminUser && (
                  <Link href="/admin-dashboard">
                    <ClientOnlyButton variant="outline">
                      Admin
                    </ClientOnlyButton>
                  </Link>
                )}
              </>
            ) : (
              <Link href="/login">
                <ClientOnlyButton variant="outline">
                  Login
                </ClientOnlyButton>
              </Link>
            )}
          </div>
          {!user && (
            <Link href="/signup" className="hidden md:block">
              <ClientOnlyButton className="bg-primary hover:bg-primary/90 text-white">
                Get Started
              </ClientOnlyButton>
            </Link>
          )}
          <Button
            variant="outline"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-[1.2rem] w-[1.2rem]" /> : <Menu className="h-[1.2rem] w-[1.2rem]" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t py-4 bg-background">
          {/* ... rest of mobile menu ... */}
          <div className="container space-y-4">
            <Link
              href="/about"
              className="block px-2 py-2 hover:bg-accent rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <div className="pl-4 space-y-2">
              <Link
                href="/about"
                className="block px-2 py-1 text-sm hover:bg-accent rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Our Mission
              </Link>
              <Link
                href="/about"
                className="block px-2 py-1 text-sm hover:bg-accent rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Our Team
              </Link>
              <Link
                href="/about"
                className="block px-2 py-1 text-sm hover:bg-accent rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Our Impact
              </Link>
            </div>
            <Link
              href="/discover"
              className="block px-2 py-2 hover:bg-accent rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              Programs
            </Link>
            <div className="pl-4 space-y-2">
              <Link
                href="/discover"
                className="block px-2 py-1 text-sm hover:bg-accent rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                herShakti
              </Link>
              <Link
                href="/discover"
                className="block px-2 py-1 text-sm hover:bg-accent rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Career Coaching
              </Link>
              <Link
                href="/discover"
                className="block px-2 py-1 text-sm hover:bg-accent rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                DivHERsity Club
              </Link>
              <Link
                href="/discover"
                className="block px-2 py-1 text-sm hover:bg-accent rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Entrepreneurship Support
              </Link>
            </div>
            <Link
              href="/faq"
              className="block px-2 py-2 hover:bg-accent rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              FAQ
            </Link>
            <Link
              href="/contact"
              className="block px-2 py-2 hover:bg-accent rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </Link>
            <div className="pt-2 flex flex-col space-y-2 border-t">
              <Link
                href="/chat"
                onClick={() => setIsMenuOpen(false)}
              >
                <Button variant="outline" className="w-full">
                  Chat with Asha
                </Button>
              </Link>

              {user ? (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Button variant="outline" className="w-full flex items-center justify-center gap-1">
                      <User className="h-4 w-4" />
                      Profile
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      handleLogout()
                      setIsMenuOpen(false)
                    }}
                  >
                    Logout
                  </Button>
                  {isAdminUser && (
                    <Link
                      href="/admin-dashboard"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Button variant="outline" className="w-full">
                        Admin Dashboard
                      </Button>
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Button variant="outline" className="w-full">
                      Login
                    </Button>
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Button className="w-full bg-primary text-white hover:bg-primary/90">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}


// ListItem component remains unchanged
interface ListItemProps extends React.ComponentPropsWithoutRef<"a"> {
  title: string
}

const ListItem = React.forwardRef<React.ElementRef<"a">, ListItemProps>(
  ({ className, title, children, ...props }, ref) => {
    return (
      <li>
        <NavigationMenuLink asChild>
          <a
            ref={ref}
            className={cn(
              "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
              className
            )}
            {...props}
          >
            <div className="text-sm font-medium leading-none">{title}</div>
            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
              {children}
            </p>
          </a>
        </NavigationMenuLink>
      </li>
    )
  }
)
ListItem.displayName = "ListItem"