
'use client';

import { useState, useRef, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, Loader2, Send, X, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AssistantChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AssistantChat({ isOpen, onClose }: AssistantChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const messagesRef = useRef(messages);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSpeechSupported(true);
      recognitionRef.current = new SpeechRecognition();
      const recognition = recognitionRef.current;
      recognition.lang = 'es-ES';
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        const transcript = finalTranscript || interimTranscript;
        setInput(transcript);

        if (finalTranscript.toLowerCase().trim().endsWith('enviar')) {
            const command = finalTranscript.slice(0, finalTranscript.toLowerCase().lastIndexOf('enviar')).trim();
            handleSendMessage(command);
            recognition.stop();
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed') {
            toast({
                variant: "destructive",
                title: "Permiso de Micrófono Denegado",
                description: "Por favor, permite el acceso al micrófono para usar esta función.",
            });
        }
        setIsListening(false);
      };
    }
  }, [toast]);
  
  const handleSendMessage = async (prompt: string) => {
    if (!prompt || isLoading) return;

    const userMessage: Message = { role: 'user', content: prompt };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messagesRef.current.map(({ role, content }) => ({ role, content }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, history }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || `API error: ${res.statusText}`);
      }

      const assistantMessage: Message = { role: 'assistant', content: data.reply };
      setMessages((prev) => [...prev, assistantMessage]);

      let needsRefresh = false;

      if (data.eventCreated) {
        toast({
          title: "¡Evento Creado!",
          description: "El asistente ha agendado un nuevo evento en tu calendario.",
        });
        needsRefresh = true;
      }
      
       if (data.rehearsalCreated) {
        toast({
          title: "¡Ensayo Creado!",
          description: "El asistente ha agendado un nuevo ensayo en tu calendario.",
        });
        needsRefresh = true;
      }

      if (data.eventModified) {
        toast({
            title: "¡Evento Actualizado!",
            description: "Un evento ha sido modificado o eliminado de tu agenda.",
        });
        needsRefresh = true;
      }

      if (data.rehearsalModified) {
        toast({
            title: "¡Ensayo Actualizado!",
            description: "Un ensayo ha sido modificado o eliminado de tu agenda.",
        });
        needsRefresh = true;
      }

      if (needsRefresh) {
        router.refresh();
      }

    } catch (error: any) {
      console.error('Failed to fetch assistant reply:', error);
      let displayMessage = `Lo siento, ha ocurrido un error: ${error.message || 'Por favor, inténtalo de nuevo.'}`;
      const errorMessage: Message = { role: 'assistant', content: displayMessage };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };
  
  const handleMicClick = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  if (!isOpen) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-full max-w-sm shadow-2xl flex flex-col h-[70vh]">
      <CardHeader className="flex flex-row items-center justify-between border-b">
        <div className="flex items-center gap-3">
          <Bot className="h-6 w-6 text-primary" />
          <CardTitle className="text-lg">Many AI</CardTitle>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <div ref={scrollAreaRef} className="h-full overflow-y-auto p-4 pb-8 space-y-4">
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
                    'max-w-xs rounded-lg px-4 py-2 text-sm break-words',
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
      </CardContent>
      <CardFooter className="border-t pt-4">
        <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pregúntale o díctale algo..."
            disabled={isLoading}
            autoComplete="off"
          />
          {isSpeechSupported && (
            <Button type="button" size="icon" variant={isListening ? "destructive" : "outline"} onClick={handleMicClick} disabled={isLoading}>
                <Mic className="h-4 w-4" />
                <span className="sr-only">{isListening ? 'Detener grabación' : 'Iniciar grabación'}</span>
            </Button>
          )}
          <Button type="submit" size="icon" disabled={isLoading || !input}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
