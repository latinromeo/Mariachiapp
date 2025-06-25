import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatTime = (timeString: string | undefined): string => {
  if (!timeString) {
    return '';
  }
  // Check if it's already in AM/PM format
  if (timeString.toLowerCase().includes('am') || timeString.toLowerCase().includes('pm')) {
    return timeString;
  }
  
  // Assuming 'HH:mm' format
  const parts = timeString.split(':');
  if (parts.length < 2) {
    return timeString; // Return original if format is unexpected
  }

  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);

  if (isNaN(hours) || isNaN(minutes)) {
    return timeString; // Return original if parsing fails
  }

  const date = new Date();
  date.setHours(hours, minutes);
  
  const formattedHour = (date.getHours() % 12) || 12;
  const formattedMinute = date.getMinutes().toString().padStart(2, '0');
  const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
  
  return `${formattedHour}:${formattedMinute} ${ampm}`;
};
