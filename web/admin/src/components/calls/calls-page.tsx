'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Filter, Download, Phone, PhoneOff, Clock, DollarSign } from 'lucide-react'

const calls = [
  {
    id: 'call_123456',
    caller: 'John Doe',
    callee: '+1234567890',
    startTime: '2024-01-15T10:30:00Z',
    endTime: '2024-01-15T10:35:00Z',
    duration: 300,
    status: 'COMPLETED',
    type: 'AUDIO',
    direction: 'OUTBOUND',
    cost: 0.10,
    quality: 4.2,
  },
  {
    id: 'call_123457',
    caller: '+9876543210',
    callee: 'Jane Smith',
    startTime: '2024-01-15T10:25:00Z',
    endTime: '2024-01-15T10:28:00Z',
    duration: 180,
    status: 'COMPLETED',
    type: 'VIDEO',
    direction: 'INBOUND',
    cost: 0.06,
    quality: 4.5,
  },
  {
    id: 'call_123458',
    caller: 'Bob Johnson',
    callee: '+5555555555',
    startTime: '2024-01-15T10:20:00Z',
    endTime: null,
    duration: null,
    status: 'ACTIVE',
    type: 'AUDIO',
    direction: 'OUTBOUND',
    cost: 0.00,
    quality: null,
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-800'
    case 'COMPLETED':
      return 'bg-blue-100 text-blue-800'
    case 'FAILED':
      return 'bg-red-100 text-red-800'
    case 'MISSED':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getTypeColor = (type: string) => {
  switch (type) {
    case 'VIDEO':
      return 'bg-purple-100 text-purple-800'
    case 'AUDIO':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getQualityColor = (quality: number) => {
  if (quality >= 4.0) return 'text-green-600'
  if (quality >= 3.0) return 'text-yellow-600'
  return 'text-red-600'
}

export function CallsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [filteredCalls, setFilteredCalls] = useState(calls)

  const handleFilter = () => {
    let filtered = calls

    if (searchTerm) {
      filtered = filtered.filter(call =>
        call.caller.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.callee.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(call => call.status === statusFilter)
    }

    setFilteredCalls(filtered)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Calls</h1>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CDRs
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Call History</CardTitle>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search calls..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
              <option value="MISSED">Missed</option>
            </select>
            <Button onClick={handleFilter}>
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Call ID</TableHead>
                <TableHead>Parties</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Quality</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCalls.map((call) => (
                <TableRow key={call.id}>
                  <TableCell className="font-mono text-sm">{call.id}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center">
                        {call.direction === 'OUTBOUND' ? (
                          <Phone className="w-4 h-4 text-green-500 mr-2" />
                        ) : (
                          <PhoneOff className="w-4 h-4 text-blue-500 mr-2" />
                        )}
                        <span className="font-medium">{call.caller}</span>
                      </div>
                      <div className="text-sm text-gray-500 ml-6">
                        {call.direction === 'OUTBOUND' ? '→' : '←'} {call.callee}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getTypeColor(call.type)}>
                      {call.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getStatusColor(call.status)}>
                      {call.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {call.duration ? (
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {Math.floor(call.duration / 60)}m {call.duration % 60}s
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-1" />
                      ${call.cost.toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {call.quality ? (
                      <span className={`font-medium ${getQualityColor(call.quality)}`}>
                        {call.quality.toFixed(1)}/5.0
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
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