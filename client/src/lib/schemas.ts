import { z } from "zod";

const MIN_ROOM_ID_LENGTH = 1;

/**
 * Schema for create room API response.
 */
export const CreateRoomResponseSchema = z.object({
  roomId: z.string().min(MIN_ROOM_ID_LENGTH, "Room ID cannot be empty")
});

/**
 * Schema for API error responses.
 */
export const ErrorResponseSchema = z.object({
  message: z.string().optional()
});

export type CreateRoomResponse = z.infer<typeof CreateRoomResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
