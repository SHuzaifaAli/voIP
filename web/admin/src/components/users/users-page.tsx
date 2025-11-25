'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Plus, Edit, Trash2, Shield, UserX, MoreHorizontal } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

const users = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'USER',
    status: 'ACTIVE',
    sipUsername: 'sip_12345678',
    lastLogin: '2024-01-15T10:30:00Z',
    callsMade: 45,
    totalDuration: 1234,
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    sipUsername: 'sip_87654321',
    lastLogin: '2024-01-15T09:15:00Z',
    callsMade: 23,
    totalDuration: 567,
  },
  {
    id: 3,
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'USER',
    status: 'SUSPENDED',
    sipUsername: 'sip_45678901',
    lastLogin: '2024-01-14T16:45:00Z',
    callsMade: 12,
    totalDuration: 234,
  },
]

const getRoleColor = (role: string) => {
  switch (role) {
    case 'ADMIN':
      return 'bg-red-100 text-red-800'
    case 'OPERATOR':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-green-100 text-green-800'
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-800'
    case 'SUSPENDED':
      return 'bg-red-100 text-red-800'
    case 'INACTIVE':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredUsers, setFilteredUsers] = useState(users)

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    const filtered = users.filter(user =>
      user.name.toLowerCase().includes(value.toLowerCase()) ||
      user.email.toLowerCase().includes(value.toLowerCase()) ||
      user.sipUsername.toLowerCase().includes(value.toLowerCase())
    )
    setFilteredUsers(filtered)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>SIP Username</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Calls</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getRoleColor(user.role)}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getStatusColor(user.status)}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{user.sipUsername}</TableCell>
                  <TableCell>{new Date(user.lastLogin).toLocaleString()}</TableCell>
                  <TableCell>{user.callsMade}</TableCell>
                  <TableCell>{Math.floor(user.totalDuration / 60)}m {user.totalDuration % 60}s</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Shield className="w-4 h-4 mr-2" />
                          Reset SIP Credentials
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <UserX className="w-4 h-4 mr-2" />
                          Suspend
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}