import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Request, Response } from 'express';

const db = admin.firestore();

/**
 * Webhook handler for Remotion Lambda render completion
 * POST /handleRenderComplete
 *
 * Called by Remotion Lambda when rendering is complete
 * TODO: Implement in Phase 1 after Remotion Lambda setup
 */
export const handleRenderComplete = functions.https.onRequest(
  async (req: Request, res: Response) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      const { jobId, videoUrl, status, error, renderTime } = req.body;

      if (!jobId) {
        res.status(400).json({ error: 'jobId is required' });
        return;
      }

      functions.logger.info('Render complete webhook received', {
        jobId,
        status,
        renderTime,
      });

      if (status === 'success' && videoUrl) {
        // TODO: Phase 1 - Implement video transfer from S3 to Firebase Storage
        // 1. Download video from S3 (videoUrl)
        // 2. Upload to Firebase Storage
        // 3. Clean up S3 temporary file
        // 4. Update job with Firebase Storage URL

        // Placeholder: Update job as completed
        await db.collection('jobs').doc(jobId).update({
          status: 'completed',
          progress: 100,
          outputVideoUrl: videoUrl, // Will be Firebase Storage URL after implementation
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          metadata: {
            renderTime,
          },
        });

        functions.logger.info('Job marked as completed', { jobId });
      } else {
        // Render failed
        await db.collection('jobs').doc(jobId).update({
          status: 'failed',
          error: {
            code: 'render_failed',
            message: error || 'Rendering failed',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
          },
        });

        functions.logger.error('Job marked as failed', { jobId, error });
      }

      res.status(200).json({ success: true });
    } catch (error) {
      functions.logger.error('Error handling render complete', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);
