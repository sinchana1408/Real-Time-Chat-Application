import { z } from 'zod';

export const passwordValidation = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password is too long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Full name must be at least 2 characters').max(60, 'Name too long').trim(),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username cannot exceed 30 characters')
      .regex(/^[a-zA-Z0-9_.-]+$/, 'Username can only contain letters, numbers, underscores, dots, and hyphens')
      .toLowerCase()
      .trim(),
    email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
    password: passwordValidation,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Please enter your email or username').trim(),
  password: z.string().min(1, 'Please enter your password'),
  rememberMe: z.boolean().optional().default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    password: passwordValidation,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(60).trim().optional(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_.-]+$/)
    .toLowerCase()
    .trim()
    .optional(),
  bio: z.string().max(250, 'Bio cannot exceed 250 characters').optional().nullable(),
  avatarUrl: z.string().url('Invalid URL').optional().nullable(),
  status: z.string().max(50).optional().nullable(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const createDirectConversationSchema = z.object({
  recipientId: z.string().min(1, 'Recipient ID is required'),
});

export type CreateDirectConversationInput = z.infer<typeof createDirectConversationSchema>;

export const createGroupConversationSchema = z.object({
  name: z.string().min(2, 'Group name must be at least 2 characters').max(50, 'Group name is too long').trim(),
  avatarUrl: z.string().url().optional().nullable(),
  memberIds: z.array(z.string()).min(1, 'Please add at least one member to the group'),
});

export type CreateGroupConversationInput = z.infer<typeof createGroupConversationSchema>;

export const updateGroupSchema = z.object({
  name: z.string().min(2).max(50).trim().optional(),
  avatarUrl: z.string().url().optional().nullable(),
});

export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;

export const addMembersSchema = z.object({
  memberIds: z.array(z.string()).min(1, 'Must provide at least one user ID'),
});

export type AddMembersInput = z.infer<typeof addMembersSchema>;

export const updateMemberRoleSchema = z.object({
  role: z.enum(['MEMBER', 'ADMIN']),
});

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;

export const sendMessageSchema = z.object({
  content: z.string().max(4000, 'Message cannot exceed 4000 characters').default(''),
  type: z.enum(['TEXT', 'IMAGE', 'FILE', 'SYSTEM']).default('TEXT'),
  replyToId: z.string().optional().nullable(),
  attachments: z
    .array(
      z.object({
        url: z.string().url(),
        filename: z.string(),
        mimeType: z.string(),
        size: z.number().nonnegative(),
      })
    )
    .optional(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export const editMessageSchema = z.object({
  content: z.string().min(1, 'Message content cannot be empty').max(4000, 'Message cannot exceed 4000 characters'),
});

export type EditMessageInput = z.infer<typeof editMessageSchema>;

export const messageReactionSchema = z.object({
  emoji: z.string().min(1).max(10),
});

export type MessageReactionInput = z.infer<typeof messageReactionSchema>;

export const sendConnectionSchema = z.object({
  receiverId: z.string().min(1, 'Receiver ID is required'),
});

export type SendConnectionInput = z.infer<typeof sendConnectionSchema>;
