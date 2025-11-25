'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Phone, User, AlertTriangle } from 'lucide-react'

const recentActivity = [
  {
    id: 1,
    type: 'call',
    message: 'User John Doe started a call to +1234567890',
    timestamp: '2 minutes ago',
    status: 'active',
  },
  {
    id: 2,
    type: 'user',
    message: 'New user Jane Smith registered',
    timestamp: '5 minutes ago',
    status: 'success',
  },
  {
    id: 3,
    type: 'alert',
    message: 'High latency detected on US-East region',
    timestamp: '10 minutes ago',
    status: 'warning',
  },
  {
    id: 4,
    type: 'call',
    message: 'Conference call with 5 participants ended',
    timestamp: '15 minutes ago',
    status: 'completed',
  },
  {
    id: 5,
    type: 'system',
    message: 'Media server scaled up to handle load',
    timestamp: '20 minutes ago',
    status: 'info',
  },
]

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'call':
      return <Phone className="w-4 h-4" />
    case 'user':
      return <User className="w-4 h-4" />
    case 'alert':
      return <AlertTriangle className="w-4 h-4" />
    default:
      return <Clock className="w-4 h-4" />
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800'
    case 'success':
      return 'bg-blue-100 text-blue-800'
    case 'warning':
      return 'bg-yellow-100 text-yellow-800'
    case 'completed':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">{activity.message}</p>
                <div className="flex items-center mt-1 space-x-2">
                  <span className="text-xs text-gray-500">{activity.timestamp}</span>
                  <Badge variant="secondary" className={getStatusColor(activity.status)}>
                    {activity.status}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}