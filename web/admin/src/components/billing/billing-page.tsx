'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search, Download, DollarSign, TrendingUp, Calendar, FileText } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

const billingData = [
  { month: 'Jan', revenue: 12000, calls: 4500, cost: 8000 },
  { month: 'Feb', revenue: 15000, calls: 5200, cost: 9500 },
  { month: 'Mar', revenue: 18000, calls: 6100, cost: 11000 },
  { month: 'Apr', revenue: 16000, calls: 5800, cost: 10000 },
  { month: 'May', revenue: 22000, calls: 7200, cost: 13000 },
  { month: 'Jun', revenue: 25000, calls: 8100, cost: 14500 },
]

const invoices = [
  {
    id: 'INV-2024-001',
    userId: 'user_123',
    userName: 'John Doe',
    email: 'john@example.com',
    period: '2024-01',
    amount: 45.67,
    status: 'PAID',
    dueDate: '2024-02-15',
    paidDate: '2024-02-14',
    calls: 234,
    minutes: 567,
  },
  {
    id: 'INV-2024-002',
    userId: 'user_456',
    userName: 'Jane Smith',
    email: 'jane@example.com',
    period: '2024-01',
    amount: 78.90,
    status: 'PENDING',
    dueDate: '2024-02-15',
    paidDate: null,
    calls: 456,
    minutes: 892,
  },
  {
    id: 'INV-2024-003',
    userId: 'user_789',
    userName: 'Bob Johnson',
    email: 'bob@example.com',
    period: '2024-01',
    amount: 23.45,
    status: 'OVERDUE',
    dueDate: '2024-02-15',
    paidDate: null,
    calls: 123,
    minutes: 234,
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PAID':
      return 'bg-green-100 text-green-800'
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800'
    case 'OVERDUE':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function BillingPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [filteredInvoices, setFilteredInvoices] = useState(invoices)

  const handleFilter = () => {
    let filtered = invoices

    if (searchTerm) {
      filtered = filtered.filter(invoice =>
        invoice.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter)
    }

    setFilteredInvoices(filtered)
  }

  const totalRevenue = billingData.reduce((sum, item) => sum + item.revenue, 0)
  const totalCost = billingData.reduce((sum, item) => sum + item.cost, 0)
  const totalProfit = totalRevenue - totalCost

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <Button>
          <Download className="w-4 h-4 mr-2" />
          Export Reports
        </Button>
      </div>

      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-sm text-green-600">+12% from last period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Total Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalProfit.toLocaleString()}</div>
            <p className="text-sm text-green-600">+8% from last period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Pending Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invoices.filter(inv => inv.status === 'PENDING').length}
            </div>
            <p className="text-sm text-gray-600">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={billingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" fill="#3b82f6" />
              <Bar dataKey="cost" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search invoices..."
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
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="OVERDUE">Overdue</option>
            </select>
            <Button onClick={handleFilter}>
              Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Calls</TableHead>
                <TableHead>Minutes</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono text-sm">{invoice.id}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{invoice.userName}</div>
                      <div className="text-sm text-gray-500">{invoice.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {invoice.period}
                    </div>
                  </TableCell>
                  <TableCell>{invoice.calls}</TableCell>
                  <TableCell>{invoice.minutes}</TableCell>
                  <TableCell className="font-medium">${invoice.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getStatusColor(invoice.status)}>
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      View
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