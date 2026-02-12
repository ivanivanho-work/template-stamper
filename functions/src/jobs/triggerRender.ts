import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {renderMedia} from '@remotion/renderer';
import path from 'path';
import os from 'os';
import fs from 'fs';

const db = admin.firestore();
const storage = admin.storage();

/**
 * Trigger Remotion rendering when a job is created
 * Firestore trigger: onCreate('jobs/{jobId}')
 *
 * Now renders directly in Cloud Functions using @remotion/renderer
 */
export const triggerRemotionRender = functions
  .runWith({
    timeoutSeconds: 540, // 9 minutes max for Cloud Functions
    memory: '8GB',
  })
  .firestore.document('jobs/{jobId}')
  .onCreate(async (snap, context) => {
    const jobId = context.params.jobId;
    const jobData = snap.data();

    functions.logger.info('Job created, triggering render', {jobId, jobData});

    try {
      // 1. Fetch template configuration
      const templateDoc = await db
        .collection('templates')
        .doc(jobData.templateId)
        .get();

      if (!templateDoc.exists) {
        throw new Error(`Template ${jobData.templateId} not found`);
      }

      const template = templateDoc.data();

      if (!template) {
        throw new Error(`Template ${jobData.templateId} has no data`);
      }

      // 2. Prepare input props from assetMappings
      const inputProps = await prepareInputProps(
        jobData.assetMappings,
        template
      );

      // 3. Generate signed URLs for assets (valid for 1 hour)
      const assetsWithSignedUrls = await generateSignedUrls(
        jobData.assetMappings
      );

      // 4. Update job status to 'rendering'
      await db.collection('jobs').doc(jobId).update({
        status: 'rendering',
        startedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      functions.logger.info('Starting Remotion render', {
        jobId,
        composition: template.remotionCompositionId,
        serveUrl: template.remotionServeUrl,
      });

      // 5. Create temporary directory for output
      const tmpDir = os.tmpdir();
      const outputPath = path.join(tmpDir, `${jobId}.mp4`);

      // 6. Render the video using @remotion/renderer
      await renderMedia({
        serveUrl: template.remotionServeUrl,
        composition: template.remotionCompositionId,
        codec: 'h264',
        inputProps: {
          ...inputProps,
          ...assetsWithSignedUrls,
        },
        outputLocation: outputPath,
        onProgress: ({progress}) => {
          // Update progress in Firestore
          db.collection('jobs')
            .doc(jobId)
            .update({
              progress: Math.round(progress * 100),
            })
            .catch((err) =>
              functions.logger.error('Failed to update progress', err)
            );
        },
      });

      functions.logger.info('Render completed, uploading to storage', {
        jobId,
        outputPath,
      });

      // 7. Upload rendered video to Cloud Storage
      const firebaseStoragePath = `videos/${jobId}/output.mp4`;
      const bucket = storage.bucket();
      const file = bucket.file(firebaseStoragePath);

      await bucket.upload(outputPath, {
        destination: firebaseStoragePath,
        metadata: {
          contentType: 'video/mp4',
          metadata: {
            jobId,
            templateId: template.id,
            renderedAt: new Date().toISOString(),
          },
        },
      });

      // 8. Get signed URL for the video (1 year expiry)
      const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 365 * 24 * 60 * 60 * 1000,
      });

      // 9. Clean up temporary file
      fs.unlinkSync(outputPath);

      // 10. Update job as completed
      await db.collection('jobs').doc(jobId).update({
        status: 'completed',
        progress: 100,
        outputVideoUrl: `gs://${bucket.name}/${firebaseStoragePath}`,
        outputVideoPublicUrl: signedUrl,
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      functions.logger.info('Job completed successfully', {
        jobId,
        outputVideoUrl: signedUrl,
      });
    } catch (error) {
      functions.logger.error('Error triggering render', {jobId, error});

      await db.collection('jobs').doc(jobId).update({
        status: 'failed',
        error: {
          code: 'render_failed',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        },
      });
    }
  });

/**
 * Prepare input props for Remotion template from asset mappings
 */
async function prepareInputProps(
  assetMappings: any[],
  template: any
): Promise<Record<string, any>> {
  const props: Record<string, any> = {};

  for (const mapping of assetMappings) {
    const slot = template.slots.find((s: any) => s.id === mapping.slotId);
    if (slot) {
      props[slot.id] = mapping.assetUrl;
    }
  }

  return props;
}

/**
 * Generate signed URLs for assets (valid for 1 hour)
 */
async function generateSignedUrls(
  assetMappings: any[]
): Promise<Record<string, string>> {
  const bucket = storage.bucket();
  const signedUrls: Record<string, string> = {};

  for (const mapping of assetMappings) {
    const filePath = mapping.assetUrl.replace('gs://' + bucket.name + '/', '');
    const file = bucket.file(filePath);

    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
    });

    signedUrls[mapping.slotId] = url;
  }

  return signedUrls;
}
