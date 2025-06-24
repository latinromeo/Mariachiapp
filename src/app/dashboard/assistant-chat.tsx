'use client';

import {useState, useRef, useEffect, type FormEvent} from 'react';
import {Bot, Loader2, Send, X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {ScrollArea} from '@/components/ui/scroll-area';
import {cn} from '@/lib/utils';
import {Avatar, AvatarFallback} from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AssistantChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AssistantChat({isOpen, onClose}: AssistantChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input || isLoading) return;

    const userMessage: Message = {role: 'user', content: input};
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Pass the previous messages as history for context
      const history = messages.map(({role, content}) => ({role, content}));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({prompt: input, history}),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.statusText}`);
      }

      const data = await res.json();
      const assistantMessage: Message = {role: 'assistant', content: data.reply};
      setMessages((prev) => [...prev, assistantMessage]);

      if (data.eventCreated) {
        toast({
          title: "¡Evento Creado!",
          description: "El asistente ha agendado un nuevo evento en tu calendario.",
        });
      }

    } catch (error) {
      console.error('Failed to fetch assistant reply:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Lo siento, ha ocurrido un error al contactar a la IA. Por favor, inténtalo de nuevo.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-full max-w-sm shadow-2xl flex flex-col h-[70vh]">
      <CardHeader className="flex flex-row items-center justify-between border-b">
        <div className="flex items-center gap-3">
          <Bot className="h-6 w-6 text-primary" />
          <CardTitle className="text-lg">Maestro Mariachi AI</CardTitle>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-start gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'max-w-xs rounded-lg px-4 py-2 text-sm',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3 justify-start">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg px-4 py-3 flex items-center">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pregúntale algo al maestro..."
            disabled={isLoading}
            autoComplete="off"
          />
          <Button type="submit" size="icon" disabled={isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
