import { createLogger } from '../../../lib/logger.js';
import { requireUserFromBearer } from '../../../lib/auth/requireUserFromBearer.js';
import { runSingleEditIOS } from '../../../lib/iosrequests/index.js';
import { ingestImageFromRequest } from '../../../lib/images/ingest.js';

const logger = createLogger('ios-edit');

export const config = {
  api: {
    bodyParser: false
  }
};

const handler = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { userId, email } = await requireUserFromBearer(req);
    const { imageUrl, body } = await ingestImageFromRequest({ req });
    const prompt = body?.prompt;
    let hotspot = body?.hotspot;

    if (typeof hotspot === 'string') {
      try {
        hotspot = JSON.parse(hotspot);
      } catch (error) {
        hotspot = null;
      }
    }

    const result = await runSingleEditIOS({
      userId,
      inputImage: { imageUrl },
      hotspot,
      prompt
    });

    logger.info('iOS edit request received', {
      userId,
      email,
      ok: result.ok
    });

    if (result.status === 'processing') {
      return res.status(202).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    const status = error.status || 500;
    const code = error.code || 'IOS_EDIT_ERROR';
    const message = error.message || 'Failed to handle iOS edit request';

    logger.error('iOS edit request failed', {
      status,
      code,
      message
    });

    return res.status(status).json({ ok: false, error: message, code });
  }
};

export default handler;
