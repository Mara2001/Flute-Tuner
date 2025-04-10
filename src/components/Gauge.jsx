import { useRef, useEffect } from "react";

export default function Gauge({
  cents,
  referenceFreq,
  pythaAlternatives,
  pythaCents,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const centerX = canvas.width / 2;
    const centerY = canvas.height * 0.9;
    const radius = 100;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI, 2 * Math.PI);
    ctx.strokeStyle = "#ccc";
    ctx.lineWidth = 8;
    ctx.stroke();

    const drawNeedle = (angle, color, width) => {
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + radius * Math.sin(angle),
        centerY - radius * Math.cos(angle)
      );
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.stroke();
    };

    // Červená ručička – aktuální ladění
    const angle = (cents / 100) * (Math.PI / 2);
    drawNeedle(angle, "red", 3);

    // Modré ručičky – pythagorejské frekvence
    if (pythaAlternatives.length > 0) {
      pythaAlternatives.forEach(({ freq }) => {
        const centsDiff = 1200 * Math.log2(freq / referenceFreq);
        const pythaAngle = (centsDiff / 100) * (Math.PI / 2);
        drawNeedle(pythaAngle, "blue", 2);
      });
    } else {
      const pythaAngle = (pythaCents / 100) * (Math.PI / 2);
      drawNeedle(pythaAngle, "blue", 2);
    }

    ctx.font = "12px sans-serif";
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.fillText("-100", centerX - radius, centerY);
    ctx.fillText("0", centerX, centerY - radius - 10);
    ctx.fillText("+100", centerX + radius, centerY);
  }, [cents, referenceFreq, pythaAlternatives, pythaCents]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={150}
      style={{ display: "block", margin: "10px auto" }}
    />
  );
}
