import { useState, useEffect, useRef, Component, ReactNode, FunctionComponent } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// Fix for TypeScript environment errors
declare var process: {
  env: {
    API_KEY?: string;
    GEMINI_API_KEY?: string;
    [key: string]: string | undefined;
  }
};

// --- Helper: Robust API Initialization ---
const getGenAI = () => {
  // 1. Manually retrieve the key from the environment variables.
  // We check both common names to be helpful.
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;

  // 2. CHECK: If it's missing, throw a clear error before the API call.
  if (!apiKey) {
    throw new Error("Configuration Error: The API_KEY or GEMINI_API_KEY environment variable is missing. Please add it in your Vercel/Netlify settings.");
  }

  // 3. Initialize the client by explicitly passing the key.
  return new GoogleGenAI({ apiKey });
};

// --- Configuration & Constants ---
const LANGUAGES = [
  "C", "C++", "C#", "Python", "JavaScript", "TypeScript", "Java", 
  "Go", "Rust", "Swift", "Kotlin", 
  "PHP", "Ruby", "SQL", "HTML/CSS", "Shell/Bash"
];

const SUGGESTIONS = [
  { lang: "Python", task: "Create a script to scrape data from a website using BeautifulSoup" },
  { lang: "C", task: "Write a program to reverse a string without using library functions" },
  { lang: "SQL", task: "Generate a query to find the top 5 customers by revenue" },
  { lang: "JavaScript", task: "Create a function to check if a string is a palindrome" }
];

const DOWNLOAD_RESOURCES = [
  { name: "VS Code", icon: "fa-solid fa-code", url: "https://code.visualstudio.com/", desc: "Editor" },
  { name: "Python", icon: "fa-brands fa-python", url: "https://www.python.org/downloads/", desc: "Language" },
  { name: "Node.js", icon: "fa-brands fa-node-js", url: "https://nodejs.org/en/download/", desc: "Runtime" },
  { name: "Java", icon: "fa-brands fa-java", url: "https://www.oracle.com/java/technologies/downloads/", desc: "JDK" },
  { name: "Go", icon: "fa-brands fa-golang", url: "https://go.dev/dl/", desc: "Language" },
  { name: "Rust", icon: "fa-brands fa-rust", url: "https://www.rust-lang.org/tools/install", desc: "Toolchain" },
  { name: "PHP", icon: "fa-brands fa-php", url: "https://www.php.net/downloads.php", desc: "Language" },
  { name: "Git", icon: "fa-brands fa-git-alt", url: "https://git-scm.com/downloads", desc: "VCS" },
  { name: "Docker", icon: "fa-brands fa-docker", url: "https://www.docker.com/products/docker-desktop/", desc: "Container" },
  { name: "Android Studio", icon: "fa-brands fa-android", url: "https://developer.android.com/studio", desc: "IDE" },
  { name: "Swift", icon: "fa-brands fa-swift", url: "https://www.swift.org/install/", desc: "Language" },
  { name: "R", icon: "fa-solid fa-r", url: "https://cran.r-project.org/", desc: "Statistics" },
];

// --- Error Boundary ---

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Explicitly declare props to satisfy strict TypeScript environments
  declare props: Readonly<ErrorBoundaryProps>;
  
  state: ErrorBoundaryState = { hasError: false, error: null };

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
          <div className="bg-red-900/20 border border-red-500/50 p-6 rounded-xl max-w-lg w-full">
            <h2 className="text-xl font-bold text-red-400 mb-2">Something went wrong</h2>
            <p className="text-slate-300 mb-4">The application encountered an error.</p>
            <pre className="bg-slate-950 p-4 rounded text-xs font-mono text-red-200 overflow-auto max-h-40">
              {this.state.error?.toString()}
            </pre>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white font-medium transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Shared Components ---

const Header = () => (
  <header className="mb-8 text-center animate-fadeIn px-4 pt-8">
    <div className="relative inline-block group cursor-default">
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 rounded-full blur opacity-30 group-hover:opacity-80 transition duration-500"></div>
      <div className="relative w-24 h-24 rounded-full bg-[#0f172a] border-4 border-slate-800 flex items-center justify-center shadow-2xl overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-blue-500"></div>
        <div className="relative z-10 transform transition-transform duration-300 group-hover:scale-110">
           <i className="fa-solid fa-code text-4xl bg-clip-text text-transparent bg-gradient-to-br from-blue-200 to-cyan-400 text-blue-300 drop-shadow-[0_2px_10px_rgba(56,189,248,0.3)]"></i>
        </div>
        <div className="absolute inset-0 border-2 border-blue-500/20 rounded-full group-hover:border-blue-500/50 transition-colors duration-500"></div>
      </div>
      <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-slate-900 rounded-full flex items-center justify-center border-2 border-slate-800">
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
      </div>
    </div>
    <h1 className="mt-6 text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-cyan-200 to-indigo-300 tracking-tight drop-shadow-sm mb-3 pb-2 px-2">
      CodeCraft AI Agent
    </h1>
    <p className="text-slate-400 max-w-2xl mx-auto text-lg font-light leading-relaxed">
      Your smart coding assistant. Generate simple snippets, debug errors, and learn concepts.
    </p>
  </header>
);

