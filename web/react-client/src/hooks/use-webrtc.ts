'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

interface WebRTCState {
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  isMuted: boolean
  isVideoOff: boolean
  callDuration: number
  isConnected: boolean
  isCallActive: boolean
}

export const useWebRTC = () => {
  const [state, setState] = useState<WebRTCState>({
    localStream: null,
    remoteStream: null,
    isMuted: false,
    isVideoOff: false,
    callDuration: 0,
    isConnected: false,
    isCallActive: false
  })

  const socketRef = useRef<Socket | null>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const callDurationIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const updateState = useCallback((updates: Partial<WebRTCState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  // Initialize socket connection
  const connect = useCallback(async () => {
    try {
      const socket = io('http://localhost:3001', {
        transports: ['websocket']
      })

      socket.on('connect', () => {
        console.log('Connected to signaling server')
        updateState({ isConnected: true })
      })

      socket.on('disconnect', () => {
        console.log('Disconnected from signaling server')
        updateState({ isConnected: false })
      })

      socket.on('offer', async ({ offer, from }) => {
        if (!peerConnectionRef.current) {
          await createPeerConnection()
        }
        
        await peerConnectionRef.current!.setRemoteDescription(new RTCSessionDescription(offer))
        const answer = await peerConnectionRef.current!.createAnswer()
        await peerConnectionRef.current!.setLocalDescription(answer)
        
        socket.emit('answer', { answer, to: from })
      })

      socket.on('answer', async ({ answer }) => {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer))
        }
      })

      socket.on('ice-candidate', async ({ candidate }) => {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate))
        }
      })

      socketRef.current = socket
    } catch (error) {
      console.error('Failed to connect to signaling server:', error)
    }
  }, [updateState])

  // Create RTCPeerConnection
  const createPeerConnection = useCallback(async () => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    }

    const peerConnection = new RTCPeerConnection(configuration)

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', {
          candidate: event.candidate,
          to: 'target-user' // This would be dynamic in a real app
        })
      }
    }

    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams
      updateState({ remoteStream })
    }

    peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', peerConnection.connectionState)
      if (peerConnection.connectionState === 'connected') {
        startCallDuration()
      } else if (peerConnection.connectionState === 'disconnected') {
        stopCallDuration()
      }
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current!)
      })
    }

    peerConnectionRef.current = peerConnection
    return peerConnection
  }, [updateState])

  // Get local media stream
  const getLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })
      
      localStreamRef.current = stream
      updateState({ localStream: stream })
      return stream
    } catch (error) {
      console.error('Failed to get local stream:', error)
      throw error
    }
  }, [updateState])

  // Make a call
  const makeCall = useCallback(async (targetUserId: string) => {
    try {
      if (!socketRef.current?.connected) {
        await connect()
      }

      const localStream = await getLocalStream()
      const peerConnection = await createPeerConnection()

      const offer = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(offer)

      socketRef.current.emit('call', {
        target: targetUserId,
        offer: offer
      })

      updateState({ isCallActive: true })
    } catch (error) {
      console.error('Failed to make call:', error)
      throw error
    }
  }, [connect, getLocalStream, createPeerConnection, updateState])

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks()
      audioTracks.forEach(track => {
        track.enabled = !track.enabled
      })
      updateState({ isMuted: !state.isMuted })
    }
  }, [state.isMuted, updateState])

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks()
      videoTracks.forEach(track => {
        track.enabled = !track.enabled
      })
      updateState({ isVideoOff: !state.isVideoOff })
    }
  }, [state.isVideoOff, updateState])

  // Start call duration timer
  const startCallDuration = useCallback(() => {
    let duration = 0
    callDurationIntervalRef.current = setInterval(() => {
      duration++
      updateState({ callDuration: duration })
    }, 1000)
  }, [updateState])

  // Stop call duration timer
  const stopCallDuration = useCallback(() => {
    if (callDurationIntervalRef.current) {
      clearInterval(callDurationIntervalRef.current)
      callDurationIntervalRef.current = null
    }
  }, [])

  // Disconnect and cleanup
  const disconnect = useCallback(() => {
    stopCallDuration()
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
      localStreamRef.current = null
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }

    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }

    updateState({
      localStream: null,
      remoteStream: null,
      isCallActive: false,
      callDuration: 0,
      isConnected: false
    })
  }, [stopCallDuration, updateState])

  // Auto-connect on mount
  useEffect(() => {
    connect()
    return () => disconnect()
  }, [])

  return {
    localStream: state.localStream,
    remoteStream: state.remoteStream,
    isMuted: state.isMuted,
    isVideoOff: state.isVideoOff,
    callDuration: state.callDuration,
    isConnected: state.isConnected,
    isCallActive: state.isCallActive,
    connect,
    disconnect,
    makeCall,
    toggleMute,
    toggleVideo
  }
}