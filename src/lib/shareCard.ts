import type { Startup } from "../types";

export function downloadTombstoneCard(startup: Startup): void {
  const canvas = document.createElement("canvas");
  const scale = window.devicePixelRatio || 1;
  canvas.width = 1200 * scale;
  canvas.height = 630 * scale;

  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  context.scale(scale, scale);
  drawBackground(context);
  drawTombstone(context, startup);

  canvas.toBlob((blob) => {
    if (!blob) {
      return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${startup.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-tombstone.png`;
    link.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}

function drawBackground(context: CanvasRenderingContext2D): void {
  const gradient = context.createLinearGradient(0, 0, 0, 630);
  gradient.addColorStop(0, "#0a0808");
  gradient.addColorStop(0.58, "#1a1218");
  gradient.addColorStop(1, "#10150c");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 1200, 630);

  context.fillStyle = "rgba(180, 180, 200, 0.1)";
  for (let i = 0; i < 7; i += 1) {
    context.beginPath();
    context.ellipse(160 + i * 160, 520 - (i % 2) * 35, 260, 42, 0, 0, Math.PI * 2);
    context.fill();
  }
}

function drawTombstone(context: CanvasRenderingContext2D, startup: Startup): void {
  context.save();
  context.translate(600, 348);

  context.fillStyle = "#3a3a42";
  context.strokeStyle = "#8b8b80";
  context.lineWidth = 5;
  roundedArch(context, -230, -250, 460, 430, 150);
  context.fill();
  context.stroke();

  context.textAlign = "center";
  context.fillStyle = "#d5d1b8";
  context.font = "700 54px Georgia";
  wrapText(context, startup.name, 0, -115, 340, 56);

  context.fillStyle = "#9a9a8a";
  context.font = "28px Georgia";
  wrapText(context, startup.tagline, 0, 15, 350, 34);

  context.fillStyle = "#1b1a1c";
  context.font = "700 26px monospace";
  context.fillText(startup.epitaph, 0, 150);

  context.restore();

  context.fillStyle = "#d5d1b8";
  context.font = "700 42px Georgia";
  context.textAlign = "center";
  context.fillText("STARTUP NAME GRAVEYARD", 600, 82);
}

function roundedArch(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  context.beginPath();
  context.moveTo(x, y + height);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height);
  context.closePath();
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): void {
  const words = text.split(" ");
  let line = "";

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (context.measureText(testLine).width > maxWidth && line) {
      context.fillText(line, x, y);
      line = word;
      y += lineHeight;
    } else {
      line = testLine;
    }
  }

  context.fillText(line, x, y);
}
