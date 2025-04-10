import { useEffect, useRef, useState } from "react";
import {
  smartAutocorrelate,
  getNoteData,
  generateIdealSpectrum,
  computeToneQuality,
} from "./utils";

export default function useTuner() {
  const [volumeDb, setVolumeDb] = useState(0);
  const [dynamicMark, setDynamicMark] = useState("mf");
  const [dominantFreq, setDominantFreq] = useState(0);
  const [purity, setPurity] = useState(0);
  const [noteName, setNoteName] = useState("A4");
  const [referenceFreq, setReferenceFreq] = useState(440);
  const [cents, setCents] = useState(0);
  const [pythaCents, setPythaCents] = useState(0);
  const [analyser, setAnalyser] = useState(null);
  const [bufferLength, setBufferLength] = useState(2048);
  const [pythaAlternativesState, setPythaAlternativesState] = useState([]);

  const volumeHistory = useRef([]);
  const freqHistory = useRef([]);
  const WINDOW_MS = 250;
  const lastUpdate = useRef(0);

  useEffect(() => {
    const initAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const audioContext = new (window.AudioContext ||
          window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(stream);
        const analyserNode = audioContext.createAnalyser();
        analyserNode.fftSize = bufferLength;
        source.connect(analyserNode);
        setAnalyser(analyserNode);

        const timeData = new Uint8Array(bufferLength);
        const freqData = new Uint8Array(analyserNode.frequencyBinCount);

        const draw = () => {
          requestAnimationFrame(draw);
          const now = Date.now();

          analyserNode.getByteTimeDomainData(timeData);
          analyserNode.getByteFrequencyData(freqData);

          // RMS a hlasitost
          let sumSquares = 0;
          for (let i = 0; i < bufferLength; i++) {
            const val = timeData[i] - 128;
            sumSquares += val * val;
          }
          const rms = Math.sqrt(sumSquares / bufferLength);
          const db = 20 * Math.log10(rms / 128);
          volumeHistory.current.push({ value: db, time: now });
          volumeHistory.current = volumeHistory.current.filter(
            (item) => now - item.time <= WINDOW_MS
          );

          // FFT peak detection
          const nyquist = audioContext.sampleRate / 2;
          let maxVal = -1,
            maxIndex = -1;
          for (let i = 0; i < freqData.length; i++) {
            if (freqData[i] > maxVal) {
              maxVal = freqData[i];
              maxIndex = i;
            }
          }
          const fftFreq = (maxIndex * nyquist) / freqData.length;

          const fftFreqClamped = Math.min(2349, Math.max(261, fftFreq));
          const smartFreq = smartAutocorrelate(
            timeData,
            audioContext.sampleRate,
            fftFreqClamped
          );
          if (smartFreq > 0) {
            freqHistory.current.push({ value: smartFreq, time: now });
            freqHistory.current = freqHistory.current.filter(
              (item) => now - item.time <= WINDOW_MS
            );
          }

          if (
            now - lastUpdate.current > WINDOW_MS &&
            freqHistory.current.length > 0
          ) {
            const avgFreq =
              freqHistory.current.reduce((a, b) => a + b.value, 0) /
              freqHistory.current.length;
            const avgDb =
              volumeHistory.current.reduce((a, b) => a + b.value, 0) /
              volumeHistory.current.length;

            const { note, refFreq, cents, pythaCents, pythaAlternatives } =
              getNoteData(avgFreq);

            // Výpočet kvality tónu na základě spektra
            const freqs = Array.from(
              { length: freqData.length },
              (_, i) => (i * nyquist) / freqData.length
            );
            const normalizedFreqData = Array.from(freqData).map((x) => x / 255);
            const idealSpectrum = generateIdealSpectrum(freqs, fftFreqClamped);
            const toneQuality = computeToneQuality(
              normalizedFreqData,
              idealSpectrum
            );

            setVolumeDb(avgDb.toFixed(1));
            setDynamicMark(
              avgDb < -40
                ? "pp"
                : avgDb < -30
                ? "p"
                : avgDb < -20
                ? "mp"
                : avgDb < -10
                ? "mf"
                : avgDb < 0
                ? "f"
                : "ff"
            );
            setPurity(toneQuality.toFixed(1));
            setDominantFreq(avgFreq.toFixed(1));
            setNoteName(note);
            setReferenceFreq(refFreq.toFixed(1));
            setCents(cents.toFixed(1));
            setPythaCents(pythaCents.toFixed(1));
            setPythaAlternativesState(pythaAlternatives);
            lastUpdate.current = now;
          }
        };

        draw();
      } catch (err) {
        console.error("Nelze získat mikrofon:", err);
      }
    };

    initAudio();
  }, []);

  return {
    analyser,
    bufferLength,
    volumeDb,
    dynamicMark,
    dominantFreq,
    purity,
    noteName,
    referenceFreq,
    cents,
    pythaCents,
    pythaAlternatives: pythaAlternativesState,
  };
}
