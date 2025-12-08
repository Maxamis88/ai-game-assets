export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const { prompt, size } = req.body || {};

  if (!prompt || !size) {
    return res.status(400).json({ error: 'Missing prompt or size' });
  }

  try {
    const hfResponse = await fetch(
      'https://api-inference.huggingface.co/models/nerijs/pixel-art-xl',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HF_TOKEN}`,
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

    res.setHeader('Content-Type', 'image/png');
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('AI Error:', error);
    res.status(500).json({ error: error.message });
  }
}
