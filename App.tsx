
import React, { useState, useCallback } from 'react';
import ReceiptPane from './components/ReceiptPane';
import ChatPane from './components/ChatPane';
import SummaryPane from './components/SummaryPane';
import { AppState, Message, ReceiptData, CommandAction } from './types';
import { parseReceiptImage, interpretCommand } from './services/gemini';
import { Scan, MessageSquare, ListTodo, Wallet } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    receipt: null,
    assignments: {},
    messages: [],
    isProcessingImage: false,
    isProcessingChat: false,
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setState(prev => ({ ...prev, isProcessingImage: true }));

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        try {
          const parsedData = await parseReceiptImage(base64);
          setState(prev => ({
            ...prev,
            receipt: parsedData,
            isProcessingImage: false,
            messages: [
              ...prev.messages,
              {
                id: Date.now().toString(),
                role: 'assistant',
                content: `Success! I've parsed the receipt. It has ${parsedData.items.length} items. Now tell me who had what.`,
                timestamp: Date.now(),
              }
            ]
          }));
        } catch (err) {
          console.error(err);
          alert("Error parsing receipt. Make sure the image is clear.");
          setState(prev => ({ ...prev, isProcessingImage: false }));
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setState(prev => ({ ...prev, isProcessingImage: false }));
    }
  };

  const onSendMessage = async (content: string) => {
    if (!state.receipt) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now()
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isProcessingChat: true
    }));

    try {
      // Fix: Explicitly type the entries to ensure 'people' is recognized as string[] instead of unknown
      const currentAssignmentsSummary = (Object.entries(state.assignments) as [string, string[]][])
        .map(([id, people]) => {
          const item = state.receipt?.items.find(i => i.id === id);
          return `${item?.name}: ${people.join(', ')}`;
        }).join('; ');

      const action = await interpretCommand(
        content,
        state.receipt.items.map(i => i.name),
        currentAssignmentsSummary || "None"
      );

      applyAction(action);
    } catch (err) {
      console.error(err);
      setState(prev => ({
        ...prev,
        isProcessingChat: false,
        messages: [
          ...prev.messages,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: "Sorry, I had trouble understanding that command. Could you try rephrasing?",
            timestamp: Date.now()
          }
        ]
      }));
    }
  };

  const applyAction = (action: CommandAction) => {
    setState(prev => {
      const newAssignments = { ...prev.assignments };
      const receiptItems = prev.receipt?.items || [];

      if (action.action === 'ASSIGN') {
        action.itemNames.forEach(itemName => {
          const matchingItem = receiptItems.find(i => 
            i.name.toLowerCase().includes(itemName.toLowerCase()) || 
            itemName.toLowerCase().includes(i.name.toLowerCase())
          );
          
          if (matchingItem) {
            const currentPeople = new Set(newAssignments[matchingItem.id] || []);
            action.peopleNames.forEach(p => currentPeople.add(p));
            newAssignments[matchingItem.id] = Array.from(currentPeople);
          }
        });
      }

      return {
        ...prev,
        assignments: newAssignments,
        isProcessingChat: false,
        messages: [
          ...prev.messages,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: action.explanation,
            timestamp: Date.now()
          }
        ]
      };
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 shrink-0 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg">
            <Scan className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent">
            SplitSmart AI
          </h1>
        </div>
        <div className="ml-auto hidden md:flex items-center gap-6">
          <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
            <ListTodo className="w-4 h-4" /> 1. Upload
          </div>
          <div className="w-4 h-px bg-slate-200"></div>
          <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
            <MessageSquare className="w-4 h-4" /> 2. Chat
          </div>
          <div className="w-4 h-px bg-slate-200"></div>
          <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
            <Wallet className="w-4 h-4" /> 3. Settle
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden p-4 md:p-8 flex flex-col gap-8 max-w-[1400px] mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full max-h-[calc(100vh-250px)]">
          <div className="h-full flex flex-col min-h-[400px]">
            <ReceiptPane 
              data={state.receipt} 
              assignments={state.assignments} 
              onFileUpload={handleFileUpload} 
              isProcessing={state.isProcessingImage}
            />
          </div>
          <div className="h-full flex flex-col min-h-[400px]">
            <ChatPane 
              messages={state.messages} 
              onSendMessage={onSendMessage} 
              isProcessing={state.isProcessingChat}
              disabled={!state.receipt}
            />
          </div>
        </div>

        {/* Summary Area */}
        <div className="shrink-0 pb-8">
           <SummaryPane state={state} />
        </div>
      </main>
    </div>
  );
};

export default App;
