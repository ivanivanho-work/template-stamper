import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { renderMediaOnLambda } from '@remotion/lambda/client';

const db = admin.firestore();
const storage = admin.storage();

/**
 * Trigger Remotion Lambda rendering when a job is created
 * Firestore trigger: onCreate('jobs/{jobId}')
 */
export const triggerRemotionRender = functions.firestore
  .document('jobs/{jobId}')
  .onCreate(async (snap, context) => {
    const jobId = context.params.jobId;
    const jobData = snap.data();

    functions.logger.info('Job created, triggering render', { jobId, jobData });

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

      // 4. Call Remotion Lambda SDK to start render
      const functionName =
        process.env.REMOTION_FUNCTION_NAME || 'remotion-render-main';
      const region = (process.env.AWS_REGION || 'us-east-1') as
        | 'us-east-1'
        | 'us-west-2'
        | 'eu-central-1'
        | 'ap-south-1'
        | 'ap-southeast-1'
        | 'ap-southeast-2'
        | 'ap-northeast-1'
        | 'eu-west-1'
        | 'us-east-2';

      functions.logger.info('Starting Remotion render', {
        jobId,
        functionName,
        region,
        composition: template.remotionCompositionId,
      });

      // Trigger Lambda render
      const renderResponse = await renderMediaOnLambda({
        region,
        functionName,
        serveUrl: template.remotionServeUrl,
        composition: template.remotionCompositionId,
        inputProps: {
          ...inputProps,
          assets: assetsWithSignedUrls,
        },
        codec: 'h264',
        imageFormat: 'jpeg',
        privacy: 'public',
        webhook: {
          url: `${functions.config().project.url}/handleRenderComplete`,
          secret: process.env.WEBHOOK_SECRET || 'dev-secret',
          customData: {
            jobId,
          },
        },
      });

      // 5. Update job status to 'rendering'
      await db.collection('jobs').doc(jobId).update({
        status: 'rendering',
        startedAt: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
          remotionRenderId: renderResponse.renderId,
          remotionBucketName: renderResponse.bucketName,
        },
      });

      functions.logger.info('Remotion render started successfully', {
        jobId,
        renderId: renderResponse.renderId,
      });
    } catch (error) {
      functions.logger.error('Error triggering render', { jobId, error });

      await db.collection('jobs').doc(jobId).update({
        status: 'failed',
        error: {
          code: 'render_trigger_failed',
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
