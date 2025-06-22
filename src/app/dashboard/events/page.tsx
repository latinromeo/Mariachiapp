import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
  

const events = [
    { name: "Wedding at The Grand Hall", date: "July 20, 2024", venue: "The Grand Hall", status: "Confirmed" },
    { name: "Quinceañera Celebration", date: "July 22, 2024", venue: "Salón Imperial", status: "Confirmed" },
    { name: "Corporate Gala", date: "August 1, 2024", venue: "City Convention Center", status: "Pending" },
    { name: "Private Birthday Party", date: "August 5, 2024", venue: "Client's Residence", status: "Confirmed" },
    { name: "Festival del Sol", date: "August 15, 2024", venue: "Plaza Mayor", status: "Tentative" },
    { name: "Anniversary Dinner", date: "September 2, 2024", venue: "La Hacienda Restaurant", status: "Confirmed" },
];

export default function EventsPage() {
  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center justify-between">
        <h1 className="font-headline text-3xl font-bold tracking-tight">
            Events
        </h1>
        <Button asChild>
            <a href="/dashboard/events/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Event
            </a>
        </Button>
       </div>
      <Card>
        <CardHeader>
          <CardTitle>Event Schedule</CardTitle>
          <CardDescription>
            A list of all your upcoming and past events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.name}>
                  <TableCell className="font-medium">{event.name}</TableCell>
                  <TableCell>{event.date}</TableCell>
                  <TableCell>{event.venue}</TableCell>
                  <TableCell>
                    <Badge variant={event.status === "Confirmed" ? "default" : "secondary"}>
                      {event.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
