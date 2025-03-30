import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";
import { createCanvas, loadImage } from "canvas";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const logoPath = path.join(__dirname, "..", "public", "mttn.jpg");


export const generateQR = async (email, user) => {
  try {
    if (!user.id) {
      user.id = uuidv4();
    }

    const qrLink = `https://starbucks-mttn.vercel.app/congratulations?id=${user.id}`;

    const qrImage = await QRCode.toDataURL(qrLink, {
      errorCorrectionLevel: "H",
      width: 600,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    const canvas = createCanvas(600, 600);
    const ctx = canvas.getContext("2d");

    const qrImg = await loadImage(qrImage);
    ctx.drawImage(qrImg, 0, 0, 600, 600);

    let logoImg;
    try {
      logoImg = await loadImage(logoPath);
    } catch (logoError) {
      console.error("Failed to load logo:", logoError.message);
    }

    if (logoImg) {
      const logoSize = 220;
      const logoX = (canvas.width - logoSize) / 2;
      const logoY = (canvas.height - logoSize) / 2;

      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(logoX - 5, logoY - 5, logoSize + 10, logoSize + 10);

      ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
    }

    const qrBufferFinal = canvas.toBuffer("image/png");
    const finalImage = canvas.toDataURL("image/png");

    return { qrImage: finalImage, qrBufferFinal, qrLink, uuid: user.id };
  } catch (error) {
    throw new Error("Error generating QR Code with logo: " + error.message);
  }
};
