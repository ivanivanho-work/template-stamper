import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Trigger Remotion Lambda rendering when a job is created
 * Firestore trigger: onCreate('jobs/{jobId}')
 *
 * TODO: Implement Remotion Lambda integration in Phase 1 (AWS setup required)
 */
export const triggerRemotionRender = functions.firestore
  .document('jobs/{jobId}')
  .onCreate(async (snap, context) => {
    const jobId = context.params.jobId;
    const jobData = snap.data();

    functions.logger.info('Job created, triggering render', { jobId, jobData });

    try {
      // TODO: Phase 1 - Implement Remotion Lambda trigger
      // 1. Fetch template configuration
      // 2. Prepare input props from assetMappings
      // 3. Call Remotion Lambda SDK to start render
      // 4. Update job status to 'rendering'

      // Placeholder: Mark as rendering (will be replaced with actual Remotion call)
      await db.collection('jobs').doc(jobId).update({
        status: 'rendering',
        startedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      functions.logger.info('Job status updated to rendering', { jobId });
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
