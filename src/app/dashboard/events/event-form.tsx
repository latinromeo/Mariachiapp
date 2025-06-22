"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

const formSchema = z.object({
  eventName: z.string().min(2, { message: "Event name must be at least 2 characters." }),
  date: z.string().min(1, { message: "Date is required." }),
  location: z.string().min(2, { message: "Location is required." }),
  clientName: z.string().optional(),
  clientContact: z.string().optional(),
  notes: z.string().optional(),
})

export function EventForm() {
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
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
    toast({
        title: "Event Created!",
        description: "The new event has been saved successfully.",
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-3xl">
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
        <Button type="submit">Create Event</Button>
      </form>
    </Form>
  )
}