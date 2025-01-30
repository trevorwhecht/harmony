"use client"

import { useState } from "react"
import { Input, Button, Card, CardBody, CardHeader, Textarea, Divider } from "@nextui-org/react"
import { SendHorizontal, RefreshCw, Download, Mic, MicOff } from "lucide-react"
import { topics, type Topic } from "@/data/topics"

interface Message {
  role: "user" | "assistant" | "system"
  content: string
  timestamp?: string
}

interface Participant {
  name: string
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sessionStarted, setSessionStarted] = useState(false)
  const [participant1, setParticipant1] = useState<Participant>({ name: "" })
  const [participant2, setParticipant2] = useState<Participant>({ name: "" })
  const [selectedTopics, setSelectedTopics] = useState<Topic[]>([])
  const [isRecording, setIsRecording] = useState(false)

  const selectRandomTopics = () => {
    const shuffled = [...topics].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, 4)
  }

  const handleStartSession = () => {
    if (!participant1.name || !participant2.name) {
      alert("Please enter both names to continue")
      return
    }
    setSelectedTopics(selectRandomTopics())
    setSessionStarted(true)
  }

  const handleTopicSelect = async (topic: Topic) => {
    const systemMessage: Message = {
      role: "system",
      content: `You are a couples counselor facilitating a discussion between ${participant1.name} and ${participant2.name} about: ${topic.category}. Current question: ${topic.questions[0]}`,
      timestamp: new Date().toLocaleTimeString(),
    }
    setMessages([systemMessage])
    // Future: Implement audio recording here
  }

  const toggleRecording = () => {
    setIsRecording(!isRecording)
    // Future: Implement audio recording logic here
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const newMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString(),
    }

    setMessages((prev) => [...prev, newMessage])
    setInput("")
    setIsLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "You are a compassionate couples counselor. Help guide the conversation, provide insights, and maintain a supportive environment. When appropriate, ask questions to deepen understanding.",
            },
            ...messages,
            newMessage,
          ],
        }),
      })

      if (!res.ok) throw new Error("Failed to get response")

      const data = await res.json()
      const assistantMessage: Message = {
        role: "assistant",
        content: data.content,
        timestamp: new Date().toLocaleTimeString(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewSession = () => {
    if (messages.length > 0) {
      // Save current session summary before clearing
      const sessionText = messages.map((m) => `${m.role}: ${m.content}`).join("\n\n")
      //setSessionSummary(sessionText)
    }
    setMessages([])
    setSessionStarted(false)
    setParticipant1({ name: "" })
    setParticipant2({ name: "" })
    setSelectedTopics([])
  }

  const downloadSession = () => {
    const sessionText = messages.map((m) => `${m.timestamp} - ${m.role}: ${m.content}`).join("\n\n")
    const blob = new Blob([sessionText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `counseling-session-${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <main className="min-h-screen bg-black p-4 md:p-8">
      <Card className="max-w-4xl mx-auto bg-gray-900 text-white">
        <CardHeader className="flex justify-between items-center px-6 py-4 bg-gray-800">
          <div>
            <h1 className="text-2xl font-bold text-white">Harmony</h1>
            <p className="text-sm text-gray-400">Couples Counseling Assistant</p>
          </div>
          {sessionStarted && (
            <div className="flex gap-2">
              <Button isIconOnly variant="flat" onClick={handleNewSession} className="text-white">
                <RefreshCw className="h-5 w-5" />
              </Button>
              <Button
                isIconOnly
                variant="flat"
                onClick={downloadSession}
                isDisabled={messages.length === 0}
                className="text-white"
              >
                <Download className="h-5 w-5" />
              </Button>
            </div>
          )}
        </CardHeader>
        <Divider />
        <CardBody className="p-4 md:p-6">
          {!sessionStarted ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="First Partner's Name"
                  value={participant1.name}
                  onChange={(e) => setParticipant1({ name: e.target.value })}
                  className="text-white"
                  variant="bordered"
                />
                <Input
                  label="Second Partner's Name"
                  value={participant2.name}
                  onChange={(e) => setParticipant2({ name: e.target.value })}
                  className="text-white"
                  variant="bordered"
                />
              </div>
              <Button color="primary" size="lg" className="w-full" onClick={handleStartSession}>
                Start Session
              </Button>
            </div>
          ) : selectedTopics.length > 0 && messages.length === 0 ? (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Select a Topic to Discuss:</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedTopics.map((topic, index) => (
                  <Button
                    key={index}
                    color="primary"
                    variant="bordered"
                    className="p-4 h-auto text-left"
                    onClick={() => handleTopicSelect(topic)}
                  >
                    <div>
                      <h3 className="font-semibold mb-2">{topic.category}</h3>
                      <p className="text-sm text-gray-400">{topic.questions[0]}</p>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-4 h-[60vh] overflow-y-auto">
                {messages.map((message, index) => (
                  <div key={index} className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"}`}>
                    <div
                      className={`max-w-[80%] p-4 rounded-lg ${
                        message.role === "user" ? "bg-blue-600 text-white" : "bg-gray-800 text-white"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <span className="text-xs opacity-70 mt-2 block">{message.timestamp}</span>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  isIconOnly
                  color={isRecording ? "danger" : "success"}
                  onClick={toggleRecording}
                  className="shrink-0"
                >
                  {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Share your thoughts..."
                  minRows={1}
                  maxRows={4}
                  className="flex-grow bg-gray-800 text-white"
                  disabled={isLoading}
                />
                <Button
                  isIconOnly
                  color="primary"
                  isDisabled={isLoading || !input.trim()}
                  onClick={handleSubmit}
                  className="shrink-0"
                >
                  <SendHorizontal className="h-5 w-5" />
                </Button>
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </main>
  )
}

