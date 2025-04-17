"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { signOut as firebaseSignOut } from "firebase/auth"
import { db, auth } from "../../lib/firebase"
import { Card } from "../../components/ui/card"
import { Loader2, Mail, LogOut } from "lucide-react"
import { ProtectedRoute } from "../../components/ProtectedRoute"
import { Input } from "../../components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import Link from "next/link"
import { Button } from "../../components/ui/button"
import { useAuth } from "../../hooks/useAuth"
import { useRouter } from "next/navigation"

interface User {
  email: string;
  createdAt: Date;
  lastSignedIn: Date;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await firebaseSignOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersQuery = query(
          collection(db, 'users'),
          orderBy('createdAt', 'desc')
        );
        
        const snapshot = await getDocs(usersQuery);
        const userData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            email: data.email,
            createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
            lastSignedIn: data.lastSignedIn ? new Date(data.lastSignedIn) : new Date()
          };
        });

        setUsers(userData);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Filter users based on search query
  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <span className="text-xl font-bold">Admin Dashboard</span>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  {[
                    { href: "/admin-dashboard", label: "Dashboard" },
                    { href: "/admin-analytics", label: "Analytics" },
                    { href: "/admin-users", label: "Users", active: true }
                  ].map(link => (
                    <Link 
                      key={link.href} 
                      href={link.href}
                      className={`${
                        link.active 
                          ? 'border-indigo-500 text-gray-900' 
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-gray-700 mr-4 text-sm truncate max-w-[150px]">{user?.email}</span>
                <Button onClick={handleLogout} disabled={isLoading} variant="destructive" size="sm">
                  <LogOut className="h-4 w-4 mr-1" /> {isLoading ? 'Logging out...' : 'Logout'}
                </Button>
              </div>
            </div>
          </div>
        </nav>

        <div className="container py-8">
          <div className="mb-8">
            <div className="relative">
              <Input
                type="search"
                placeholder="Search by email address, phone number, or user UID"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10"
              />
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg">
              {error}
            </div>
          ) : (
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Identifier</TableHead>
                    <TableHead>Providers</TableHead>
                    <TableHead className="cursor-pointer">
                      Created
                    </TableHead>
                    <TableHead>Signed In</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>
                        <a 
                          href={`mailto:${user.email}`}
                          className="inline-block hover:text-purple-600 transition-colors"
                          title={`Send email to ${user.email}`}
                        >
                          <Mail className="h-4 w-4 text-gray-500 hover:text-purple-600" />
                        </a>
                      </TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell>{formatDate(user.lastSignedIn)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
} 