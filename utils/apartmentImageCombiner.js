import sharp from 'sharp';
import axios from 'axios';

export async function combineApartmentImages(photos) {
    try {
        if (!photos || photos.length === 0) {
            throw new Error('No photos provided');
        }

        const photosToProcess = photos.slice(0, 4);
        
        const imageBuffers = await Promise.all(
            photosToProcess.map(async (photoUrl) => {
                const response = await axios.get(photoUrl, { responseType: 'arraybuffer' });
                return Buffer.from(response.data);
            })
        );

        const gridSize = Math.ceil(Math.sqrt(photosToProcess.length));
        const cellSize = 800;
        const canvasSize = cellSize * gridSize;

        // Створюємо порожній canvas
        const canvas = sharp({
            create: {
                width: canvasSize,
                height: canvasSize,
                channels: 4,
                background: { r: 255, g: 255, b: 255, alpha: 1 }
            }
        });

        // Обробляємо кожну фотографію
        const processedImages = await Promise.all(
            imageBuffers.map(async (buffer) => {
                return sharp(buffer)
                    .resize(cellSize, cellSize, {
                        fit: 'cover',
                        position: 'center'
                    })
                    .toBuffer();
            })
        );

        const composite = [];
        for (let i = 0; i < processedImages.length; i++) {
            const row = Math.floor(i / gridSize);
            const col = i % gridSize;
            composite.push({
                input: processedImages[i],
                top: row * cellSize,
                left: col * cellSize
            });
        }

        if (processedImages.length < 4) {
            const emptyCells = 4 - processedImages.length;
            for (let i = 0; i < emptyCells; i++) {
                const row = Math.floor((processedImages.length + i) / gridSize);
                const col = (processedImages.length + i) % gridSize;
                composite.push({
                    input: {
                        create: {
                            width: cellSize,
                            height: cellSize,
                            channels: 4,
                            background: { r: 255, g: 255, b: 255, alpha: 1 }
                        }
                    },
                    top: row * cellSize,
                    left: col * cellSize
                });
            }
        }

        const finalImage = await canvas
            .composite(composite)
            .jpeg({ quality: 90 })
            .toBuffer();

        return finalImage;
    } catch (error) {
        console.error('Error combining apartment images:', error);
        throw error;
    }
}
