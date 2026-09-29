import { PrismaClient, ConversationType, ConversationMemberRole, MessageType, ConnectionStatus, NotificationType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding PulseChat database with demo data...');

  // Clean existing tables in proper order
  await prisma.pinnedMessage.deleteMany();
  await prisma.messageReaction.deleteMany();
  await prisma.messageAttachment.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationMember.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.userConnection.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.user.deleteMany();

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Password123!', salt);

  // 1. Create 5 Demo Users
  const userAlex = await prisma.user.create({
    data: {
      name: 'Alex Rivers',
      username: 'alex.rivers',
      email: 'alex@pulsechat.io',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      bio: 'Lead Product Designer & Frontend Enthusiast. Building next-gen web experiences.',
      status: 'Designing the future of PulseChat ✨',
      lastSeenAt: new Date(),
    },
  });

  const userSarah = await prisma.user.create({
    data: {
      name: 'Sarah Chen',
      username: 'sarah.chen',
      email: 'sarah@pulsechat.io',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      bio: 'Full-stack architect & open-source contributor. Coffee, TypeScript & distributed systems.',
      status: 'Working on real-time sync engine 🚀',
      lastSeenAt: new Date(Date.now() - 5 * 60 * 1000), // 5 mins ago
    },
  });

  const userMarcus = await prisma.user.create({
    data: {
      name: 'Marcus Vance',
      username: 'marcus.vance',
      email: 'marcus@pulsechat.io',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      bio: 'DevOps & Cloud Infrastructure engineer. Kubernetes, Docker, and CI/CD automation.',
      status: 'Deploying the staging clusters ⚡',
      lastSeenAt: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
    },
  });

  const userElena = await prisma.user.create({
    data: {
      name: 'Elena Rostova',
      username: 'elena.rostova',
      email: 'elena@pulsechat.io',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      bio: 'Security specialist and crypto researcher. Passionate about end-to-end privacy.',
      status: 'Auditing authentication protocols 🔒',
      lastSeenAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
  });

  const userDavid = await prisma.user.create({
    data: {
      name: 'David Kim',
      username: 'david.kim',
      email: 'david@pulsechat.io',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      bio: 'Mobile engineer & UI/UX perfectionist. Crafting fluid 60fps animations.',
      status: 'Testing touch gestures 📱',
      lastSeenAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    },
  });

  console.log('✅ Created 5 demo users (Password: Password123!)');

  // 2. Connections / Friend Requests
  // Alex <-> Sarah (ACCEPTED)
  await prisma.userConnection.create({
    data: {
      senderId: userAlex.id,
      receiverId: userSarah.id,
      status: ConnectionStatus.ACCEPTED,
    },
  });

  // Alex <-> Marcus (ACCEPTED)
  await prisma.userConnection.create({
    data: {
      senderId: userAlex.id,
      receiverId: userMarcus.id,
      status: ConnectionStatus.ACCEPTED,
    },
  });

  // Alex <-> Elena (ACCEPTED)
  await prisma.userConnection.create({
    data: {
      senderId: userAlex.id,
      receiverId: userElena.id,
      status: ConnectionStatus.ACCEPTED,
    },
  });

  // David -> Alex (PENDING)
  await prisma.userConnection.create({
    data: {
      senderId: userDavid.id,
      receiverId: userAlex.id,
      status: ConnectionStatus.PENDING,
    },
  });

  // 3. Direct Conversation: Alex & Sarah
  const directAlexSarah = await prisma.conversation.create({
    data: {
      type: ConversationType.DIRECT,
      members: {
        create: [
          { userId: userAlex.id, role: ConversationMemberRole.MEMBER },
          { userId: userSarah.id, role: ConversationMemberRole.MEMBER },
        ],
      },
    },
  });

  const m1 = await prisma.message.create({
    data: {
      conversationId: directAlexSarah.id,
      senderId: userSarah.id,
      content: 'Hey Alex! Have you reviewed the new Socket.IO event architecture proposal?',
      createdAt: new Date(Date.now() - 45 * 60 * 1000),
    },
  });

  const m2 = await prisma.message.create({
    data: {
      conversationId: directAlexSarah.id,
      senderId: userAlex.id,
      content: 'Yes! It looks very clean. The sub-millisecond typing indicators and read receipts will make the UX feel super responsive.',
      createdAt: new Date(Date.now() - 35 * 60 * 1000),
      replyToId: m1.id,
    },
  });

  const m3 = await prisma.message.create({
    data: {
      conversationId: directAlexSarah.id,
      senderId: userSarah.id,
      content: 'Here is the UI mockup for the dark mode message bubbles. Let me know what you think!',
      createdAt: new Date(Date.now() - 20 * 60 * 1000),
      type: MessageType.IMAGE,
      attachments: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
            filename: 'dark-mode-preview.png',
            mimeType: 'image/png',
            size: 420912,
          },
        ],
      },
    },
  });

  const m4 = await prisma.message.create({
    data: {
      conversationId: directAlexSarah.id,
      senderId: userAlex.id,
      content: 'Absolutely stunning! The contrast ratio and violet accent feel so premium.',
      createdAt: new Date(Date.now() - 10 * 60 * 1000),
    },
  });

  // Add reactions
  await prisma.messageReaction.create({
    data: {
      messageId: m3.id,
      userId: userAlex.id,
      emoji: '🔥',
    },
  });

  await prisma.messageReaction.create({
    data: {
      messageId: m4.id,
      userId: userSarah.id,
      emoji: '❤️',
    },
  });

  // Pin m3 (the mockup)
  await prisma.pinnedMessage.create({
    data: {
      conversationId: directAlexSarah.id,
      messageId: m3.id,
      pinnedBy: userAlex.id,
    },
  });

  // 4. Direct Conversation: Alex & Marcus
  const directAlexMarcus = await prisma.conversation.create({
    data: {
      type: ConversationType.DIRECT,
      members: {
        create: [
          { userId: userAlex.id, role: ConversationMemberRole.MEMBER },
          { userId: userMarcus.id, role: ConversationMemberRole.MEMBER },
        ],
      },
    },
  });

  await prisma.message.create({
    data: {
      conversationId: directAlexMarcus.id,
      senderId: userMarcus.id,
      content: 'Hey Alex, Postgres 16 docker container is healthy and all automated backups are verified.',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
  });

  await prisma.message.create({
    data: {
      conversationId: directAlexMarcus.id,
      senderId: userAlex.id,
      content: 'Awesome work Marcus! We are ready for load testing.',
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    },
  });

  // 5. Group Conversation 1: "PulseChat Core Team"
  const groupCoreTeam = await prisma.conversation.create({
    data: {
      type: ConversationType.GROUP,
      name: 'PulseChat Core Team',
      avatarUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
      members: {
        create: [
          { userId: userAlex.id, role: ConversationMemberRole.OWNER },
          { userId: userSarah.id, role: ConversationMemberRole.ADMIN },
          { userId: userMarcus.id, role: ConversationMemberRole.MEMBER },
          { userId: userElena.id, role: ConversationMemberRole.MEMBER },
        ],
      },
    },
  });

  // System message
  await prisma.message.create({
    data: {
      conversationId: groupCoreTeam.id,
      senderId: userAlex.id,
      type: MessageType.SYSTEM,
      content: 'Alex Rivers created the group "PulseChat Core Team"',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  });

  const gm1 = await prisma.message.create({
    data: {
      conversationId: groupCoreTeam.id,
      senderId: userAlex.id,
      content: 'Welcome team! Sprint 1 goals: WebSocket presence tracking, message pinning, and file upload validation.',
      createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
    },
  });

  await prisma.message.create({
    data: {
      conversationId: groupCoreTeam.id,
      senderId: userElena.id,
      content: 'I have validated the JWT HTTP-only cookie security headers and rate limiter. No token leaks possible.',
      createdAt: new Date(Date.now() - 15 * 60 * 60 * 1000),
    },
  });

  await prisma.message.create({
    data: {
      conversationId: groupCoreTeam.id,
      senderId: userSarah.id,
      content: 'PR is merged and passing all tests! 🚀',
      createdAt: new Date(Date.now() - 5 * 60 * 1000),
    },
  });

  // Pin sprint 1 goals in group
  await prisma.pinnedMessage.create({
    data: {
      conversationId: groupCoreTeam.id,
      messageId: gm1.id,
      pinnedBy: userAlex.id,
    },
  });

  // 6. Group Conversation 2: "Weekend Explorers"
  const groupWeekend = await prisma.conversation.create({
    data: {
      type: ConversationType.GROUP,
      name: 'Weekend Explorers',
      avatarUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=150&auto=format&fit=crop&q=80',
      members: {
        create: [
          { userId: userSarah.id, role: ConversationMemberRole.OWNER },
          { userId: userAlex.id, role: ConversationMemberRole.ADMIN },
          { userId: userMarcus.id, role: ConversationMemberRole.MEMBER },
          { userId: userDavid.id, role: ConversationMemberRole.MEMBER },
        ],
      },
    },
  });

  await prisma.message.create({
    data: {
      conversationId: groupWeekend.id,
      senderId: userSarah.id,
      type: MessageType.SYSTEM,
      content: 'Sarah Chen created the group "Weekend Explorers"',
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
    },
  });

  await prisma.message.create({
    data: {
      conversationId: groupWeekend.id,
      senderId: userSarah.id,
      content: 'Who is up for mountain hiking this Saturday morning? 🏔️',
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    },
  });

  await prisma.message.create({
    data: {
      conversationId: groupWeekend.id,
      senderId: userAlex.id,
      content: 'Count me in! Weather forecast looks fantastic.',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    },
  });

  // 7. Notifications for Alex
  await prisma.notification.create({
    data: {
      userId: userAlex.id,
      type: NotificationType.CONNECTION_REQUEST,
      title: 'New Connection Request',
      message: 'David Kim sent you a connection request.',
      relatedId: userDavid.id,
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: userAlex.id,
      type: NotificationType.GROUP_ADD,
      title: 'Added to Group',
      message: 'You were added to "Weekend Explorers" as Admin.',
      relatedId: groupWeekend.id,
      isRead: true,
    },
  });

  await prisma.notification.create({
    data: {
      userId: userAlex.id,
      type: NotificationType.NEW_MESSAGE,
      title: 'New Message from Sarah',
      message: 'PR is merged and passing all tests! 🚀',
      relatedId: groupCoreTeam.id,
      isRead: false,
    },
  });

  console.log('✅ Demo seed completed successfully!');
  console.log('--------------------------------------------------------');
  console.log('Demo Accounts:');
  console.log('1. alex.rivers / alex@pulsechat.io (Password: Password123!)');
  console.log('2. sarah.chen  / sarah@pulsechat.io (Password: Password123!)');
  console.log('3. marcus.vance/ marcus@pulsechat.io(Password: Password123!)');
  console.log('4. elena.rostova/ elena@pulsechat.io(Password: Password123!)');
  console.log('5. david.kim   / david@pulsechat.io (Password: Password123!)');
  console.log('--------------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
