import { useRef, useEffect } from "react";

export default function DetailedSpectrumCanvas({
  analyser,
  maxFreq = 2349,
  harmonicBaseFreq = null,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!analyser) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const freqData = new Uint8Array(analyser.frequencyBinCount);

    const draw = () => {
      requestAnimationFrame(draw);
      analyser.getByteFrequencyData(freqData);

      const nyquist = analyser.context.sampleRate / 2;
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < freqData.length; i++) {
        const freq = (i * nyquist) / freqData.length;
        if (freq > maxFreq) break;
        const barHeight = freqData[i];
        const x = (freq / maxFreq) * canvas.width;
        ctx.fillStyle = `rgb(${barHeight + 100},50,50)`;
        ctx.fillRect(x, canvas.height - barHeight / 2, 2, barHeight / 2);
      }

      // Vykreslení harmonických
      if (harmonicBaseFreq) {
        for (let h = 1; h * harmonicBaseFreq <= maxFreq; h++) {
          const harmonicFreq = h * harmonicBaseFreq;
          const x = (harmonicFreq / maxFreq) * canvas.width;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.strokeStyle = h === 1 ? "cyan" : "rgba(0,255,255,0.3)";
          ctx.lineWidth = h === 1 ? 2 : 1;
          ctx.stroke();
        }
      }
    };

    draw();
  }, [analyser, maxFreq, harmonicBaseFreq]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={200}
      style={{ border: "1px solid #ccc" }}
    />
  );
}
