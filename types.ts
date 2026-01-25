
export interface ReceiptItem {
  id: string;
  name: string;
  price: number;
}

export interface ReceiptData {
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  tip: number;
}

export interface Assignment {
  itemId: string;
  people: string[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface AppState {
  receipt: ReceiptData | null;
  assignments: Record<string, string[]>; // itemId -> names[]
  messages: Message[];
  isProcessingImage: boolean;
  isProcessingChat: boolean;
}

export interface CommandAction {
  action: 'ASSIGN' | 'REMOVE' | 'UNKNOWN';
  itemNames: string[];
  peopleNames: string[];
  explanation: string;
}
