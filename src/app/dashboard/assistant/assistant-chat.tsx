"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Loader2 } from "lucide-react";
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
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setTimeout(() => {
        setMessages([
          {
            role: "model",
            content: "¡Hola! Soy Maestro Mariachi AI. Estoy a tu disposición para ayudarte a gestionar todo lo relacionado con el mariachi. ¿En qué puedo asistirte hoy?",
          },
        ]);
      }, 300);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
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
        content: "Lo siento, tuve un problema para procesar tu solicitud. Revisa la consola para más detalles.",
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
            "fixed right-6 h-16 w-16 rounded-full shadow-lg z-40 flex items-center justify-center transition-transform hover:scale-110 active:scale-100",
            "bottom-24 md:bottom-6 bg-gradient-to-br from-primary to-amber-500 text-white"
        )}
      >
        <Bot className="h-8 w-8" />
        <span className="sr-only">Abrir Asistente</span>
      </Button>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
          <SheetHeader className="p-6 pb-4 border-b bg-muted/30">
            <SheetTitle className="flex items-center gap-2 text-xl">
              <Bot className="h-6 w-6 text-primary"/> Maestro Mariachi AI
            </SheetTitle>
            <SheetDescription>
              Tu asistente personal para la gestión del mariachi.
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="flex-1">
            <div ref={scrollAreaRef} className="space-y-6 p-6">
              <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "flex items-start gap-3",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "model" && (
                    <Avatar className="h-9 w-9 border">
                      <AvatarFallback className="bg-primary text-primary-foreground"><Bot className="h-5 w-5"/></AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "rounded-xl p-3 max-w-[90%] shadow-sm",
                      "whitespace-pre-wrap leading-relaxed",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    {message.content}
                  </div>
                  {message.role === "user" && (
                     <Avatar className="h-9 w-9 border">
                        <AvatarFallback><User className="h-5 w-5"/></AvatarFallback>
                    </Avatar>
                  )}
                </motion.div>
              ))}
              </AnimatePresence>
              {isLoading && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-start gap-3 justify-start"
                >
                    <Avatar className="h-9 w-9 border">
                       <AvatarFallback className="bg-primary text-primary-foreground"><Bot className="h-5 w-5"/></AvatarFallback>
                    </Avatar>
                    <div className="rounded-xl p-3 bg-muted flex items-center gap-2 shadow-sm">
                       <Loader2 className="h-4 w-4 animate-spin text-primary"/>
                       <span className="text-sm">Pensando...</span>
                    </div>
                </motion.div>
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
                  className="h-11"
                />
                <Button type="submit" size="icon" className="h-11 w-11" disabled={isLoading || !input.trim()}>
                  <Send className="h-5 w-5" />
                  <span className="sr-only">Enviar</span>
                </Button>
              </form>
           </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