interface CodeBlockProps {
  language: string;
  code: string;
}

const CodeBlock: FunctionComponent<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };

  return (
    <div className="relative my-6 rounded-xl overflow-hidden border border-slate-700/50 bg-[#0f172a] shadow-lg group">
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/80 border-b border-slate-700/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-600/50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-slate-600/50"></div>
            </div>
            <span className="text-xs font-mono text-slate-400 font-medium ml-2">{language || 'code'}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-all bg-slate-700/30 hover:bg-slate-700/80 px-2.5 py-1.5 rounded-md border border-transparent hover:border-slate-600"
          title="Copy code snippet"
        >
          {copied ? (
            <>
              <i className="fa-solid fa-check text-green-400"></i> Copied!
            </>
          ) : (
            <>
              <i className="fa-regular fa-copy"></i> Copy
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto p-4 bg-[#0f172a]">
        <pre className="!bg-transparent !p-0 !m-0 !border-0 text-sm md:text-base font-mono leading-relaxed text-blue-300">
            <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

const SimpleMarkdownRenderer = ({ content }: { content: string }) => {
  if (!content) return null;
  
  const parts = content.split(/```/g);

  return (
    <div className="space-y-4 text-slate-300 leading-relaxed">
      {parts.map((part, index) => {
        if (index % 2 === 1) {
          // Code block
          const firstLineIndex = part.indexOf('\n');
          let language = 'text';
          let code = part;
          
          if (firstLineIndex !== -1) {
            language = part.substring(0, firstLineIndex).trim();
            code = part.substring(firstLineIndex + 1);
          }
          return <CodeBlock key={index} language={language} code={code.trim()} />;
        } else {
          // Text block with basic bold support
          if (!part.trim()) return null;
          // Split by bold syntax **text**
          const textParts = part.split(/(\*\*.*?\*\*)/g);
          return (
             <div key={index} className="whitespace-pre-wrap">
               {textParts.map((subPart, i) => {
                 if (subPart.startsWith('**') && subPart.endsWith('**')) {
                   return <strong key={i} className="text-blue-200 font-bold">{subPart.slice(2, -2)}</strong>;
                 }
                 return <span key={i}>{subPart}</span>;
               })}
             </div>
          );
        }
      })}
    </div>
  );
};

// --- Main Feature Components ---

const CodeGenerator = () => {
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<string | null>(null);

  const generateCode = async () => {
    if (!description.trim()) return;
    
    setLoading(true);
    setOutput(""); // Reset output

    try {
      // Use the robust initialization helper
      const ai = getGenAI();

      const prompt = `Act as an expert coding tutor for beginners.
      Task: Write a ${language} program that ${description}.
      
      STRICT REQUIREMENTS:
      1. SIMPLICITY IS PRIORITY: Use the absolute simplest logic and standard libraries. Avoid advanced concepts (like list comprehensions, heavy modularization, or external packages) unless strictly necessary.
      2. ZERO ERRORS: The code MUST be 100% correct, compilable, and runnable. Double-check syntax.
      3. LINE-BY-LINE COMMENTS: Add clear, simple comments to almost every line explaining what it does.
      4. EXPLANATION: After the code, explain the logic in plain English as if teaching a 10-year-old.
      5. FORMAT: Provide the code inside a markdown code block.`;

      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      let fullText = "";
      for await (const chunk of responseStream) {
        const text = chunk.text;
        if (text) {
          fullText += text;
          setOutput(fullText);
        }
      }
      
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.message || "Unknown error";
      // Display the error clearly to the user
      setOutput(`**CONFIGURATION ERROR**\n\n${errorMsg}\n\nTo fix this on Vercel:\n1. Go to **Settings** > **Environment Variables**.\n2. Add \`API_KEY\` or \`GEMINI_API_KEY\` with your Google Gemini API Key.\n3. Redeploy your project.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* LEFT COLUMN: INPUT */}
      <div className="flex flex-col gap-6">
        <div className="glass-panel p-6 rounded-2xl shadow-xl border border-slate-700/50">
          <label className="block text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">
            Programming Language
          </label>
          <div className="relative">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full bg-slate-900 text-white p-4 rounded-xl border border-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none font-mono cursor-pointer hover:bg-slate-800 transition-colors"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <i className="fa-solid fa-chevron-down"></i>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl shadow-xl border border-slate-700/50 flex flex-col flex-grow">
          <label className="block text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">
            Task Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your task to see the magic happen (e.g., 'Sort a list of numbers')..."
            className="w-full flex-grow bg-slate-900 text-slate-200 p-4 rounded-xl border border-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none font-mono placeholder-slate-600 min-h-[200px]"
          />
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
             <button
              onClick={generateCode}
              disabled={loading || !description.trim()}
              className={`flex-1 py-4 px-6 rounded-xl font-bold text-lg tracking-wide shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2
                ${loading || !description.trim() 
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white hover:shadow-blue-500/25'}`}
            >
              {loading ? (
                <><i className="fa-solid fa-circle-notch fa-spin"></i> Generating...</>
              ) : (
                <><i className="fa-solid fa-wand-magic-sparkles"></i> Generate Code</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: OUTPUT */}
      <div className="glass-panel rounded-2xl shadow-xl border border-slate-700/50 flex flex-col overflow-hidden h-full min-h-[500px]">
        <div className="bg-slate-900/80 px-4 py-3 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-terminal text-slate-500 text-sm"></i>
            <span className="text-sm font-semibold text-slate-400">Output Console</span>
          </div>
          {loading && <span className="text-xs text-blue-400 animate-pulse">Processing...</span>}
        </div>
        <div className="flex-grow p-6 overflow-y-auto bg-slate-950/50 text-sm">
          {!output && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-4 opacity-70">
              <i className="fa-solid fa-code text-5xl mb-2"></i>
              <p className="text-center max-w-xs">Describe your task to see the magic happen.</p>
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {SUGGESTIONS.slice(0, 2).map((s, i) => (
                  <button 
                    key={i} 
                    onClick={() => { setDescription(s.task); setLanguage(s.lang); }}
                    className="text-xs border border-slate-700 px-3 py-1.5 rounded-full hover:bg-slate-800 transition-colors"
                  >
                    {s.lang}: {s.task.substring(0, 20)}...
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <SimpleMarkdownRenderer content={output || ''} />
          
          {loading && !output && (
             <div className="flex gap-2 items-center text-blue-400 mt-4">
               <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
               <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-100"></span>
               <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200"></span>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CHAT_SYSTEM_PROMPT = "You are CodeCraft AI, an ultra-patient coding tutor for absolute beginners.\n\nSTRICT RULES FOR EVERY RESPONSE:\n1. EXTREME SIMPLICITY: Explain everything as if the user is 10 years old. Use short sentences and no technical jargon.\n2. BEGINNER CODE ONLY: When providing code, use the most basic, fundamental logic possible. Avoid shortcuts, advanced syntax, or 'clever' one-liners.\n3. ALWAYS RUNNABLE: Provide complete, copy-pasteable code with all necessary imports and main functions.\n4. NO LECTURES: Keep text explanations short and direct.\n5. BE SUPPORTIVE: Encourage the user.";

const ChatAssistant = () => {
  const [messages, setMessages] = useState<{role: string, text: string}[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize chat only once
  const chatSessionRef = useRef<any>(null);

  // Helper to safely init chat
  const initChat = () => {
    try {
        const ai = getGenAI(); // Use robust helper
        chatSessionRef.current = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: CHAT_SYSTEM_PROMPT
            }
        });
        return true;
    } catch (e) {
        console.error("Failed to init chat", e);
        return false;
    }
  };

  useEffect(() => {
    initChat();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsTyping(true);

    try {
        // Ensure chat session exists
        if (!chatSessionRef.current) {
             const success = initChat();
             if (!success) {
                // If init failed (missing key), throw specific error to catch block
                throw new Error("Missing API_KEY or GEMINI_API_KEY environment variable.");
             }
        }

        const resultStream = await chatSessionRef.current.sendMessageStream({ message: userMsg });
        
        let fullResponse = "";
        setMessages(prev => [...prev, { role: 'model', text: "" }]);

        for await (const chunk of resultStream) {
            fullResponse += chunk.text || "";
            setMessages(prev => {
                const newArr = [...prev];
                newArr[newArr.length - 1].text = fullResponse;
                return newArr;
            });
        }
    } catch (e: any) {
        console.error(e);
        const errorMsg = e.message || "Unknown error";
        setMessages(prev => [...prev, { role: 'model', text: `**CONFIGURATION ERROR**: ${errorMsg}. Please check Vercel settings.` }]);
    } finally {
        setIsTyping(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl shadow-xl border border-slate-700/50 flex flex-col h-[600px]">
       <div className="bg-slate-900/80 px-6 py-4 border-b border-slate-700 flex items-center gap-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-semibold text-slate-200">Chat Assistant</span>
       </div>
       
       <div ref={scrollRef} className="flex-grow overflow-y-auto p-6 space-y-6 bg-slate-950/30">
          {messages.length === 0 && (
             <div className="text-center text-slate-500 mt-20">
                <i className="fa-solid fa-comments text-4xl mb-4 opacity-50"></i>
                <p>Ask me anything about coding! I'll explain it simply.</p>
             </div>
          )}
          {messages.map((msg, i) => (
             <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'}`}>
                    <SimpleMarkdownRenderer content={msg.text} />
                </div>
             </div>
          ))}
          {isTyping && (
             <div className="flex justify-start">
                <div className="bg-slate-800 rounded-2xl rounded-bl-none p-4 border border-slate-700 flex gap-2">
                   <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                   <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-100"></div>
                   <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-200"></div>
                </div>
             </div>
          )}
       </div>

       <div className="p-4 bg-slate-900 border-t border-slate-700 rounded-b-2xl">
          <div className="flex gap-2">
             <input 
               type="text" 
               value={input}
               onChange={(e) => setInput(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
               placeholder="Type your question..."
               className="flex-grow bg-slate-950 text-white px-4 py-3 rounded-xl border border-slate-800 focus:ring-1 focus:ring-blue-500 outline-none"
             />
             <button 
               onClick={sendMessage}
               disabled={!input.trim() || isTyping}
               className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white px-6 rounded-xl transition-colors"
             >
               <i className="fa-solid fa-paper-plane"></i>
             </button>
          </div>
       </div>
    </div>
  );
};

const ResourceGrid = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {DOWNLOAD_RESOURCES.map((res, i) => (
            <a 
              key={i} 
              href={res.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="glass-panel group p-6 rounded-xl border border-slate-700/50 hover:border-blue-500/50 hover:bg-slate-800/80 transition-all duration-300 flex flex-col items-center text-center gap-4 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/10"
            >
                <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center border border-slate-800 group-hover:border-blue-500/30 transition-colors">
                    <i className={`${res.icon} text-3xl text-slate-400 group-hover:text-blue-400 transition-colors`}></i>
                </div>
                <div>
                    <h3 className="font-bold text-white text-lg">{res.name}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-1">{res.desc}</p>
                </div>
                <div className="mt-2 text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    Download <i className="fa-solid fa-arrow-up-right-from-square ml-1"></i>
                </div>
            </a>
        ))}
    </div>
);

// --- Main Application ---

const App = () => {
  const [activeTab, setActiveTab] = useState<'generator' | 'chat' | 'resources'>('generator');

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#0f172a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black text-slate-200 selection:bg-blue-500/30">
        <div className="container mx-auto max-w-7xl px-4 py-8 pb-20">
          <Header />
          
          {/* Tabs */}
          <div className="flex justify-center mb-8 overflow-x-auto">
            <div className="bg-slate-900/50 p-1.5 rounded-xl border border-slate-800 flex gap-1 min-w-max">
                <button 
                  onClick={() => setActiveTab('generator')}
                  className={`px-4 md:px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2
                    ${activeTab === 'generator' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                  <i className="fa-solid fa-code"></i> <span className="hidden sm:inline">Generator</span>
                </button>
                <button 
                  onClick={() => setActiveTab('chat')}
                  className={`px-4 md:px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2
                    ${activeTab === 'chat' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                  <i className="fa-solid fa-comments"></i> <span className="hidden sm:inline">Chat</span>
                </button>
                <button 
                  onClick={() => setActiveTab('resources')}
                  className={`px-4 md:px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2
                    ${activeTab === 'resources' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                  <i className="fa-solid fa-download"></i> <span className="hidden sm:inline">Resources</span>
                </button>
            </div>
          </div>

          {/* Content Area */}
          <main className="animate-fadeIn">
             {activeTab === 'generator' && <CodeGenerator />}
             {activeTab === 'chat' && <ChatAssistant />}
             {activeTab === 'resources' && <ResourceGrid />}
          </main>
          
          <footer className="mt-20 pb-10 text-center text-slate-600 text-sm font-mono">
             <p className="mb-4">Powered by Gemini 2.5 Flash • CodeCraft AI Agent &copy; {new Date().getFullYear()}</p>
          </footer>
        </div>
      </div>
    </ErrorBoundary>
  );
};

// --- Initialization ---

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}