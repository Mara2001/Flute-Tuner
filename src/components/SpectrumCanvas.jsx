import { useRef, useEffect } from "react";

export default function SpectrumCanvas({ analyser }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!analyser) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const freqData = new Uint8Array(analyser.frequencyBinCount);

    const draw = () => {
      requestAnimationFrame(draw);
      analyser.getByteFrequencyData(freqData);

      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / freqData.length) * 2.5;
      let x = 0;
      for (let i = 0; i < freqData.length; i++) {
        const barHeight = freqData[i];
        ctx.fillStyle = `rgb(${barHeight + 100},50,50)`;
        ctx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);
        x += barWidth + 1;
      }
    };

    draw();
  }, [analyser]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={200}
      style={{ border: "1px solid #ccc" }}
    />
  );
}
