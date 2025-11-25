'use client'

import { useState } from 'react'
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useWebRTC } from '@/hooks/use-webrtc'

export default function Home() {
  const [targetNumber, setTargetNumber] = useState('')
  const [isInCall, setIsInCall] = useState(false)
  
  const {
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    callDuration,
    connect,
    disconnect,
    toggleMute,
    toggleVideo,
    makeCall
  } = useWebRTC()

  const handleMakeCall = async () => {
    if (!targetNumber.trim()) return
    
    try {
      await makeCall(targetNumber)
      setIsInCall(true)
    } catch (error) {
      console.error('Failed to make call:', error)
    }
  }

  const handleEndCall = () => {
    disconnect()
    setIsInCall(false)
    setTargetNumber('')
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">CallStack</h1>
          <p className="text-slate-600">WebRTC Softphone Client</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Local Video */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5" />
                You
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative bg-slate-900 rounded-lg aspect-video flex items-center justify-center overflow-hidden">
                {localStream ? (
                  <video
                    ref={(el) => {
                      if (el && localStream) {
                        el.srcObject = localStream
                      }
                    }}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-slate-400 text-center">
                    <Video className="w-12 h-12 mx-auto mb-2" />
                    <p>Camera off</p>
                  </div>
                )}
                {isVideoOff && localStream && (
                  <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                    <Video className="w-12 h-12 text-slate-400" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Remote Video */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                {targetNumber || 'Remote'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative bg-slate-900 rounded-lg aspect-video flex items-center justify-center overflow-hidden">
                {remoteStream ? (
                  <video
                    ref={(el) => {
                      if (el && remoteStream) {
                        el.srcObject = remoteStream
                      }
                    }}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-slate-400 text-center">
                    <Phone className="w-12 h-12 mx-auto mb-2" />
                    <p>Waiting for remote...</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Call Controls */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            {!isInCall ? (
              <div className="flex gap-4">
                <Input
                  type="tel"
                  placeholder="Enter phone number or user ID"
                  value={targetNumber}
                  onChange={(e) => setTargetNumber(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleMakeCall}
                  disabled={!targetNumber.trim()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="text-slate-600">
                  {callDuration > 0 && (
                    <span className="font-mono">
                      {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleMute}
                    className={isMuted ? 'bg-red-50 border-red-200' : ''}
                  >
                    {isMuted ? (
                      <MicOff className="w-4 h-4 text-red-600" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleVideo}
                    className={isVideoOff ? 'bg-red-50 border-red-200' : ''}
                  >
                    {isVideoOff ? (
                      <VideoOff className="w-4 h-4 text-red-600" />
                    ) : (
                      <Video className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    onClick={handleEndCall}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <PhoneOff className="w-4 h-4 mr-2" />
                    End Call
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Connection Status */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-slate-600">Connected to signaling server</span>
              </div>
              <div className="text-slate-500">
                Status: {isInCall ? 'In Call' : 'Ready'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}