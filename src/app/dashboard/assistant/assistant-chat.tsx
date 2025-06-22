"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import { Send, MessageSquare, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { askAssistant } from "@/ai/flows/assistant-flow";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "model";
  content: string;
}

export function AssistantChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaViewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: "model",
          content: "¡Hola! Soy Maestro Mariachi AI. Estoy a tu disposición para ayudarte a gestionar todo lo relacionado con el mariachi. ¿En qué puedo asistirte hoy?",
        },
      ]);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    if (scrollAreaViewportRef.current) {
        scrollAreaViewportRef.current.scrollTo({
        top: scrollAreaViewportRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const historyForApi = messages.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }));

    try {
      const response = await askAssistant({
        message: input,
        history: historyForApi,
      });
      const assistantMessage: Message = { role: "model", content: response };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        role: "model",
        content: "Lo siento, tuve un problema para procesar tu solicitud.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
            "fixed right-6 h-14 w-14 rounded-full shadow-lg z-40 flex items-center justify-center",
            "bottom-24 md:bottom-6"
        )}
      >
        <Bot className="h-7 w-7" />
        <span className="sr-only">Abrir Asistente</span>
      </Button>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
          <SheetHeader className="p-6 pb-2">
            <SheetTitle className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary"/> Maestro Mariachi AI
            </SheetTitle>
            <SheetDescription>
              Tu asistente personal para la gestión del mariachi.
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="flex-1 px-6">
            <div ref={scrollAreaViewportRef} className="space-y-6 pr-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-start gap-3",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "model" && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground"><Bot className="h-5 w-5"/></AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "rounded-lg p-3 max-w-[85%] whitespace-pre-wrap",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    {message.content}
                  </div>
                  {message.role === "user" && (
                     <Avatar className="h-8 w-8">
                        <AvatarFallback><User className="h-5 w-5"/></AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-3 justify-start">
                    <Avatar className="h-8 w-8">
                       <AvatarFallback className="bg-primary text-primary-foreground"><Bot className="h-5 w-5"/></AvatarFallback>
                    </Avatar>
                    <div className="rounded-lg p-3 bg-muted flex items-center gap-2">
                       <Loader2 className="h-4 w-4 animate-spin"/>
                       <span>Pensando...</span>
                    </div>
                </div>
              )}
            </div>
          </ScrollArea>
           <SheetFooter className="p-4 bg-background border-t">
              <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Pregúntale algo al asistente..."
                  disabled={isLoading}
                  autoComplete="off"
                />
                <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                  <Send className="h-4 w-4" />
                  <span className="sr-only">Enviar</span>
                </Button>
              </form>
           </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
