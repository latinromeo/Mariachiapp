"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { eventCreationAssistant, type EventCreationAssistantOutput } from "@/ai/flows/event-creation-assistant"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Wand2, Sparkles, Lightbulb, BellRing, ClipboardCheck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const formSchema = z.object({
  eventName: z.string().min(2, { message: "Event name must be at least 2 characters." }),
  date: z.string().min(1, { message: "Date is required." }),
  location: z.string().min(2, { message: "Location is required." }),
  clientName: z.string().optional(),
  clientContact: z.string().optional(),
  notes: z.string().optional(),
  aiPrompt: z.string().optional(),
})

export function EventForm() {
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<EventCreationAssistantOutput | null>(null)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      eventName: "",
      date: "",
      location: "",
      clientName: "",
      clientContact: "",
      notes: "",
      aiPrompt: "",
    },
  })

  async function getAISuggestions() {
    const prompt = form.getValues("aiPrompt")
    if (!prompt) {
      toast({
        title: "Prompt is empty",
        description: "Please describe the event to get AI suggestions.",
        variant: "destructive",
      })
      return
    }
    setLoading(true)
    setSuggestions(null)
    try {
      const result = await eventCreationAssistant({ userInput: prompt })
      setSuggestions(result)
    } catch (error) {
      console.error("AI Assistant Error:", error)
      toast({
        title: "Error",
        description: "Failed to get suggestions from AI assistant.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  function applySuggestion(field: keyof z.infer<typeof formSchema>, value: string) {
    if (value) {
      form.setValue(field, value, { shouldValidate: true });
      toast({
        title: "Applied Suggestion",
        description: `${field} has been updated.`,
      })
    }
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
    toast({
        title: "Event Created!",
        description: "The new event has been saved successfully.",
    })
  }
  
  const parseAndApplyPrefilled = () => {
    if (suggestions?.prefilledFields) {
        try {
            const fields = JSON.parse(suggestions.prefilledFields) as Record<string, string>;
            Object.entries(fields).forEach(([key, value]) => {
                if (key in form.getValues()) {
                    form.setValue(key as keyof z.infer<typeof formSchema>, value, { shouldValidate: true });
                }
            });
            toast({
              title: "Fields Prefilled",
              description: "AI has prefilled the form based on your input.",
            })
        } catch (e) {
            console.error("Failed to parse prefilled fields:", e);
            toast({
              title: "Parsing Error",
              description: "Could not apply prefilled fields.",
              variant: "destructive"
            });
        }
    }
  }


  return (
    <Form {...form}>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Card>
                  <CardHeader>
                      <CardTitle className="font-headline text-2xl">Event Details</CardTitle>
                      <CardDescription>Fill in the information for the new event.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      <FormField
                          control={form.control}
                          name="eventName"
                          render={({ field }) => (
                              <FormItem>
                              <FormLabel>Event Name</FormLabel>
                              <FormControl>
                                  <Input placeholder="e.g., Wedding Reception" {...field} />
                              </FormControl>
                              <FormMessage />
                              </FormItem>
                          )}
                      />
                      <div className="grid sm:grid-cols-2 gap-4">
                          <FormField
                              control={form.control}
                              name="date"
                              render={({ field }) => (
                                  <FormItem>
                                  <FormLabel>Date</FormLabel>
                                  <FormControl>
                                      <Input type="date" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                  </FormItem>
                              )}
                          />
                          <FormField
                              control={form.control}
                              name="location"
                              render={({ field }) => (
                                  <FormItem>
                                  <FormLabel>Location / Venue</FormLabel>
                                  <FormControl>
                                      <Input placeholder="e.g., The Grand Hall" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                  </FormItem>
                              )}
                          />
                      </div>
                       <div className="grid sm:grid-cols-2 gap-4">
                          <FormField
                              control={form.control}
                              name="clientName"
                              render={({ field }) => (
                                  <FormItem>
                                  <FormLabel>Client Name</FormLabel>
                                  <FormControl>
                                      <Input placeholder="John Doe" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                  </FormItem>
                              )}
                          />
                          <FormField
                              control={form.control}
                              name="clientContact"
                              render={({ field }) => (
                                  <FormItem>
                                  <FormLabel>Client Contact</FormLabel>
                                  <FormControl>
                                      <Input placeholder="Phone or Email" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                  </FormItem>
                              )}
                          />
                      </div>
                       <FormField
                          control={form.control}
                          name="notes"
                          render={({ field }) => (
                              <FormItem>
                              <FormLabel>Notes</FormLabel>
                              <FormControl>
                                  <Textarea placeholder="Special song requests, dress code, etc." {...field} />
                              </FormControl>
                              <FormMessage />
                              </FormItem>
                          )}
                      />
                  </CardContent>
              </Card>
            <Button type="submit" className="mt-8">Create Event</Button>
          </form>
        </div>
        <div className="space-y-6">
          <Card className="bg-primary/5">
              <CardHeader>
                  <CardTitle className="font-headline text-2xl flex items-center gap-2">
                      <Wand2 className="text-primary"/>
                      AI Virtual Assistant
                  </CardTitle>
                  <CardDescription>
                      Describe the event and let AI help you fill out the details. For example: &quot;A 50th birthday party for my uncle Jorge. It&apos;s a surprise. He loves classics.&quot;
                  </CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="space-y-4">
                      <FormField
                          control={form.control}
                          name="aiPrompt"
                          render={({ field }) => (
                              <FormItem>
                                  <FormControl>
                                      <Textarea placeholder="Describe the event..." {...field} rows={4}/>
                                  </FormControl>
                                  <FormMessage />
                              </FormItem>
                          )}
                          />
                      <Button onClick={getAISuggestions} disabled={loading} className="w-full">
                          {loading ? "Thinking..." : "Get AI Suggestions"}
                          <Sparkles className="ml-2 h-4 w-4"/>
                      </Button>
                  </div>
              </CardContent>
          </Card>
          {suggestions && (
              <div className="space-y-4">
                  <Card>
                      <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2"><Lightbulb /> Suggested Details</CardTitle>
                      </CardHeader>
                      <CardContent>
                          <p className="text-sm text-muted-foreground">{suggestions.suggestedDetails}</p>
                      </CardContent>
                  </Card>
                   <Card>
                      <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2"><BellRing /> Suggested Reminders</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                          <p className="text-sm text-muted-foreground">{suggestions.suggestedReminders}</p>
                          <Button variant="outline" size="sm" onClick={() => applySuggestion('notes', form.getValues('notes') + '\n\nReminders:\n' + suggestions.suggestedReminders)}>Add to Notes</Button>
                      </CardContent>
                  </Card>
                  <Card>
                      <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2"><ClipboardCheck /> Pre-filled Fields</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                          <p className="text-sm text-muted-foreground">AI detected some details it can pre-fill for you.</p>
                          <Button variant="outline" size="sm" onClick={parseAndApplyPrefilled}>Apply All</Button>
                      </CardContent>
                  </Card>
              </div>
          )}
        </div>
      </div>
    </Form>
  )
}
