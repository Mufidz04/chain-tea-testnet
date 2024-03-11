const { PDFDocument, rgb, degrees } = require('pdf-lib');
const fs = require('fs/promises');
const Jimp = require('jimp'); // For image dimensions
const path = require('path'); // For path manipulation

const imagePaths = process.argv.slice(2); // Get image paths from command-line

async function convertImageToPdf(imagePath, outputPath) {
    try {
        // Read the image file asynchronously
        const imageData = await fs.promises.readFile(imagePath);

        // Create a new PDF document
        const pdfDoc = await PDFDocument.create();

        // Extract image name and directory for dynamic output
        const imageName = path.basename(imagePath);
        const outputDir = path.dirname(imagePath);

        // Determine page size based on image dimensions
        const imageDimensions = await Jimp.read(imagePath);
        const page = pdfDoc.addPage([imageDimensions.width, imageDimensions.height]);

        // Embed the image into the PDF document
        const image = await pdfDoc.embedPng(imageData);

        // Draw the image on the page, considering aspect ratio and positioning
        const { width, height } = image.scaleFactor;
        const maxHeight = page.getHeight();
        const maxWidth = page.getWidth();
        let adjustedWidth = width;
        let adjustedHeight = height;

        if (width > maxWidth || height > maxHeight) {
            const aspectRatio = width / height;

            if (aspectRatio > maxWidth / maxHeight) {
                adjustedWidth = maxWidth;
                adjustedHeight = adjustedWidth / aspectRatio;
            } else {
                adjustedHeight = maxHeight;
                adjustedWidth = adjustedHeight * aspectRatio;
            }
        }

        page.drawImage(image, {
            x: (page.getWidth() - adjustedWidth) / 2,
            y: (page.getHeight() - adjustedHeight) / 2,
            width: adjustedWidth,
            height: adjustedHeight,
        });

        // Save the PDF document in the appropriate location
        const pdfBuffer = await pdfDoc.save();
        await fs.promises.writeFile(path.join(outputDir, `${imageName}.pdf`), pdfBuffer);

        console.log(`Image "${imageName}" converted to PDF successfully!`);
    } catch (error) {
        console.error(`Error converting image "${imagePath}":`, error);
    }
}

async function processImages() {
    for (const imagePath of imagePaths) {
        await convertImageToPdf(imagePath);
    }
}

processImages();
