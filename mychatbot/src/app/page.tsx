"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Mic, Upload, Calendar, CheckSquare, Mail, Copy, Download } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";


interface Message {
  id: number;
  sender: "user" | "ai";
  content: string;
  timestamp: string;
}

interface MeetingSummary {
  id: number;
  title: string;
  date: string;
  duration: string;
  summary: string;
  actionItems: ActionItem[];
  participants: string[];
  decisions: string[];
  rawTranscript: string;
}

interface ActionItem {
  id: number;
  task: string;
  assignee: string;
  dueDate: string | null;
  completed: boolean;
}


declare global {
  interface Window {
    pdfjsLib: any;
  }
}

const THEME_KEY = "chatbot-theme";
const GEMINI_API_KEY = ; // Replace securely in prod
const MEETINGS_KEY = "meeting-summaries";

export default function MeetingSummarizer() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isDark, setIsDark] = useState<boolean>(true);
  const [parsedText, setParsedText] = useState<string>("");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("chat");
  const [meetingSummaries, setMeetingSummaries] = useState<MeetingSummary[]>([]);
  const [currentSummary, setCurrentSummary] = useState<MeetingSummary | null>(null);
  const [meetingTitle, setMeetingTitle] = useState<string>("");

  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
  
    const reader = new FileReader();
  
    reader.onload = async () => {
      const typedarray = new Uint8Array(reader.result as ArrayBuffer);
  
      // @ts-ignore to avoid TypeScript complaints about window.pdfjsLib
      const pdfjsLib = window.pdfjsLib;
  
      const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
  
      let fullText = "";
  
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(" ");
        fullText += pageText + "\n\n";
      }
  
      setParsedText(fullText);
      pasteTranscript(fullText);
      setActiveTab("chat");
      setUploadedFileName(file.name);
    };
  
    reader.readAsArrayBuffer(file);
  };
  
  

  useEffect(() => {
    // Load theme preference
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme) setIsDark(savedTheme === "dark");
    
    // Load saved meetings
    const savedMeetings = localStorage.getItem(MEETINGS_KEY);
    if (savedMeetings) {
      try {
        setMeetingSummaries(JSON.parse(savedMeetings));
      } catch (e) {
        console.error("Failed to load saved meetings:", e);
      }
    }

    // Add initial greeting message
    setMessages([
      {
        id: Date.now(),
        sender: "ai",
        content: "Hello! I'm your Meeting Summarizer Assistant. You can upload a meeting transcript (PDF) or paste text, and I'll help you extract key information, action items, and create a summary.",
        timestamp: getTime(),
      }
    ]);
  }, []);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem(MEETINGS_KEY, JSON.stringify(meetingSummaries));
  }, [meetingSummaries]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js";
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";
    };
    document.body.appendChild(script);
  }, []);

  const getTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getDate = () => {
    const now = new Date();
    return now.toLocaleDateString();
  };

  const parsePDF = async (file: File) => {
    const fileReader = new FileReader();
    fileReader.onload = async () => {
      const typedArray = new Uint8Array(fileReader.result as ArrayBuffer);
      try {
        const pdf = await window.pdfjsLib.getDocument({ data: typedArray }).promise;

        let textContent = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const text = await page.getTextContent();
          const pageText = text.items.map((item: any) => item.str).join(" ");
          textContent += pageText + "\n";
        }

        setParsedText(textContent);
        setMeetingTitle(file.name.replace('.pdf', ''));
        
        // Create a user message with the file name
        const userMessage: Message = {
          id: Date.now(),
          sender: "user",
          content: `I've uploaded a meeting transcript: ${file.name}`,
          timestamp: getTime(),
        };
        
        setMessages((prev) => [...prev, userMessage]);
        
        // Add AI response to acknowledge the file
        const aiMessage: Message = {
          id: Date.now() + 1,
          sender: "ai",
          content: `I've received your meeting transcript "${file.name}". Would you like me to summarize it for you, extract action items, or analyze specific aspects of the meeting?`,
          timestamp: getTime(),
        };
        
        setMessages((prev) => [...prev, aiMessage]);
      } catch (error) {
        console.error("Error parsing PDF:", error);
        toast.error("Error", {
          description: "Failed to parse the PDF file. Please try again with a different file."
        });
      }
    };
    fileReader.readAsArrayBuffer(file);
  };

  const generateMeetingSummary = async () => {
    if (!parsedText) {
      toast("No transcript available", {
        description: "Please upload a meeting transcript first or paste text",
      });
      return;
    }
    setIsTyping(true);
    
    // Add user message requesting summary
    const userMessage: Message = {
      id: Date.now(),
      sender: "user", 
      content: "Please analyze this meeting transcript and generate a complete summary with action items, participants, decisions, and key points.",
      timestamp: getTime(),
    };
    
    setMessages((prev) => [...prev, userMessage]);

    try {
      // First, get a structured summary from the API
      const summaryResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ 
                  text: `You are a meeting summarizer assistant. Analyze this meeting transcript and return a JSON response with the following structure:
                  {
                    "title": "Meeting title (infer from content)",
                    "date": "Meeting date (extract from transcript or use 'Unknown')",
                    "duration": "Meeting duration (extract or estimate)",
                    "participants": ["List of participants mentioned"],
                    "summary": "Concise meeting summary (up to 400 words)",
                    "keyPoints": ["List of key points discussed"],
                    "decisions": ["List of decisions made"],
                    "actionItems": [
                      {
                        "task": "Description of task",
                        "assignee": "Person assigned (or 'Unassigned')",
                        "dueDate": "Due date if mentioned (or null)"
                      }
                    ]
                  }
                  
                  IMPORTANT: Return ONLY valid JSON, no markdown formatting, no prefixes like \`\`\`json. The response should start with { and end with }.
                  
                  Here is the transcript:
                  ${parsedText}`
                }],
              }
            ],
            generationConfig: {
              temperature: 0.2,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 8192,
            },
          }),
        }
      );

      const summaryData = await summaryResponse.json();
      const summaryText = summaryData?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      
      let summaryJson;
      try {
        // Clean the response to ensure it's valid JSON
        const cleanedJson = summaryText.replace(/```json|```/g, '').trim();
        summaryJson = JSON.parse(cleanedJson);
      } catch (e) {
        console.error("Failed to parse JSON:", e, summaryText);
        summaryJson = {
          title: meetingTitle || "Meeting Summary",
          date: getDate(),
          duration: "Unknown",
          participants: [],
          summary: "Failed to extract summary from transcript.",
          keyPoints: [],
          decisions: [],
          actionItems: []
        };
      }
      
      // Create a formatted summary for the chat
      const formattedSummary = `
## 📝 Meeting Summary: ${summaryJson.title}

**Date:** ${summaryJson.date}
**Duration:** ${summaryJson.duration}
**Participants:** ${summaryJson.participants.join(", ")}

### Summary
${summaryJson.summary}

### Key Points
${summaryJson.keyPoints.map((point: string) => `- ${point}`).join("\n")}

### Decisions Made
${summaryJson.decisions.map((decision: string) => `- ${decision}`).join("\n")}

### Action Items
${summaryJson.actionItems.map((item: any, index: number) => 
  `${index + 1}. **${item.task}**${item.assignee ? ` (Assigned to: ${item.assignee})` : ''}${item.dueDate ? ` - Due: ${item.dueDate}` : ''}`
).join("\n")}
`;

      // Create the AI message with the summary
      const aiMessage: Message = {
        id: Date.now() + 1,
        sender: "ai",
        content: formattedSummary,
        timestamp: getTime(),
      };
      
      setMessages((prev) => [...prev, aiMessage]);
      
      // Create and save the meeting summary
      const newSummary: MeetingSummary = {
        id: Date.now(),
        title: summaryJson.title || meetingTitle || "Meeting Summary",
        date: summaryJson.date || getDate(),
        duration: summaryJson.duration || "Unknown",
        summary: summaryJson.summary,
        participants: summaryJson.participants,
        decisions: summaryJson.decisions,
        actionItems: summaryJson.actionItems.map((item: any, index: number) => ({
          id: index + 1,
          task: item.task,
          assignee: item.assignee || "Unassigned",
          dueDate: item.dueDate || null,
          completed: false
        })),
        rawTranscript: parsedText
      };
      
      setMeetingSummaries((prev) => [...prev, newSummary]);
      setCurrentSummary(newSummary);
      setActiveTab("summary");
      
    } catch (error) {
      console.error("Error generating summary:", error);
      
      const errorMessage: Message = {
        id: Date.now() + 1,
        sender: "ai",
        content: "I'm sorry, but I encountered an error while generating the meeting summary. Please try again.",
        timestamp: getTime(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      sender: "user",
      content: input.trim(),
      timestamp: getTime(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    const allParts = [
      ...messages.map((msg) => ({
        role: msg.sender === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      })),
      {
        role: "user",
        parts: [{ text: `${input.trim()} ${parsedText ? `\n\n[FILE_CONTENT]: ${parsedText}` : ""}` }],
      },
    ];

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: allParts,
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 8192,
              responseMimeType: "text/plain",
            },
          }),
        }
      );

      const data = await res.json();
      const aiReply =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Sorry, I couldn't understand that.";

      const aiMessage: Message = {
        id: Date.now() + 1,
        sender: "ai",
        content: aiReply,
        timestamp: getTime(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "ai",
          content: "Error fetching response. Please try again.",
          timestamp: getTime(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") sendMessage();
  };

  const toggleTheme = () => setIsDark((prev) => !prev);

  const startSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) return alert("Speech Recognition not supported");

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => prev + transcript);
    };
    recognition.start();
  };

  const generateEmailSummary = () => {
    if (!currentSummary) return;
    
    const emailSubject = `Meeting Summary: ${currentSummary.title} - ${currentSummary.date}`;
    
    const emailBody = `
Dear Team,

Here's a summary of our recent meeting:

MEETING: ${currentSummary.title}
DATE: ${currentSummary.date}
DURATION: ${currentSummary.duration}
PARTICIPANTS: ${currentSummary.participants.join(", ")}

SUMMARY:
${currentSummary.summary}

KEY DECISIONS:
${currentSummary.decisions.map((decision: string, index: number) => `${index + 1}. ${decision}`).join("\n")}

ACTION ITEMS:
${currentSummary.actionItems.map((item: ActionItem, index: number) => 
  `${index + 1}. ${item.task} - Assigned to: ${item.assignee}${item.dueDate ? ` (Due: ${item.dueDate})` : ''}`
).join("\n")}

Please let me know if you have any questions or need clarification on any points.

Best regards,
[Your Name]
`;

    // Create mailto link
    const mailtoLink = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(mailtoLink);
  };

  const toggleActionItemCompletion = (summaryId: number, actionItemId: number) => {
    setMeetingSummaries(prev => 
      prev.map(summary => {
        if (summary.id === summaryId) {
          return {
            ...summary,
            actionItems: summary.actionItems.map(item => {
              if (item.id === actionItemId) {
                return { ...item, completed: !item.completed };
              }
              return item;
            })
          };
        }
        return summary;
      })
    );
    
    // Update current summary if it's the one being modified
    if (currentSummary && currentSummary.id === summaryId) {
      setCurrentSummary(prev => {
        if (!prev) return null;
        return {
          ...prev,
          actionItems: prev.actionItems.map(item => {
            if (item.id === actionItemId) {
              return { ...item, completed: !item.completed };
            }
            return item;
          })
        };
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard", {
      description: "The content has been copied to your clipboard."
    });
  };

  const exportSummaryAsJSON = () => {
    if (!currentSummary) return;
    
    const dataStr = JSON.stringify(currentSummary, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportFileDefaultName = `${currentSummary.title.replace(/\s+/g, '_')}_${currentSummary.date.replace(/\//g, '-')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const pasteTranscript = (text: string) => {
    setParsedText(text);
    setMeetingTitle("Pasted Meeting Transcript");
    
    // Create a user message
    const userMessage: Message = {
      id: Date.now(),
      sender: "user",
      content: "I've pasted a meeting transcript.",
      timestamp: getTime(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    
    // Add AI response
    const aiMessage: Message = {
      id: Date.now() + 1,
      sender: "ai",
      content: "I've received your meeting transcript. Would you like me to summarize it for you, extract action items, or analyze specific aspects of the meeting?",
      timestamp: getTime(),
    };
    
    setMessages((prev) => [...prev, aiMessage]);
  };

  const deleteMeetingSummary = (id: number) => {
    setMeetingSummaries(prev => prev.filter(summary => summary.id !== id));
    if (currentSummary && currentSummary.id === id) {
      setCurrentSummary(null);
    }
    
    toast("Summary deleted", {
      description: "The meeting summary has been deleted."
    });
  };

  return (
    <div
      className={`min-h-screen ${
        isDark ? "bg-gray-950 text-white" : "bg-white text-black"
      } flex flex-col items-center justify-center px-4 py-8`}
    >
      <div className="w-full max-w-4xl flex justify-between items-center mb-4">
        <h1 className="text-4xl font-bold">📝 Meeting Summarizer</h1>
        <Button variant="ghost" onClick={toggleTheme}>
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
      </div>

      <Tabs 
        defaultValue="chat" 
        className="w-full max-w-4xl"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="chat">💬 Chat</TabsTrigger>
          <TabsTrigger value="summary">📋 Summary</TabsTrigger>
          <TabsTrigger value="archive">🗃️ Archive</TabsTrigger>
        </TabsList>
        
        <TabsContent value="chat">
        <Card className="w-full h-[80vh] overflow-y-auto border border-gray-700 shadow-2xl bg-gray-900/40 backdrop-blur-md p-4">
            <Button
              variant="ghost"
              className="absolute top-2 right-2 text-red-400 text-xs"
              onClick={() => {
                setMessages([{
                  id: Date.now(),
                  sender: "ai",
                  content: "Hello! I'm your Meeting Summarizer Assistant. You can upload a meeting transcript (PDF) or paste text, and I'll help you extract key information, action items, and create a summary.",
                  timestamp: getTime(),
                }]);
                setParsedText("");
                setUploadedFileName(null);
              }}
            >
              Clear Chat
            </Button>

            <CardContent className="flex flex-col flex-grow overflow-hidden p-0">
            <ScrollArea className="flex-grow p-4 space-y-4 h-[calc(80vh-120px)]">
                <AnimatePresence initial={false}>
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.sender === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`flex flex-col ${
                          msg.sender === "user" ? "items-end" : "items-start"
                        }`}
                      >
                        <motion.div
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className={`p-3 px-4 max-w-md rounded-2xl shadow-md break-words text-sm ${
                            msg.sender === "user"
                              ? "bg-blue-600 text-white rounded-br-none"
                              : "bg-gray-800 text-gray-100 rounded-bl-none"
                          }`}
                        >
                          <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br/>').replace(/## (.*)/g, '<h2>$1</h2>').replace(/### (.*)/g, '<h3>$1</h3>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                        </motion.div>
                        <span className="text-xs text-gray-400 mt-1 px-2">
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="flex flex-col items-start">
                        <motion.div
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="p-3 px-4 max-w-xs rounded-2xl shadow-md text-sm bg-gray-800 text-gray-100 rounded-bl-none"
                        >
                          <span className="animate-pulse">AI is thinking...</span>
                        </motion.div>
                      </div>
                    </div>
                  )}
                </AnimatePresence>
                <div ref={messageEndRef} />
              </ScrollArea>

              <div className="flex flex-col gap-2 border-t border-gray-800 p-3 bg-gray-900">
                {parsedText && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-green-400">
                      {uploadedFileName ? `File loaded: ${uploadedFileName}` : "Text transcript loaded"}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={generateMeetingSummary}
                      disabled={isTyping}
                    >
                      Generate Summary
                    </Button>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={startSpeechRecognition}>
                    <Mic className="w-5 h-5 text-white" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => document.getElementById("fileInput")?.click()}
                  >
                    <Upload className="w-5 h-5 text-white" />
                  </Button>
                  <input
                    id="fileInput"
                    type="file"
                    className="hidden"
                    accept="application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setUploadedFileName(file.name);
                        parsePDF(file);
                      }
                    }}
                  />
                  <Input
                    placeholder="Type a message..."
                    className="flex-grow bg-gray-800 text-white border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <Button onClick={sendMessage} disabled={isTyping}>
                    Send
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="summary">
        <Card className="w-full border border-gray-700 shadow-2xl bg-gray-900/40 backdrop-blur-md">
            <CardContent className="p-6 h-full flex flex-col">
              {currentSummary ? (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">{currentSummary.title}</h2>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => generateEmailSummary()}
                      >
                        <Mail className="w-4 h-4 mr-2" /> Email Summary
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => exportSummaryAsJSON()}
                      >
                        <Download className="w-4 h-4 mr-2" /> Export
                      </Button>
                      <Button
                      variant="secondary"
                      onClick={() => {
                        setCurrentSummary(null);
                        setUploadedFileName(null);
                        setParsedText("");
                        setActiveTab("chat");
                      }}
                    >
                      + Add New Summary
                    </Button>

                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-w-0">
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <Calendar className="w-5 h-5 mr-2 text-blue-400" />
                        <h3 className="font-semibold">Date & Time</h3>
                      </div>
                      <p>{currentSummary.date}</p>
                      <p>Duration: {currentSummary.duration}</p>
                    </div>
                    
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <h3 className="font-semibold mb-2">Participants</h3>
                      <div className="space-y-1">
                        {currentSummary.participants.map((person, i) => (
                          <div key={i} className="text-sm">{person}</div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-gray-800 p-4 rounded-lg flex flex-col">
                      <h3 className="font-semibold mb-2">Quick Actions</h3>
                      <Button 
                        variant="ghost" 
                        className="justify-start h-8" 
                        onClick={() => {
                          copyToClipboard(currentSummary.summary);
                        }}
                      >
                        <Copy className="w-4 h-4 mr-2" /> Copy Summary
                      </Button>
                      <Button 
                        variant="ghost"
                        className="justify-start h-8 text-red-400" 
                        onClick={() => deleteMeetingSummary(currentSummary.id)}
                      >
                        Delete Summary
                      </Button>
                    </div>
                  </div>
                  <div className="w-full overflow-hidden">
                  <ScrollArea className="flex-grow p-4 space-y-4 h-[calc(80vh-120px)] overflow-y-auto overflow-x-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 min-w-0">
                      <div className="col-span-2 space-y-6">
                        <div className="bg-gray-800 p-4 rounded-lg">
                          <h3 className="font-semibold mb-3">Summary</h3>
                          <p className="text-sm whitespace-pre-line">{currentSummary.summary}</p>
                        </div>
                        
                        <div className="bg-gray-800 p-4 rounded-lg">
                          <h3 className="font-semibold mb-3">Key Decisions</h3>
                          <ul className="space-y-2">
                            {currentSummary.decisions.map((decision, i) => (
                              <li key={i} className="text-sm">
                                • {decision}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="bg-gray-800 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-semibold">Action Items</h3>
                          <span className="text-xs text-gray-400"></span>
                          <span className="text-xs text-gray-400">
   {currentSummary.actionItems.filter(item => item.completed).length} of {currentSummary.actionItems.length} complete </span>
                        </div>
                        <ul className="space-y-3">
                          {currentSummary.actionItems.map((item) => (
                            <li key={item.id} className="flex items-start gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className={`mt-0.5 w-5 h-5 p-0.5 ${item.completed ? 'bg-green-700/50' : 'bg-gray-700/50'}`}
                                onClick={() => toggleActionItemCompletion(currentSummary.id, item.id)}
                              >
                                <CheckSquare className={`w-4 h-4 ${item.completed ? 'text-green-400' : 'text-gray-400'}`} />
                              </Button>
                              <div className={`text-sm flex-1 ${item.completed ? 'line-through text-gray-500' : ''}`}>
                                <div>{item.task}</div>
                                <div className="flex justify-between text-xs text-gray-400 mt-1">
                                  <span>{item.assignee}</span>
                                  {item.dueDate && <span>Due: {item.dueDate}</span>}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </ScrollArea>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">No Meeting Summary</h2>
                    <p className="text-gray-400 mb-6">Upload a meeting transcript or paste text to generate a summary</p>
                  </div>
                  
                  <div className="flex flex-col gap-4 w-full max-w-md">
                  <Button onClick={handleUploadClick}>
                    <Upload className="w-5 h-5 mr-2" /> Upload PDF Transcript
                  </Button>

                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="application/pdf"
                        className="hidden"
                        onChange={handleFileUpload}
                      />


                    
                    <p className="text-center text-gray-400">or</p>
                    
                    <div className="space-y-2">
                      <Textarea 
                        placeholder="Paste meeting transcript text here..." 
                        className="min-h-40 bg-gray-800 border-gray-700"
                        onChange={(e) => {
                          if (e.target.value.length > 0) {
                            pasteTranscript(e.target.value);
                            setActiveTab("chat");
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="archive">
          <Card className="w-full h-[80vh] border border-gray-700 shadow-2xl bg-gray-900/40 backdrop-blur-md">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-6">Meeting Archives</h2>
              
              {meetingSummaries.length > 0 ? (
                <ScrollArea className="h-[calc(80vh-120px)]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {meetingSummaries.map((summary) => (
                      <div key={summary.id} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-lg">{summary.title}</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-red-400"
                            onClick={() => deleteMeetingSummary(summary.id)}
                          >
                            Delete
                          </Button>
                        </div>
                        <div className="text-xs text-gray-400 mb-3">
                          {summary.date} • {summary.duration} • {summary.participants.length} participants
                        </div>
                        <p className="text-sm line-clamp-2 mb-3">{summary.summary.substring(0, 100)}...</p>
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-gray-400">
                            {summary.actionItems.length} action items • {summary.actionItems.filter(item => item.completed).length} completed
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setCurrentSummary(summary);
                              setActiveTab("summary");
                            }}
                          >
                            View
                          </Button>
 

                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center h-[calc(80vh-120px)]">
                  <div className="text-gray-400 text-center">
                    <p className="mb-2">No meeting summaries in archive</p>
                    <p className="text-sm">Summaries will appear here after you generate them</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}