const express = require('express');
const {bundle} = require('@remotion/bundler');
const {renderMedia, getCompositions} = require('@remotion/renderer');
const path = require('path');
const os = require('os');
const fs = require('fs');

const app = express();
app.use(express.json({limit: '50mb'}));

const PORT = process.env.PORT || 8080;
const BUNDLE_CACHE = new Map();

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({status: 'healthy', timestamp: new Date().toISOString()});
});

/**
 * Render video endpoint
 * POST /render
 * Body: {
 *   serveUrl: string,
 *   composition: string,
 *   inputProps: object
 * }
 */
app.post('/render', async (req, res) => {
  const {serveUrl, composition, inputProps} = req.body;

  if (!serveUrl || !composition || !inputProps) {
    return res.status(400).json({
      error: 'Missing required fields: serveUrl, composition, inputProps',
    });
  }

  console.log('Render request received', {
    serveUrl,
    composition,
    inputPropsKeys: Object.keys(inputProps),
  });

  try {
    // Create temporary directory for output
    const tmpDir = os.tmpdir();
    const outputPath = path.join(tmpDir, `${Date.now()}.mp4`);

    console.log('Starting render', {outputPath, serveUrl, composition});

    // Render the video
    await renderMedia({
      serveUrl,
      composition,
      codec: 'h264',
      inputProps,
      outputLocation: outputPath,
      onProgress: ({progress}) => {
        console.log(`Render progress: ${Math.round(progress * 100)}%`);
      },
    });

    console.log('Render completed', {outputPath});

    // Read the rendered file
    const videoBuffer = fs.readFileSync(outputPath);

    // Clean up
    fs.unlinkSync(outputPath);

    // Return video as base64
    const base64Video = videoBuffer.toString('base64');

    res.json({
      success: true,
      video: base64Video,
      size: videoBuffer.length,
    });
  } catch (error) {
    console.error('Render error:', error);
    res.status(500).json({
      error: 'Render failed',
      message: error.message,
      stack: error.stack,
    });
  }
});

/**
 * Get compositions from a bundle
 * POST /compositions
 * Body: { serveUrl: string }
 */
app.post('/compositions', async (req, res) => {
  const {serveUrl} = req.body;

  if (!serveUrl) {
    return res.status(400).json({error: 'Missing required field: serveUrl'});
  }

  try {
    const compositions = await getCompositions(serveUrl);
    res.json({compositions});
  } catch (error) {
    console.error('Get compositions error:', error);
    res.status(500).json({
      error: 'Failed to get compositions',
      message: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Remotion Cloud Run service listening on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Render endpoint: http://localhost:${PORT}/render`);
});
