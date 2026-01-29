import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Request, Response } from 'express';
import https from 'https';

const db = admin.firestore();
const storage = admin.storage();

/**
 * Webhook handler for Remotion Lambda render completion
 * POST /handleRenderComplete
 *
 * Called by Remotion Lambda when rendering is complete
 */
export const handleRenderComplete = functions.https.onRequest(
  async (req: Request, res: Response) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      const { customData, outputFile, renderId, renderMetadata } = req.body;
      const jobId = customData?.jobId;

      if (!jobId) {
        res.status(400).json({ error: 'jobId is required in customData' });
        return;
      }

      functions.logger.info('Render complete webhook received', {
        jobId,
        renderId,
        outputFile,
      });

      if (outputFile) {
        // 1. Download video from S3
        functions.logger.info('Downloading video from S3', {
          jobId,
          s3Url: outputFile,
        });

        const videoBuffer = await downloadFromS3(outputFile);

        // 2. Upload to Firebase Storage
        const firebaseStoragePath = `videos/${jobId}/output.mp4`;
        const bucket = storage.bucket();
        const file = bucket.file(firebaseStoragePath);

        functions.logger.info('Uploading video to Firebase Storage', {
          jobId,
          path: firebaseStoragePath,
          sizeBytes: videoBuffer.length,
        });

        await file.save(videoBuffer, {
          contentType: 'video/mp4',
          metadata: {
            metadata: {
              renderId,
              renderTime: renderMetadata?.estimatedRenderLambdaInvokeCost || 0,
              uploadedAt: new Date().toISOString(),
            },
          },
        });

        // 3. Get public URL or signed URL
        const [firebaseUrl] = await file.getSignedUrl({
          action: 'read',
          expires: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
        });

        // 4. Update job with Firebase Storage URL
        await db.collection('jobs').doc(jobId).update({
          status: 'completed',
          progress: 100,
          outputVideoUrl: `gs://${bucket.name}/${firebaseStoragePath}`,
          outputVideoPublicUrl: firebaseUrl,
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          metadata: {
            remotionRenderId: renderId,
            renderTime: renderMetadata?.estimatedRenderLambdaInvokeCost || 0,
            videoSize: videoBuffer.length,
          },
        });

        functions.logger.info('Job completed successfully', {
          jobId,
          firebaseStoragePath,
          videoSize: videoBuffer.length,
        });

        // Note: S3 cleanup is handled by Remotion Lambda lifecycle policies
      } else {
        // Render failed
        await db.collection('jobs').doc(jobId).update({
          status: 'failed',
          error: {
            code: 'render_failed',
            message: req.body.errors?.[0] || 'Rendering failed',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
          },
        });

        functions.logger.error('Job marked as failed', {
          jobId,
          errors: req.body.errors,
        });
      }

      res.status(200).json({ success: true });
    } catch (error) {
      functions.logger.error('Error handling render complete', error);

      // Try to mark job as failed
      const jobId = req.body?.customData?.jobId;
      if (jobId) {
        await db.collection('jobs').doc(jobId).update({
          status: 'failed',
          error: {
            code: 'webhook_handler_error',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
          },
        });
      }

      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * Download video file from S3 URL
 */
async function downloadFromS3(s3Url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    https
      .get(s3Url, (response) => {
        if (response.statusCode !== 200) {
          reject(
            new Error(`Failed to download from S3: ${response.statusCode}`)
          );
          return;
        }

        response.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        response.on('end', () => {
          resolve(Buffer.concat(chunks));
        });

        response.on('error', (error) => {
          reject(error);
        });
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}
