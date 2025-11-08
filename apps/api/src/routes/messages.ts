import fastifyPlugin from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../lib/auth';

const prisma = new PrismaClient();

async function messageRoutes(fastify: any) {
  //#region GET Routes
  // GET /conversations - Get all conversations for the current user
  fastify.get('/conversations', {
    preHandler: authenticateToken,
    schema: {
      tags: ['messages'],
      summary: 'Get user conversations',
      description: 'Get all conversations for the authenticated user with last message preview',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', minimum: 1, default: 1 },
          limit: { type: 'number', minimum: 1, maximum: 50, default: 20 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array', items: { type: 'object', additionalProperties: true } },
            meta: {
              type: 'object',
              properties: {
                page: { type: 'number' },
                limit: { type: 'number' },
                total: { type: 'number' },
                totalPages: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, async (request: any, reply: any) => {
    try {
      const { page = 1, limit = 20 } = request.query;
      const currentUser = request.user;

      if (!currentUser?.id) {
        return reply.code(401).send({
          success: false,
          error: 'Authentication required'
        });
      }

      // Get conversations where user is either user1 or user2
      const where = {
        OR: [
          { user1Id: currentUser.id },
          { user2Id: currentUser.id }
        ]
      };

      const [conversations, total] = await Promise.all([
        prisma.conversation.findMany({
          where,
          include: {
            apartment: {
              select: {
                id: true,
                unitName: true,
                unitNumber: true,
                priceEgp: true,
                status: true,
                images: {
                  select: { imageUrl: true },
                  take: 1,
                  orderBy: { position: 'asc' }
                }
              }
            },
            user1: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                role: true
              }
            },
            user2: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                role: true
              }
            },
            messages: {
              select: {
                id: true,
                content: true,
                messageType: true,
                isRead: true,
                createdAt: true,
                senderId: true
              },
              orderBy: { createdAt: 'desc' },
              take: 1
            },
            _count: {
              select: {
                messages: {
                  where: {
                    isRead: false,
                    senderId: { not: currentUser.id }
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.conversation.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      console.log(`Total Conversations ${total}`);
      console.log(`Total Pages ${totalPages}`);


      // TODO: Create mappers and DTOs
      // Format conversations for frontend
      const formattedConversations = conversations.map(conv => {
        try {
          // Determine the other user (not the current user)
          let otherUser;
          if (conv.user1Id === currentUser.id) {
            otherUser = conv.user2;
          } else if (conv.user2Id === currentUser.id) {
            otherUser = conv.user1;
          } else {
            console.error('Current user is not part of this conversation:', conv.id);
            return null; // Skip this conversation
          }
          
          const lastMessage = conv.messages && conv.messages.length > 0 ? conv.messages[0] : null;
          // console.log(`Last Message for Conversation ${conv.id}: `, lastMessage);
          
          let result = {
            id: conv.id,
            apartment: {
              ...conv.apartment,
              priceEgp: conv.apartment.priceEgp ? Number(conv.apartment.priceEgp) : null
            },
            otherUser,
            lastMessage: lastMessage ? {
              ...lastMessage,
              createdAt: lastMessage.createdAt.toISOString()
            } : null,
            unreadCount: conv._count.messages,
            lastMessageAt: conv.lastMessageAt ? conv.lastMessageAt.toISOString() : null,
            createdAt: conv.createdAt.toISOString()
          }

          console.log(`Formatted Conversation ${conv.id}: `, result);

          return result;
        } catch (error) {
          console.error('Error formatting conversation:', conv.id, error);
          return null;
        }
      }).filter(conv => conv !== null); // Remove any null conversations

      
     
      const responseData = {
        success: true,
        data: formattedConversations,
        meta: {
          page,
          limit,
          total,
          totalPages
        }
      };

      console.log(`Response Data: `, responseData);

      return reply.send(responseData);
    } catch (error) {
      console.error('Error in conversations endpoint:', error);
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // GET /conversations/:id/messages - Get messages in a conversation
  fastify.get('/conversations/:id/messages', {
    preHandler: authenticateToken,
    schema: {
      tags: ['messages'],
      summary: 'Get conversation messages',
      description: 'Get all messages in a specific conversation',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      },
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', minimum: 1, default: 1 },
          limit: { type: 'number', minimum: 1, maximum: 100, default: 50 },
          before: { type: 'string', format: 'uuid', description: 'Get messages before this message ID' }
        }
      }
    }
  }, async (request: any, reply: any) => {
    try {
      const { id } = request.params;
      const { page = 1, limit = 50, before } = request.query;
      const currentUser = request.user;

      // Verify user has access to this conversation
      const conversation = await prisma.conversation.findFirst({
        where: {
          id,
          OR: [
            { user1Id: currentUser.id },
            { user2Id: currentUser.id }
          ]
        },
        include: {
          apartment: {
            select: {
              id: true,
              unitName: true,
              unitNumber: true,
              listerId: true
            }
          },
          user1: {
            select: { id: true, name: true, avatarUrl: true, role: true }
          },
          user2: {
            select: { id: true, name: true, avatarUrl: true, role: true }
          }
        }
      });

      if (!conversation) {
        return reply.code(404).send({
          success: false,
          error: 'Conversation not found or access denied'
        });
      }

      // Build where clause for messages
      const where: any = { conversationId: id };
      
      if (before) {
        // Get the createdAt of the 'before' message
        const beforeMessage = await prisma.message.findUnique({
          where: { id: before },
          select: { createdAt: true }
        });
        
        if (beforeMessage) {
          where.createdAt = { lt: beforeMessage.createdAt };
        }
      }

      const [messages, total] = await Promise.all([
        prisma.message.findMany({
          where,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                role: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: before ? 0 : (page - 1) * limit,
          take: limit
        }),
        prisma.message.count({ where: { conversationId: id } })
      ]);

      // Mark messages as read if they were sent to the current user
      const unreadMessageIds = messages
        .filter(msg => msg.senderId !== currentUser.id && !msg.isRead)
        .map(msg => msg.id);

      if (unreadMessageIds.length > 0) {
        await prisma.message.updateMany({
          where: {
            id: { in: unreadMessageIds }
          },
          data: {
            isRead: true,
            readAt: new Date()
          }
        });

        // Update conversation lastMessageAt
        await prisma.conversation.update({
          where: { id },
          data: { lastMessageAt: new Date() }
        });
      }

      const totalPages = Math.ceil(total / limit);

      return reply.send({
        success: true,
        data: {
          conversation: {
            id: conversation.id,
            apartment: conversation.apartment,
            otherUser: conversation.user1Id === currentUser.id ? conversation.user2 : conversation.user1
          },
          messages: [...messages].reverse(), // Reverse to show oldest first
          meta: {
            page,
            limit,
            total,
            totalPages,
            hasMore: before ? messages.length === limit : total > page * limit
          }
        }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // GET /conversations/:id/unread-count - Get unread message count for conversation
  fastify.get('/conversations/:id/unread-count', {
    preHandler: authenticateToken,
    schema: {
      tags: ['messages'],
      summary: 'Get unread message count',
      description: 'Get count of unread messages in a conversation for current user',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                unreadCount: { type: 'number' }
              }
            }
          }
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: any, reply: any) => {
    try {
      const { id } = request.params as { id: string };
      const currentUser = request.user;

      // Verify conversation exists and user has access
      const conversation = await prisma.conversation.findFirst({
        where: {
          id,
          OR: [
            { user1Id: currentUser.id },
            { user2Id: currentUser.id }
          ]
        },
        select: { id: true }
      });

      if (!conversation) {
        return reply.code(404).send({
          success: false,
          error: 'Conversation not found or access denied'
        });
      }

      const unreadCount = await prisma.message.count({
        where: {
          conversationId: id,
          senderId: { not: currentUser.id },
          isRead: false
        }
      });

      return reply.send({
        success: true,
        data: { unreadCount }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  //#endregion

  //#region POST Routes
  // POST /conversations - Create or get existing conversation
  fastify.post('/conversations', {
    preHandler: authenticateToken,
    schema: {
      tags: ['messages'],
      summary: 'Start conversation',
      description: 'Start a new conversation about an apartment',
      body: {
        type: 'object',
        properties: {
          apartmentId: { type: 'string', format: 'uuid' },
          message: { type: 'string', minLength: 1, maxLength: 1000 }
        },
        required: ['apartmentId', 'message']
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' }
          }
        }
      }
    }
  }, async (request: any, reply: any) => {
    try {
      const { apartmentId, message } = request.body;
      const currentUser = request.user;

      // Get apartment and its lister
      const apartment = await prisma.apartment.findUnique({
        where: { id: apartmentId },
        include: {
          lister: {
            select: { id: true, name: true, role: true }
          }
        }
      });

      if (!apartment) {
        return reply.code(404).send({
          success: false,
          error: 'Apartment not found'
        });
      }

      // Don't allow users to message themselves
      if (apartment.listerId === currentUser.id) {
        return reply.code(400).send({
          success: false,
          error: 'You cannot start a conversation about your own listing'
        });
      }

      // Check if conversation already exists
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          apartmentId,
          OR: [
            { user1Id: apartment.listerId, user2Id: currentUser.id },
            { user1Id: currentUser.id, user2Id: apartment.listerId }
          ]
        }
      });

      let conversationId;

      if (existingConversation) {
        conversationId = existingConversation.id;
      } else {
        // Create new conversation
        const newConversation = await prisma.conversation.create({
          data: {
            apartmentId,
            user1Id: apartment.listerId, // Lister is always user1
            user2Id: currentUser.id,     // Interested party is user2
            lastMessageAt: new Date()
          }
        });
        conversationId = newConversation.id;
      }

      // Create the first message
      const newMessage = await prisma.message.create({
        data: {
          conversationId,
          senderId: currentUser.id,
          content: message,
          messageType: 'TEXT'
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              role: true
            }
          },
          conversation: {
            include: {
              apartment: {
                select: {
                  id: true,
                  unitName: true,
                  unitNumber: true
                }
              }
            }
          }
        }
      });

      // Update conversation lastMessageAt and fetch complete conversation data
      const conversation = await prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
        include: {
          apartment: {
            include: {
              images: {
                select: { 
                  id: true,
                  imageUrl: true 
                },
                take: 1,
                orderBy: [
                  { position: 'asc' },
                  { id: 'asc' }
                ]
              }
            }
          },
          user1: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              role: true
            }
          },
          user2: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              role: true
            }
          }
        }
      });

      return reply.code(201).send({
        success: true,
        data: conversation
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // POST /conversations/:id/messages - Send a message in existing conversation
  fastify.post('/conversations/:id/messages', {
    preHandler: authenticateToken,
    schema: {
      tags: ['messages'],
      summary: 'Send message',
      description: 'Send a message in an existing conversation',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          content: { type: 'string', minLength: 1, maxLength: 1000 },
          messageType: { type: 'string', enum: ['TEXT', 'IMAGE'], default: 'TEXT' }
        },
        required: ['content']
      }
    }
  }, async (request: any, reply: any) => {
    try {
      const { id } = request.params;
      const { content, messageType = 'TEXT' } = request.body;
      const currentUser = request.user;

      // Verify user has access to this conversation
      const conversation = await prisma.conversation.findFirst({
        where: {
          id,
          OR: [
            { user1Id: currentUser.id },
            { user2Id: currentUser.id }
          ]
        }
      });

      if (!conversation) {
        return reply.code(404).send({
          success: false,
          error: 'Conversation not found or access denied'
        });
      }

      // Create the message
      const newMessage = await prisma.message.create({
        data: {
          conversationId: id,
          senderId: currentUser.id,
          content,
          messageType
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              role: true
            }
          }
        }
      });

      // Update conversation lastMessageAt
      await prisma.conversation.update({
        where: { id },
        data: { lastMessageAt: new Date() }
      });

      return reply.code(201).send({
        success: true,
        data: newMessage
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // PUT /messages/:id/read - Mark message as read
  fastify.put('/messages/:id/read', {
    preHandler: authenticateToken,
    schema: {
      tags: ['messages'],
      summary: 'Mark message as read',
      description: 'Mark a specific message as read',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      }
    }
  }, async (request: any, reply: any) => {
    try {
      const { id } = request.params;
      const currentUser = request.user;

      // Verify message exists and user has access
      const message = await prisma.message.findUnique({
        where: { id },
        include: {
          conversation: {
            select: {
              user1Id: true,
              user2Id: true
            }
          }
        }
      });

      if (!message) {
        return reply.code(404).send({
          success: false,
          error: 'Message not found'
        });
      }

      // Check if user has access to this conversation
      const hasAccess = message.conversation.user1Id === currentUser.id || 
                       message.conversation.user2Id === currentUser.id;

      if (!hasAccess) {
        return reply.code(403).send({
          success: false,
          error: 'Access denied'
        });
      }

      // Can only mark messages sent TO you as read
      if (message.senderId === currentUser.id) {
        return reply.code(400).send({
          success: false,
          error: 'You cannot mark your own messages as read'
        });
      }

      // Update message
      const updatedMessage = await prisma.message.update({
        where: { id },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      return reply.send({
        success: true,
        data: updatedMessage
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  });

};

export default fastifyPlugin(messageRoutes);
