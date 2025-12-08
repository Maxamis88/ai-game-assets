// Hides HF token server-side. Deploy to vercel.com
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { prompt, size } = req.body;
  
  if (!prompt || !size) {
    return res.status(400).json({ error: 'Missing prompt or size' });
  }

  try {
    // YOUR SECRET HF TOKEN (hidden in Vercel dashboard)
    const response = await fetch('https://api-inference.huggingface.co/models/nerijs/pixel-art-xl', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HF_TOKEN}`,  // ← SECRET
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
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI API failed: ${response.status} - ${errorText}`);
    }

    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();
    
    // Send image back to frontend
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(Buffer.from(buffer));
    
  } catch (error) {
    console.error('AI Generation Error:', error);
    res.status(500).json({ error: error.message });
  }
}