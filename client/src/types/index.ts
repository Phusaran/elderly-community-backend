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

export interface MarketItem {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  contact_info: string;
  image_url?: string;
  seller: {
    _id: string;
    username: string;
  };
  createdAt: string;
}