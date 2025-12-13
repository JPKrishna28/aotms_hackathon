import { unlink } from 'fs/promises';
import { existsSync } from 'fs';

/**
 * Delete file safely
 */
export async function deleteFile(filePath) {
  try {
    if (existsSync(filePath)) {
      await unlink(filePath);
      console.log(`File deleted: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error deleting file ${filePath}:`, error);
  }
}

/**
 * Delete files after delay (for privacy)
 */
export async function deleteFileAfterDelay(filePath, delayMs = 60000) {
  setTimeout(() => {
    deleteFile(filePath);
  }, delayMs);
}

/**
 * Extract file extension
 */
export function getFileExtension(filename) {
  return filename.split('.').pop().toLowerCase();
}

/**
 * Validate file type
 */
export function isAllowedFileType(filename) {
  const allowed = ['pdf', 'doc', 'docx'];
  return allowed.includes(getFileExtension(filename));
}

/**
 * Broadcast WebSocket message
 */
export function broadcastWSMessage(wss, message) {
  if (wss && wss.clients) {
    wss.clients.forEach((client) => {
      if (client.readyState === 1) { // OPEN
        client.send(JSON.stringify(message));
      }
    });
  }
}

/**
 * Send processing stage update via WebSocket
 */
export function sendProcessingUpdate(wss, stage, progress, data = {}) {
  broadcastWSMessage(wss, {
    type: 'processing_update',
    stage,
    progress,
    timestamp: new Date().toISOString(),
    ...data
  });
}
