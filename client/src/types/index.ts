export interface Activity {
  _id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  location: string;
  maxParticipants: number;
  currentParticipants: number;
}