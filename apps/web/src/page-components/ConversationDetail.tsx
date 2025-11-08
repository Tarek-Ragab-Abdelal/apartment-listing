'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { messagesApi, type Message, type Conversation, type User as UserType } from '@/services/api';
import { 
  MessageSquare, 
  Send, 
  ArrowLeft, 
  User, 
  Home,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface ConversationWithOtherUser extends Conversation {
  otherUser?: UserType;
}

interface ConversationMessagesResponse {
  success: boolean;
  data: {
    conversation: ConversationWithOtherUser;
    messages: Message[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasMore: boolean;
    };
  };
}

const ConversationDetail = () => {
  const params = useParams();
  const router = useRouter();
  const conversationId = params?.id as string;
  const { user } = useAuth();
  
  const [conversation, setConversation] = useState<ConversationWithOtherUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    if (!conversationId || typeof conversationId !== 'string') return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await messagesApi.getConversationMessages(conversationId, {
        page: 1,
        limit: 50,
      }) as unknown as ConversationMessagesResponse;

      console.log('API Response:', response); // Debug log

      if (response.success && response.data) {
        // Set the conversation data
        if (response.data.conversation) {
          setConversation(response.data.conversation);
        }
        
        // Set the messages
        if (Array.isArray(response.data.messages)) {
          setMessages(response.data.messages);
        } else {
          setMessages([]);
        }
        // Messages are automatically marked as read by the API
      } else {
        console.error('Invalid response structure:', response);
        setError('Failed to fetch messages - invalid response structure');
        setMessages([]); // Ensure messages is always an array
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
      setMessages([]); // Ensure messages is always an array
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversationId || typeof conversationId !== 'string') return;

    try {
      setSendingMessage(true);
      
      const response = await messagesApi.sendMessage(conversationId, {
        content: newMessage.trim(),
        messageType: 'TEXT',
      });

      console.log('Send message response:', response); // Debug log

      if (response.success && response.data) {
        setMessages(prev => Array.isArray(prev) ? [...prev, response.data] : [response.data]);
        setNewMessage('');
        scrollToBottom();
      } else {
        console.error('Failed to send message:', response);
        setError('Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getOtherUser = () => {
    if (!conversation || !user?.id) return null;
    
    // Use the otherUser from the conversation data if available
    if (conversation.otherUser) {
      return conversation.otherUser;
    }
    
    // Fallback to the original logic
    if (conversation.user1Id === user.id) {
      return conversation.user2;
    } else {
      return conversation.user1;
    }
  };

  useEffect(() => {
    if (conversationId) {
      fetchMessages();
    }
  }, [conversationId, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (loading && messages.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-4">
            <Button variant="ghost" onClick={() => router.push('/messages')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Conversations
            </Button>
          </div>
          
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent className="flex-1 p-4 space-y-4">
              {Array.from({ length: 5 }, (_, index) => (
                <div key={index} className={`flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                  <Skeleton className={`max-w-xs p-3 rounded-lg ${index % 2 === 0 ? 'h-16 w-48' : 'h-12 w-32'}`} />
                </div>
              ))}
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-4">
            <Button variant="ghost" onClick={() => router.push('/messages')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Conversations
            </Button>
          </div>
          
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-xl text-destructive mb-2">Error loading conversation</p>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => fetchMessages()} variant="outline">
                Try Again
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const otherUser = getOtherUser();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-4">
          <Button variant="ghost" onClick={() => router.push('/messages')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Conversations
          </Button>
        </div>

        <Card className="h-[600px] flex flex-col">
          <CardHeader className="border-b">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">
                  {otherUser?.name || 'Unknown User'}
                </CardTitle>
                {conversation?.apartment && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Home className="h-4 w-4" />
                    <span>
                      {conversation.apartment.unitName}
                      {conversation.apartment.project?.name && ` - ${conversation.apartment.project.name}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground mb-2">No messages yet</p>
                <p className="text-sm text-muted-foreground">
                  Start the conversation by sending a message below
                </p>
              </div>
            ) : (
              Array.isArray(messages) && messages.map((message, index) => {
                const isOwnMessage = message.senderId === user?.id;
                const showTimestamp = index === 0 || 
                  new Date(messages[index - 1].createdAt).getTime() - new Date(message.createdAt).getTime() > 300000; // 5 minutes
                
                return (
                  <div key={message.id} className="space-y-2">
                    {showTimestamp && (
                      <div className="text-center">
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                          {format(new Date(message.createdAt), 'MMM d, h:mm a')}
                        </span>
                      </div>
                    )}
                    
                    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                          isOwnMessage
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        <p className="text-sm break-words">{message.content}</p>
                        <div className={`flex items-center space-x-1 mt-1 text-xs ${
                          isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}>
                          <Clock className="h-3 w-3" />
                          <span>{formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}</span>
                          {isOwnMessage && message.isRead && (
                            <CheckCircle2 className="h-3 w-3 ml-1" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          <div className="border-t p-4">
            <div className="flex space-x-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                onKeyDown={handleKeyPress}
                className="flex-1"
                disabled={sendingMessage}
              />
              <Button 
                onClick={sendMessage} 
                disabled={!newMessage.trim() || sendingMessage}
                size="sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default ConversationDetail;