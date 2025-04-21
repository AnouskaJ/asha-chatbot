"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Send, Mic, Square, Volume2, VolumeX, Briefcase, Calendar, Users, BookOpen, Loader2, Play, Pause, Flag, AlertCircle, FileText } from "lucide-react"
import axios from "axios"
import { marked } from "marked"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/useAuth"
import { db } from "@/lib/firebase"
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore"
import { API_URL } from "../../lib/constants"
import { Input } from "@/components/ui/input"

declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

type Message = {
  id: string
  content: string
  sender: "user" | "bot"
  timestamp: Date
  isSpeaking?: boolean
  hasFeedback?: boolean
}

const initialMessages: Message[] = [
  {
    id: "1",
    content: "Hi there! I'm Asha, your AI career assistant. How can I help you today?",
    sender: "bot",
    timestamp: new Date(),
  },
]

const languageOptions = [
  { value: "english", label: "English" },
  { value: "hindi", label: "हिन्दी (Hindi)" },
  { value: "kannada", label: "ಕನ್ನಡ (Kannada)" },
  { value: "tamil", label: "தமிழ் (Tamil)" },
  { value: "telugu", label: "తెలుగు (Telugu)" },
  { value: "gujarati", label: "ગુજરાતી (Gujarati)" },
  { value: "marathi", label: "मराठी (Marathi)" },
  { value: "punjabi", label: "ਪੰਜਾਬੀ (Punjabi)" },
  { value: "konkani", label: "कोंकणी (Konkani)" },
]

const typingMessages = {
  english: "Asha is typing...",
  hindi: "आशा टाइप कर रही है...",
  kannada: "ಆಶಾ ಟೈಪ್ ಮಾಡುತ್ತಿದೆ...",
  tamil: "ஆஷா தட்டச்சு செய்கிறார்...",
  telugu: "ఆశా టైప్ చేస్తోంది...",
  gujarati: "આશા ટાઇપ કરી રહી છે...",

  marathi: "आशा टाइપ करत आहे...",
  punjabi: "ਆਸ਼ਾ ਟਾਈਪ ਕਰ ਰਹੀ ਹੈ...",
  konkani: "आशा टायप करता...",
}

