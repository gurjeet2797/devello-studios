import aiService from '../../../../lib/aiService.js';
import { createLogger } from '../../../../lib/logger.js';
import { requireUserFromBearer } from '../../../../lib/auth/requireUserFromBearer.js';
import { storeExternalImageToSupabase } from '../../../../lib/images/ingest.js';

const logger = createLogger('ios-jobs');

const handler = async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    await requireUserFromBearer(req);
    const { id } = req.query || {};

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ ok: false, error: 'job_id is required' });
    }

    const prediction = await aiService.getPrediction(id);

    if (['starting', 'processing'].includes(prediction.status)) {
      return res.status(202).json({ ok: true, status: 'processing', job_id: id });
    }

    if (['failed', 'error', 'canceled'].includes(prediction.status)) {
      return res.status(500).json({ ok: false, status: prediction.status, error: 'Image processing failed' });
    }

    const output = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
    if (!output) {
      return res.status(500).json({ ok: false, error: 'Image processing did not return an output URL' });
    }

    const storedOutput = await storeExternalImageToSupabase({ imageUrl: output });

    return res.status(200).json({
      ok: true,
      status: 'succeeded',
      output_url: storedOutput.outputUrl,
      request_id: prediction.id
    });
  } catch (error) {
    const status = error.status || 500;
    const code = error.code || 'IOS_JOB_ERROR';
    const message = error.message || 'Failed to check job status';

    logger.error('iOS job status failed', {
      status,
      code,
      message
    });

    return res.status(status).json({ ok: false, error: message, code });
  }
};

export default handler;
