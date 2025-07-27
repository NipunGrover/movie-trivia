/**
 * Room Cleanup Utility
 *
 * Provides debounced cleanup functionality for empty rooms.
 * When a room becomes empty, it schedules cleanup after a grace period.
 * If someone rejoins before the grace period expires, cleanup is cancelled.
 */

// Store cleanup timers for empty rooms
const roomCleanupTimers = {};

// Grace period before cleaning up empty rooms (10 seconds)
const ROOM_CLEANUP_DELAY = 10000;

/**
 * Schedule room cleanup with grace period
 * @param {string} roomId - The ID of the room to schedule for cleanup
 * @param {object} rooms - The rooms object reference
 * @param {function} onCleanup - Optional callback when room is actually cleaned up
 */
const scheduleRoomCleanup = (roomId, rooms, onCleanup) => {
  // Clear any existing timer for this room
  if (roomCleanupTimers[roomId]) {
    clearTimeout(roomCleanupTimers[roomId]);
  }

  // Schedule cleanup after grace period
  roomCleanupTimers[roomId] = setTimeout(() => {
    if (rooms[roomId] && Object.keys(rooms[roomId].players).length === 0) {
      delete rooms[roomId];
      delete roomCleanupTimers[roomId];

      console.log(`🧹 Cleaned up empty room after grace period: ${roomId}`);

      // Call optional cleanup callback
      if (onCleanup && typeof onCleanup === "function") {
        onCleanup(roomId);
      }
    }
  }, ROOM_CLEANUP_DELAY);

  console.log(
    `⏰ Scheduled cleanup for room ${roomId} in ${ROOM_CLEANUP_DELAY}ms`
  );
};

/**
 * Cancel room cleanup (when someone rejoins)
 * @param {string} roomId - The ID of the room to cancel cleanup for
 */
const cancelRoomCleanup = (roomId) => {
  if (roomCleanupTimers[roomId]) {
    clearTimeout(roomCleanupTimers[roomId]);
    delete roomCleanupTimers[roomId];
    console.log(`✅ Cancelled cleanup for room ${roomId} - someone rejoined`);
  }
};

/**
 * Get the current cleanup delay setting
 * @returns {number} The cleanup delay in milliseconds
 */
const getCleanupDelay = () => ROOM_CLEANUP_DELAY;

/**
 * Check if a room has a pending cleanup
 * @param {string} roomId - The ID of the room to check
 * @returns {boolean} True if cleanup is scheduled, false otherwise
 */
const hasScheduledCleanup = (roomId) => {
  return !!roomCleanupTimers[roomId];
};

/**
 * Clear all pending cleanups (useful for server shutdown)
 */
const clearAllCleanups = () => {
  Object.values(roomCleanupTimers).forEach((timer) => clearTimeout(timer));
  Object.keys(roomCleanupTimers).forEach(
    (roomId) => delete roomCleanupTimers[roomId]
  );
  console.log("🧹 Cleared all pending room cleanups");
};

export {
  scheduleRoomCleanup,
  cancelRoomCleanup,
  getCleanupDelay,
  hasScheduledCleanup,
  clearAllCleanups,
};