const messageAnimationClass = "transition-all duration-300 animate-fadeIn"
const botMessageAnimationClass = "transition-all duration-300 animate-slideInLeft"
const userMessageAnimationClass = "transition-all duration-300 animate-slideInRight"
const typingIndicatorClass = "animate-pulse"
const voiceButtonClass = "hover:scale-105 transition-transform duration-200"

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null)
  const [selectedLanguage, setSelectedLanguage] = useState("english")
  const [queryType, setQueryType] = useState("career")
  const [chartData, setChartData] = useState(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null)
  const [globalSpeakingEnabled, setGlobalSpeakingEnabled] = useState(true)
  const [feedbackMessage, setFeedbackMessage] = useState<Message | null>(null)
  const [feedbackText, setFeedbackText] = useState("")
  const [feedbackType, setFeedbackType] = useState<"inaccurate" | "biased" | "irrelevant" | "other">("other")
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false)
  const [feedbackSuccess, setFeedbackSuccess] = useState(false)
  
  // Trusted sources array
  const [trustedSources, setTrustedSources] = useState<any[]>([])

  const { user } = useAuth()
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Load voices for TTS
  useEffect(() => {
    if (typeof window !== "undefined" && speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => {
        // Voices ready
      }
    }
    return () => {
      if (typeof window !== "undefined" && speechSynthesis.speaking) {
        speechSynthesis.cancel()
      }
    }
  }, [])

  // Fetch trusted sources from the admin endpoint
  const fetchTrustedSources = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/trusted-sources`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        timeout: 5000,
      })
      setTrustedSources(response.data)
    } catch (error) {
      console.error("Error fetching trusted sources:", error)
      setTrustedSources([])
    }
  }

  useEffect(() => {
    fetchTrustedSources()
  }, [])

  // Topic classification helper function
  const detectTopic = async (message: string): Promise<string> => {
    try {
      const response = await fetch(`${API_URL}/api/classify-topic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      })
      if (!response.ok) throw new Error("Failed topic classification")
      const data = await response.json()
      return data.topic || "general"
    } catch (error) {
      console.error("Error classifying topic:", error)
      return "general"
    }
  }

  // Save conversation to Firestore
  const saveConversationToFirestore = async (userMessage: string, botResponse: string, responseTime?: number) => {
    try {
      const topic = await detectTopic(userMessage)

      if (!currentConversationId) {
        const conversationRef = await addDoc(collection(db, "conversations"), {
          userId: user ? user.uid : "anonymous",
          startTime: serverTimestamp(),
          language: selectedLanguage,
          messages: [
            { content: userMessage, sender: "user" as "user", timestamp: new Date().getTime() },
            { content: botResponse, sender: "bot" as "bot", timestamp: new Date().getTime() },
          ],
          messageCount: 2,
          topic,
          timestamp: new Date().getTime(),
          responseTime: responseTime || null,
        })
        setCurrentConversationId(conversationRef.id)
        console.log("New conversation created:", conversationRef.id)
      } else {
        const conversationRef = doc(db, "conversations", currentConversationId)
        await updateDoc(conversationRef, {
          messages: [
            ...messages.map((m) => ({
              content: m.content,
              sender: m.sender,
              timestamp: m.timestamp.getTime(),
            })),
            { content: botResponse, sender: "bot" as "bot", timestamp: new Date().getTime() },
          ],
          messageCount: messages.length + 1,
          lastUpdated: new Date().getTime(),
          responseTime: responseTime || null,
        })
        console.log("Conversation updated:", currentConversationId)
      }
    } catch (error) {
      console.error("Error saving conversation:", error)
    }
  }

  const recordBiasDetection = async (biasData: any) => {
    try {
      await addDoc(collection(db, "biasDetection"), {
        conversationId: currentConversationId,
        userId: user ? user.uid : "anonymous",
        type: biasData.type || "Unspecified",
        description: biasData.description || "",
        detected: true,
        prevented: biasData.prevented || false,
        originalText: biasData.originalText || "",
        modifiedText: biasData.modifiedText || "",
        timestamp: new Date().getTime(),
        language: selectedLanguage,
      })
      console.log("Bias detection recorded")
    } catch (error) {
      console.error("Error recording bias detection:", error)
    }
  }

  // Submit a chat message
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    // Check for quit/exit commands
    if (["quit", "exit"].includes(input.trim().toLowerCase())) {
      setMessages([
        ...messages,
        {
          id: Date.now().toString(),
          content: input,
          sender: "user" as "user",
          timestamp: new Date(),
        },
        {
          id: (Date.now() + 1).toString(),
          content: "Thank you for chatting with Asha! If you have more questions later, I'll be here.",
          sender: "bot" as "bot",
          timestamp: new Date(),
        },
      ])
      setInput("")
      return
    }

    const userMessage = input
    const updatedMessages = [
      ...messages,
      {
        id: Date.now().toString(),
        content: userMessage,
        sender: "user" as "user",
        timestamp: new Date(),
      },
    ]
    setMessages(updatedMessages)
    setInput("")
    setIsLoading(true)
    const startTime = performance.now()

    try {
      const topicResponse = await fetch(`${API_URL}/api/classify-topic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      })
      if (!topicResponse.ok) throw new Error("Failed to classify topic")
      const { topic } = await topicResponse.json()

      const languageMap: Record<string, string> = {
        english: "English",
        gujarati: "Gujarati",
        hindi: "Hindi",
        kannada: "Kannada",
        konkani: "Konkani",
        marathi: "Marathi",
        punjabi: "Punjabi",
        tamil: "Tamil",
        telugu: "Telugu",
      }
      const mappedLangLabel = languageMap[selectedLanguage] || "English"

      const response = await axios.post(
        `${API_URL}/chat`,
        {
          query: userMessage,
          language: mappedLangLabel,
          topic,
          query_type: queryType,
          chart_data: chartData,
          conversation_history: messages.map((m) => ({
            role: m.sender === "user" ? "user" : "assistant",
            content: m.content,
          })),
          user_id: user?.uid || "anonymous",
          timestamp: new Date().toISOString(),
        },
        {
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          timeout: 30000,
          validateStatus: () => true,
        }
      )

      if (response.status !== 200) {
        console.error("API error:", response.data)
        throw new Error(response.data?.error || "Server error")
      }

      const endTime = performance.now()
      const responseTime = (endTime - startTime) / 1000
      const botResponse = response.data.response

      if (response.data.bias_detected) {
        recordBiasDetection(response.data.bias_info)
      }

      if (response.data.chart_data) setChartData(response.data.chart_data)
      else setChartData(null)

      const newBotMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: botResponse,
        sender: "bot",
        timestamp: new Date(),
      }
      setMessages([...updatedMessages, newBotMessage])
      await saveConversationToFirestore(userMessage, botResponse, responseTime)

      if (typeof window !== "undefined") {
        if (speechSynthesis.speaking) speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(botResponse)
        setCurrentUtterance(utterance)
        if (selectedLanguage !== "english") {
          switch (selectedLanguage) {
            case "gujarati":
              utterance.lang = "gu-IN"
              break
            case "hindi":
              utterance.lang = "hi-IN"
              break
            case "kannada":
              utterance.lang = "kn-IN"
              break
            case "konkani":
              utterance.lang = "kok-IN"
              break
            case "marathi":
              utterance.lang = "mr-IN"
              break
            case "punjabi":
              utterance.lang = "pa-IN"
              break
            case "tamil":
              utterance.lang = "ta-IN"
              break
            case "telugu":
              utterance.lang = "te-IN"
              break
            default:
              utterance.lang = "en-US"
          }
        } else {
          utterance.lang = "en-US"
        }
        utterance.onstart = () => {
          setIsSpeaking(true)
          setSpeakingMessageId(newBotMessage.id)
        }
        utterance.onpause = () => setIsSpeaking(false)
        utterance.onresume = () => setIsSpeaking(true)
        utterance.onend = () => {
          setIsSpeaking(false)
          setSpeakingMessageId(null)
        }
        speechSynthesis.speak(utterance)
      }
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I encountered an error processing your request. Please try again.",
        sender: "bot" as "bot",
        timestamp: new Date(),
      }
      setMessages([...updatedMessages, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Speech-to-text handler
  const handleSpeechToText = async () => {
    if (!isListening) {
      try {
        if (typeof window !== "undefined" && window.webkitSpeechRecognition) {
          const SpeechRecognition = window.webkitSpeechRecognition
          const recognition = new SpeechRecognition()
          let langCode = "en-US"
          switch (selectedLanguage) {
            case "gujarati":
              langCode = "gu-IN"
              break
            case "hindi":
              langCode = "hi-IN"
              break
            case "kannada":
              langCode = "kn-IN"
              break
            case "konkani":
              langCode = "kok-IN"
              break
            case "marathi":
              langCode = "mr-IN"
              break
            case "punjabi":
              langCode = "pa-IN"
              break
            case "tamil":
              langCode = "ta-IN"
              break
            case "telugu":
              langCode = "te-IN"
              break
            default:
              langCode = "en-US"
          }
          recognition.lang = langCode
          recognition.continuous = false
          recognition.interimResults = false
          setIsListening(true)
          recognition.onresult = (event: any) => {
            const text = event.results[0][0].transcript
            setInput(text)
            setIsListening(false)
          }
          recognition.onerror = () => setIsListening(false)
          recognition.onend = () => setIsListening(false)
          recognition.start()
        } else {
          console.error("SpeechRecognition not supported in this browser")
        }
      } catch (error) {
        console.error("Speech-to-text error:", error)
        setIsListening(false)
      }
    } else {
      setIsListening(false)
    }
  }

  const handleStopSpeech = () => {
    if (typeof window !== "undefined") {
      if (speechSynthesis.speaking) {
        speechSynthesis.pause()
        setSpeakingMessageId(null)
      }
      setIsSpeaking(false)
    }
  }

  const handlePlayResponse = (messageId: string, content: string) => {
    if (typeof window === "undefined") return
    if (speakingMessageId === messageId && speechSynthesis.speaking) {
      if (speechSynthesis.paused) {
        speechSynthesis.resume()
        setIsSpeaking(true)
        setSpeakingMessageId(messageId)
      } else {
        speechSynthesis.pause()
        setIsSpeaking(false)
        setSpeakingMessageId(null)
      }
      return
    }
    if (speechSynthesis.speaking) speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(content)
    setCurrentUtterance(utterance)
    let langCode = "en-US"
    switch (selectedLanguage) {
      case "gujarati":
        langCode = "gu-IN"
        break
      case "hindi":
        langCode = "hi-IN"
        break
      case "kannada":
        langCode = "kn-IN"
        break
      case "konkani":
        langCode = "kok-IN"
        break
      case "marathi":
        langCode = "mr-IN"
        break
      case "punjabi":
        langCode = "pa-IN"
        break
      case "tamil":
        langCode = "ta-IN"
        break
      case "telugu":
        langCode = "te-IN"
        break
      default:
        langCode = "en-US"
    }
    utterance.lang = langCode
    utterance.onstart = () => {
      setIsSpeaking(true)
      setSpeakingMessageId(messageId)
    }
    utterance.onpause = () => setIsSpeaking(false)
    utterance.onresume = () => setIsSpeaking(true)
    utterance.onend = () => {
      setIsSpeaking(false)
      setSpeakingMessageId(null)
    }
    speechSynthesis.speak(utterance)
    setIsSpeaking(true)
    setSpeakingMessageId(messageId)
  }
  useEffect(() => {
    const handleTabSwitch = () => {
      if (document.visibilityState === "hidden") {
        speechSynthesis.cancel()
        setIsSpeaking(false)
        setSpeakingMessageId(null)
      }
    }

    document.addEventListener("visibilitychange", handleTabSwitch)

    return () => {
      document.removeEventListener("visibilitychange", handleTabSwitch)
    }
  }, [])

  const renderMessageContent = (content: string) => {
    try {
      const htmlContent = marked(content)
      return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
    } catch {
      return <div>{content}</div>
    }
  }

  // Feedback dialog component
  const handleFeedbackSubmit = async () => {
    if (!feedbackMessage) return
    setFeedbackSubmitting(true)
    try {
      await addDoc(collection(db, "feedback"), {
        messageId: feedbackMessage.id,
        conversationId: currentConversationId,
        userId: user ? user.uid : "anonymous",
        messageContent: feedbackMessage.content,
        feedbackType,
        feedbackText: "",
        accuracyRating:
          feedbackType === "inaccurate"
            ? "inaccurate"
            : feedbackType === "irrelevant"
            ? "unsure"
            : "accurate",
        timestamp: new Date().getTime(),
        language: selectedLanguage,
      })

      await fetch(`${API_URL}/api/submit-feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: feedbackMessage.id,
          messageContent: feedbackMessage.content,
          feedbackType,
          feedbackText: "",
          conversationId: currentConversationId,
          helpful: feedbackType !== "inaccurate" && feedbackType !== "irrelevant",
          language: selectedLanguage,
        }),
      })

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === feedbackMessage.id ? { ...msg, hasFeedback: true } : msg
        )
      )
      setFeedbackSuccess(true)
      setTimeout(() => {
        setFeedbackMessage(null)
        setFeedbackText("")
        setFeedbackType("other")
        setFeedbackSuccess(false)
      }, 3000)
    } catch (error) {
      console.error("Error submitting feedback:", error)
    } finally {
      setFeedbackSubmitting(false)
    }
  }

  const FeedbackDialog = () => {
    if (!feedbackMessage) return null
    const handleClose = () => {
      setFeedbackMessage(null)
      setFeedbackText("")
      setFeedbackType("other")
    }
    return (
      <Dialog open={!!feedbackMessage} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-[425px] z-50">
          <DialogHeader>
            <DialogTitle>Report an Issue</DialogTitle>
            <DialogDescription>
              Help us improve Asha AI by reporting any issues with this response.
            </DialogDescription>
          </DialogHeader>
          {feedbackSuccess ? (
            <div className="py-6 text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium">Thank You!</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Your feedback has been submitted successfully.
              </p>
            </div>
          ) : (
            <div>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="feedback-type">Issue Type</Label>
                  <Select value={feedbackType} onValueChange={(val: any) => setFeedbackType(val)}>
                    <SelectTrigger id="feedback-type">
                      <SelectValue placeholder="Select an issue type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inaccurate">Inaccurate Information</SelectItem>
                      <SelectItem value="biased">Biased Response</SelectItem>
                      <SelectItem value="irrelevant">Irrelevant Answer</SelectItem>
                      <SelectItem value="other">Other Issue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    handleFeedbackSubmit()
                  }}
                  disabled={feedbackSubmitting}
                  className="bg-secondary hover:bg-secondary/90"
                >
                  {feedbackSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Feedback"
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    )
  }

  // Render a list of trusted sources
  // Render a list of trusted sources
  function TrustedSourcesList() {
    if (!trustedSources || trustedSources.length === 0) {
      return (
        <p className="text-sm text-muted-foreground font-light">
          No trusted sources available.
        </p>
      );
    }
  
    return (
      <ul className="space-y-5">
        {trustedSources
          .filter((src) => src.verified)
          .map((source) => (
            <li
              key={source.id}
              className="bg-background border border-border p-4 rounded-xl shadow-sm"
            >
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[hsl(var(--primary))] font-semibold underline underline-offset-2 hover:text-[hsl(var(--secondary))] transition-colors"
              >
                {source.name}
              </a>
              <p className="text-sm text-[hsl(var(--secondary))] mt-1 font-medium leading-snug">
                {source.description}
              </p>
            </li>
          ))}
      </ul>
    );
  
  }

  // Optionally prefill prompt with trusted sources data
  const handleVerifiedResourcesRequest = () => {
    let prompt = "Here are some verified resources for women's career development:"
    trustedSources.forEach((src) => {
      if (src.verified) {
        prompt += `\n- ${src.name}: ${src.description} (${src.url})`
      }
    })
    setInput(prompt)
  }

  return (
    <>
      <div className="px-2 md:px-6 py-2 md:py-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Quick Actions (left) */}
          <div className="md:col-span-3">
          <Card className="p-4 h-[78vh] border border-[hsl(var(--primary)/0.9)] bg-pink-100 dark:bg-[hsl(var(--secondary))] rounded-xl shadow-sm">
          <h3 className="font-semibold text-[hsl(var(--secondary))] text-lg mb-3">Quick Actions</h3>

              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={() => setInput("Show me job opportunities")}>
                  <Briefcase className="mr-2 h-4 w-4" />
                  Find Jobs
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => setInput("What events are coming up?")}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Upcoming Events
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => setInput("Connect me with mentors")}>
                  <Users className="mr-2 h-4 w-4" />
                  Connect to Mentors
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => setInput("Help me improve my skills")}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Skill Development
                </Button>
              </div>
              {/* Language Selector */}
              <div className="mt-6 space-y-2 bg-pink-100 dark:bg-[hsl(var(--secondary))] rounded-lg p-4 shadow">
                <h4 className="font-semibold text-[hsl(var(--secondary))] text-base mt-0 mb-2">
                  Language
                </h4>
                <Select
                  value={selectedLanguage}
                  onValueChange={(v) => setSelectedLanguage(v)}
                >
                  <SelectTrigger id="language-selector" className="w-full">
                    <SelectValue placeholder="Select Language" />
                  </SelectTrigger>

                  {/* make the menu background white */}
                  <SelectContent className="bg-white dark:bg-white">
                    {/* optionally constrain height / padding */}
                    <div className="py-1">
                      {languageOptions.map((lang) => (
                        <SelectItem
                          key={lang.value}
                          value={lang.value}
                          className="bg-white text-black hover:bg-gray-200 dark:hover:bg-gray-200"
                        >
                          {lang.label}
                        </SelectItem>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
              </div>

            </Card>
          </div>

          {/* Chat interface (middle) - Increased height to 80vh */}
          <div className="md:col-span-6">
            <Card className="flex flex-col h-[80vh]">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                  <img
                      src="/logo.png"
                      alt="Asha AI"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  </div>
                  <div>
                    <h2 className="font-semibold">Asha AI</h2>
                    <p className="text-xs text-muted-foreground">Your Career Assistant</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div key={msg.id} ref={idx === messages.length - 1 ? messagesEndRef : null} className={`flex justify-${msg.sender === "user" ? "end" : "start"}`}>
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.sender === "user"
                        ? `bg-primary/10 rounded-tr-none ${userMessageAnimationClass}`
                        : `bg-muted rounded-tl-none ${botMessageAnimationClass}`
                    }`}
                  >
                    <div className="flex flex-col">
                      {msg.sender === "bot" ? ( // <-- START HERE
                        <>

                          <div className="prose prose-sm max-w-none dark:prose-invert [&_a]:text-blue-600 [&_a]:underline hover:[&_a]:text-blue-800 dark:[&_a]:text-blue-400 dark:hover:[&_a]:text-blue-300">
                            {renderMessageContent(msg.content)}
                          </div>
                            <div className="flex justify-between items-center mt-2">
                              <button
                                onClick={() => setFeedbackMessage(msg)}
                                className="text-xs flex items-center text-muted-foreground hover:text-secondary"
                                disabled={msg.hasFeedback}
                              >
                                {msg.hasFeedback ? (
                                  <span className="flex items-center text-green-600">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Feedback sent
                                  </span>
                                ) : (
                                  <>
                                    <Flag className="h-3 w-3 mr-1" />
                                    Report Issue
                                  </>
                                )}
                              </button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={`h-8 w-8 p-1 rounded-full border border-border hover:bg-muted transition-colors ${voiceButtonClass}`}
                                onClick={() => handlePlayResponse(msg.id, msg.content)}
                                title={isSpeaking && speakingMessageId === msg.id ? "Pause" : "Listen"}
                              >
                                {isSpeaking && speakingMessageId === msg.id ? (
                                  <VolumeX className="h-4 w-4 text-[hsl(var(--secondary))]" />
                                ) : (
                                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>

                                                        </div>
                          </>
                        ) : (
                          <>
                            <p className="text-sm">{msg.content}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-lg p-3 bg-muted rounded-tl-none animate-fadeIn">
                      <div className="flex items-center space-x-2">
                        <div className={typingIndicatorClass}>
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                        <p className="text-sm">
                          {typingMessages[selectedLanguage as keyof typeof typingMessages] ||
                            "Asha is typing..."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input area */}
              <form onSubmit={handleSubmit} className="p-4 border-t">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Type your message..."
                      className="w-full rounded-full border border-input pl-4 pr-12 py-2 bg-background"
                    />
                    <button type="submit" disabled={isLoading || !input.trim()} className={`absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-primary flex items-center justify-center ${voiceButtonClass}`}>
                      <Send className="h-4 w-4 text-white" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={isListening ? () => setIsListening(false) : handleSpeechToText}
                    className={`h-10 w-10 rounded-full ${isListening ? "bg-red-500" : "bg-secondary"} flex items-center justify-center ${voiceButtonClass}`}
                  >
                    {isListening ? <Square className="h-5 w-5 text-white animate-pulse" /> : <Mic className="h-5 w-5 text-white" />}
                  </button>

                </div>
              </form>
            </Card>
          </div>

    {/* Verified Resources (right) with adjusted height and new styling */}
        <div className="md:col-span-3">
          <Card className="flex flex-col h-[78vh] border border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--secondary)/0.1)]">
            
            {/* Header */}
            <div className="p-4 border-b border-[hsl(var(--primary)/0.3)] bg-white dark:bg-muted rounded-t-xl">
              <h3 className="font-semibold text-lg text-[hsl(var(--primary))]">
                Verified Resources
              </h3>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <TrustedSourcesList />
            </div>
            
          </Card>
        </div>

        </div>
      </div>
      <FeedbackDialog />
    </>
  )
}
