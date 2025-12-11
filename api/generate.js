export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(405).json({ error: 'POST only' });
  }

  const { prompt, size } = req.body || {};
  if (!prompt || !size) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(400).json({ error: 'Missing prompt or size' });
  }

  try {
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
      throw new Error('Missing REPLICATE_API_TOKEN');
    }

    // Replicate model: SDXL pixel-art style (example)
    const replicateResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: 'e12a4f76c9a54fda9df88e3e0eb4fd94', // example SDXL pixel art model version
        input: {
          prompt,
          width: size,
          height: size
        }
      })
    });

    if (!replicateResponse.ok) {
      const text = await replicateResponse.text();
      throw new Error(`Replicate ${replicateResponse.status}: ${text}`);
    }

    const prediction = await replicateResponse.json();

    // Poll until completed
    let result = prediction;
    const endpoint = `https://api.replicate.com/v1/predictions/${prediction.id}`;

    while (result.status === 'starting' || result.status === 'processing') {
      await new Promise(r => setTimeout(r, 2000));
      const pollRes = await fetch(endpoint, {
        headers: { Authorization: `Token ${token}` }
      });
      result = await pollRes.json();
    }

    if (result.status !== 'succeeded' || !result.output || !result.output[0]) {
      throw new Error(`Generation failed: ${JSON.stringify(result)}`);
    }

    const imageUrl = result.output[0];

    // Fetch image and proxy it back as PNG
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      throw new Error(`Image fetch failed: ${imgRes.status}`);
    }
    const buffer = Buffer.from(await imgRes.arrayBuffer());

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'image/png');
    res.send(buffer);
  } catch (error) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ error: error.message });
  }
}
