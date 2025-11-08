'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { messagesApi, type Conversation } from '@/services/api';
import { MessageSquare, Clock, User, Home } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ConversationsResponse {
  success: boolean;
  data: Conversation[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const Messages = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchConversations = useCallback(async (page = 1) => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      
      const response: ConversationsResponse = await messagesApi.getConversations({
        page,
        limit: 20,
      });

      if (response.success) {
        setConversations(response.data);
        setPagination(response.meta);
      } else {
        setError('Failed to fetch conversations');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch conversations');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, fetchConversations]);

  const handleLoadMore = () => {
    if (pagination.page < pagination.totalPages) {
      fetchConversations(pagination.page + 1);
    }
  };

  const getOtherUser = (conversation: any) => {
    console.log(`conversation: ${JSON.stringify(conversation)}`);
    if (!user?.id) return null;

    return conversation.otherUser;
  };

  const getTotalUnreadCount = () => {
    return conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0);
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Conversations</h1>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 3 }, (_, index) => ({ id: `skeleton-${index}` })).map((skeleton) => (
                <div key={skeleton.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
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
        <main className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Conversations</h1>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-xl text-destructive mb-2">Error loading conversations</p>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => fetchConversations()} variant="outline">
                Try Again
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Conversations</h1>
          {pagination.total > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {pagination.total} conversation{pagination.total === 1 ? '' : 's'}
              </Badge>
              {getTotalUnreadCount() > 0 && (
                <Badge variant="destructive">
                  {getTotalUnreadCount()} unread
                </Badge>
              )}
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-xl text-muted-foreground mb-2">No conversations yet</p>
                <p className="text-sm text-muted-foreground">
                  Start a conversation by messaging about an apartment you&apos;re interested in
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {conversations.map((conversation) => {
                  const otherUser = getOtherUser(conversation);
                  const hasUnread = (conversation.unreadCount || 0) > 0;
                  
                  return (
                    <button
                      key={conversation.id}
                      className={`w-full text-left flex items-start space-x-4 p-4 border rounded-lg transition-colors hover:bg-muted/50 ${
                        hasUnread ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' : ''
                      }`}
                      onClick={() => {
                        // Navigate to conversation detail page
                        router.push(`/conversation/${conversation.id}`);
                      }}
                    >
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-foreground truncate">
                              {otherUser?.name || 'Unknown User'}
                            </p>
                            {hasUnread && (
                              <Badge variant="destructive" className="text-xs">
                                {conversation.unreadCount} new
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              {(() => {
                                const dateToFormat = conversation.lastMessageAt || conversation.createdAt;
                                try {
                                  return formatDistanceToNow(new Date(dateToFormat), { addSuffix: true });
                                } catch (error) {
                                  console.warn('Failed to format date:', dateToFormat, error);
                                  return 'Recently';
                                }
                              })()}
                            </span>
                          </div>
                        </div>
                        
                        {conversation.apartment && (
                          <div className="flex items-center space-x-2 mb-2">
                            <Home className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground truncate">
                              {conversation.apartment.unitName}
                              {conversation.apartment.project?.name && ` - ${conversation.apartment.project.name}`}
                            </p>
                          </div>
                        )}
                        
                        {conversation.lastMessage && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {conversation.lastMessage.senderId === user?.id ? 'You: ' : ''}
                            {conversation.lastMessage.content}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
                
                {pagination.page < pagination.totalPages && (
                  <div className="flex justify-center pt-4">
                    <Button
                      variant="outline"
                      onClick={handleLoadMore}
                      disabled={loading}
                    >
                      {loading ? 'Loading...' : 'Load More Conversations'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Messages;
