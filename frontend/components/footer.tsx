import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Footer() {
  return (
    <footer className="bg-accent border-t">
      <div className="container py-2">
        <div className="flex flex-col md:flex-row items-center justify-between gap-2">
          <div className="text-sm font-bold text-primary">
            HerKey
          </div>
          <nav className="flex space-x-4 text-xs">
            <Link href="/" className="hover:underline">
              Home
            </Link>
            <Link href="/about" className="hover:underline">
              About
            </Link>
            <Link href="/contact" className="hover:underline">
              Contact
            </Link>
          </nav>
          <div className="flex space-x-4 text-xs">
            <Link href="/privacy" className="hover:underline">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:underline">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
