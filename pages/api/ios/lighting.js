import { createLogger } from '../../../lib/logger.js';
import { requireUserFromBearer } from '../../../lib/auth/requireUserFromBearer.js';
import { runLightingIOS } from '../../../lib/iosrequests/index.js';
import { ingestImageFromRequest } from '../../../lib/images/ingest.js';

const logger = createLogger('ios-lighting');

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
    const style = body?.style;

    const result = await runLightingIOS({
      userId,
      inputImage: { imageUrl },
      style
    });

    logger.info('iOS lighting request received', {
      userId,
      email,
      style,
      ok: result.ok
    });

    if (result.status === 'processing') {
      return res.status(202).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    const status = error.status || 500;
    const code = error.code || 'IOS_LIGHTING_ERROR';
    const message = error.message || 'Failed to handle iOS lighting request';

    logger.error('iOS lighting request failed', {
      status,
      code,
      message
    });

    return res.status(status).json({ ok: false, error: message, code });
  }
};

export default handler;
