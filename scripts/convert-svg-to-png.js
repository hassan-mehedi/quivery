import sharp from 'sharp';
import path from 'path';

const inputSvg = path.join(__dirname, '../public/logo.svg');
const outputPng = path.join(__dirname, '../public/logo.png');

async function convertSvgToPng() {
  await sharp(inputSvg).resize(512, 512).png().toFile(outputPng);

  console.log('Converted logo.svg to logo.png (512x512)');
}

convertSvgToPng().catch(console.error);
