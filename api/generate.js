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
    const hfResponse = await fetch(
      'https://router.huggingface.co/pixelparty/pixel-psrty-xl',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
          'Content-Type': 'application/json' 
      },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            width: size,
            height: size,
            num_inference_steps: 20,
            guidance_scale: 7.5
          }
        })
      }
    );

    if (!hfResponse.ok) {
      const text = await hfResponse.text();
      throw new Error(`HF API ${hfResponse.status}: ${text}`);
    }

    const blob = await hfResponse.blob();
    const buffer = await blob.arrayBuffer();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'image/png');
    res.send(Buffer.from(buffer));
  } catch (error) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ error: error.message });
  }
}
