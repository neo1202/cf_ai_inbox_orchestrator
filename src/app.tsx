/** biome-ignore-all lint/correctness/useUniqueElementIds: it's alright */
import { useEffect, useState, useRef, useCallback } from "react";
import { useAgent } from "agents/react";
import { useAgentChat } from "agents/ai-react";
import type { UIMessage } from "@ai-sdk/react";

// Component and Icon imports remain the same...
import { Button } from "@/components/button/Button";
import { Card } from "@/components/card/Card";
import { Avatar } from "@/components/avatar/Avatar";
import { Toggle } from "@/components/toggle/Toggle";
import { Textarea } from "@/components/textarea/Textarea";
import { MemoizedMarkdown } from "@/components/memoized-markdown";
import { Bug, Moon, Robot, Sun, Trash, PaperPlaneTilt, Stop } from "@phosphor-icons/react";

export default function Chat() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const savedTheme = localStorage.getItem("theme");
    return (savedTheme as "dark" | "light") || "dark";
  });
  const [showDebug, setShowDebug] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const agent = useAgent({ agent: "chat" });
  const [agentInput, setAgentInput] = useState("");

  const {
    messages: agentMessages,
    clearHistory,
    status,
    sendMessage,
    stop
  } = useAgentChat<unknown, UIMessage<{ createdAt: string, source?: string }>>({
    agent
  });

  useEffect(() => {
    scrollToBottom();
  }, [agentMessages, scrollToBottom]);

  const handleAgentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentInput.trim()) return;
    const message = agentInput;
    setAgentInput("");
    await sendMessage({
      role: "user",
      parts: [{ type: "text", text: message }]
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="h-[100vh] w-full p-4 flex justify-center items-center bg-fixed overflow-hidden">
      <div className="h-[calc(100vh-2rem)] w-full mx-auto max-w-lg flex flex-col shadow-xl rounded-md overflow-hidden relative border border-neutral-300 dark:border-neutral-800">
        <div className="px-4 py-3 border-b border-neutral-300 dark:border-neutral-800 flex items-center gap-3 sticky top-0 z-10">
          <div className="flex items-center justify-center h-8 w-8">
            <svg width="28px" height="28px" className="text-[#F48120]" data-icon="agents">
              <title>Cloudflare Agents</title>
              <use href="#ai:local:agents" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-base">AI 郵件協調器</h2>
          </div>
          <div className="flex items-center gap-2 mr-2">
            <Bug size={16} />
            <Toggle toggled={showDebug} onClick={() => setShowDebug((prev) => !prev)} />
          </div>
          <Button variant="ghost" size="md" shape="square" className="rounded-full h-9 w-9" onClick={toggleTheme}>
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </Button>
          <Button variant="ghost" size="md" shape="square" className="rounded-full h-9 w-9" onClick={clearHistory}>
            <Trash size={20} />
          </Button>
        </div>

        {/* 訊息顯示區 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 max-h-[calc(100vh-10rem)]">
          {agentMessages.length === 0 && (
            <div className="h-full flex items-center justify-center">
              <Card className="p-6 max-w-md mx-auto bg-neutral-100 dark:bg-neutral-900">
                <div className="text-center space-y-4">
                  <div className="bg-[#F48120]/10 text-[#F48120] rounded-full p-3 inline-flex">
                    <Robot size={24} />
                  </div>
                  <h3 className="font-semibold text-lg">歡迎使用 AI 郵件協調器</h3>
                  <p className="text-muted-foreground text-sm">
                    設定 Email Routing 後，新郵件的摘要將會自動顯示在這裡。
                    您也可以在下方輸入框對我下達指令，例如：
                  </p>
                  <ul className="text-sm text-left space-y-2">
                    <li><span className="text-[#F48120]">•</span> "請彙整今天所有郵件的待辦事項"</li>
                    <li><span className="text-[#F48120]">•</span> "提醒我明天下午三點回覆 Lisa"</li>
                  </ul>
                </div>
              </Card>
            </div>
          )}

          {agentMessages.map((m, index) => {
             const isUser = m.role === "user";
             const isFromEmail = m.metadata?.source === 'email';
             const showAvatar = index === 0 || agentMessages[index - 1]?.role !== m.role;

             return (
               <div key={m.id}>
                 {showDebug && <pre className="text-xs">{JSON.stringify(m, null, 2)}</pre>}
                 <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                   <div className={`flex gap-2 max-w-[85%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                      {showAvatar && !isUser ? <Avatar username={"AI"} /> : !isUser && <div className="w-8" />}
                      <div>
                        {m.parts?.map((part, i) => {
                          if (part.type === 'text') {
                            return (
                              <div key={i}>
                                <Card className={`p-3 rounded-md ${isUser ? "bg-neutral-100 dark:bg-neutral-900 rounded-br-none" : isFromEmail ? "bg-blue-500/10 border border-blue-500/20 rounded-bl-none" : "bg-neutral-100 dark:bg-neutral-900 rounded-bl-none"}`}>
                                  <MemoizedMarkdown id={`${m.id}-${i}`} content={part.text} />
                                </Card>
                                <p className={`text-xs text-muted-foreground mt-1 ${isUser ? "text-right" : "text-left"}`}>
                                  {formatTime(m.metadata?.createdAt ? new Date(m.metadata.createdAt) : new Date())}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                   </div>
                 </div>
               </div>
             );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* 輸入區 */}
        <form onSubmit={handleAgentSubmit} className="p-3 bg-neutral-50 absolute bottom-0 left-0 right-0 z-10 border-t border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Textarea
                placeholder="傳送訊息或下達指令..."
                className="flex w-full border border-input px-3 py-2 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm min-h-[24px] max-h-[calc(75dvh)] overflow-hidden resize-none rounded-2xl !text-base pb-10"
                value={agentInput}
                onChange={(e) => setAgentInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAgentSubmit(e as unknown as React.FormEvent); } }}
                rows={1}
              />
              <div className="absolute bottom-0 right-0 p-2 w-fit flex flex-row justify-end">
                {status === "streaming" ? (
                  <Button type="button" onClick={stop} className="rounded-full p-1.5 h-fit" aria-label="停止生成">
                    <Stop size={16} />
                  </Button>
                ) : (
                  <Button type="submit" className="rounded-full p-1.5 h-fit" disabled={!agentInput.trim()} aria-label="傳送訊息">
                    <PaperPlaneTilt size={16} />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
