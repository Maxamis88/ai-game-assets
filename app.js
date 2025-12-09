const API_URL = 'https://ai-game-assets-api.vercel.app/api/generate';

const sizePrompts = {
  8: ', 8x8 pixel art, tiny retro sprite, 1-bit',
  16: ', 16x16 pixel art, gameboy sprite, 4-color',
  32: ', 32x32 pixel art, classic retro game',
  64: ', 64x64 pixel art, top-down RPG sprite',
  128: ', 128x128 pixel art, detailed HD sprite'
};

document.addEventListener('DOMContentLoaded', () => {
  const generateBtn = document.getElementById('generateBtn');
  const promptInput = document.getElementById('promptInput');
  const sizeSelect = document.getElementById('sizeSelect');
  const status = document.getElementById('status');
  const previewContainer = document.getElementById('previewContainer');
  const previewCanvas = document.getElementById('previewCanvas');
  const downloads = document.getElementById('downloads');

  generateBtn.addEventListener('click', async () => {
    const prompt = promptInput.value.trim();
    const size = parseInt(sizeSelect.value, 10);

    if (!prompt) {
      status.textContent = '⚠️ Enter a prompt';
      return;
    }

    generateBtn.disabled = true;
    generateBtn.textContent = '⏳ AI Generating...';
    status.textContent = `🎨 Creating ${size}x${size} sprite...`;
    previewContainer.style.display = 'none';
    downloads.innerHTML = '';

    try {
      const fullPrompt = `${prompt}${sizePrompts[size]}`;

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: fullPrompt, size })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `API ${response.status}`);
      }

      const blob = await response.blob();
      const imgUrl = URL.createObjectURL(blob);

      const img = new Image();
      img.onload = () => {
        const scale = Math.min(256 / size, 4);
        const w = size * scale;
        const h = size * scale;

        previewCanvas.width = w;
        previewCanvas.height = h;
        const ctx = previewCanvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, w, h);

        const jsonData = {
          meta: {
            app: 'AI Game Assets',
            format: 'RGBA8888',
            size: { w: size, h: size },
            scale: '1'
          },
          frames: [
            {
              filename: `${size}x${size}-sprite.png`,
              frame: { x: 0, y: 0, w: size, h: size },
              sourceSize: { w: size, h: size }
            }
          ]
        };

        downloads.innerHTML = `
          <a href="${previewCanvas.toDataURL('image/png')}"
             download="${size}x${size}-gdevelop.png"
             class="download-btn">
             🖼️ ${size}x${size} PNG (GDevelop)
          </a>
          <a href="${URL.createObjectURL(
            new Blob([JSON.stringify(jsonData, null, 2)], {
              type: 'application/json'
            })
          )}"
             download="${size}x${size}-gdevelop.json"
             class="download-btn">
             📄 ${size}x${size} JSON
          </a>
        `;

        status.textContent = `✅ ${size}x${size} sprite ready!`;
        previewContainer.style.display = 'block';
        URL.revokeObjectURL(imgUrl);
      };

      img.onerror = () => {
        throw new Error('Invalid image from backend');
      };

      img.src = imgUrl;
    } catch (err) {
      status.textContent = `❌ Error: ${err.message}`;
      console.error(err);
    }

    generateBtn.disabled = false;
    generateBtn.textContent = '🎨 Generate Sprite';
  });
});
