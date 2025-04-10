import useTuner from "./useTuner";
import WaveformCanvas from "./WaveformCanvas";
import SpectrumCanvas from "./SpectrumCanvas";
import DetailedSpectrumCanvas from "./DetailedSpectrumCanvas";
import Gauge from "./Gauge";

export default function Tuner() {
  const {
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
    pythaAlternatives,
  } = useTuner();

  return (
    <div>
      <h2>Ladička</h2>

      <p>Zvuková vlna (časová oblast):</p>
      <WaveformCanvas analyser={analyser} bufferLength={bufferLength} />

      <p>Frekvenční spektrum:</p>
      <SpectrumCanvas analyser={analyser} />

      <h3>Charakteristiky tónu</h3>
      <Gauge
        cents={parseFloat(cents)}
        referenceFreq={parseFloat(referenceFreq)}
        pythaCents={parseFloat(pythaCents)}
        pythaAlternatives={pythaAlternatives}
      />

      <p style={{ textAlign: "center", fontSize: "18px" }}>
        <strong>{noteName}</strong> ({referenceFreq} Hz)
      </p>
      {pythaAlternatives.length > 0 && (
        <div style={{ textAlign: "center", marginTop: "10px" }}>
          <strong>Enharmonické tóny a pythagorejské frekvence:</strong>
          <ul>
            {pythaAlternatives.map(({ name, freq }) => (
              <li key={name}>
                {name} ≈ {freq.toFixed(2)} Hz
              </li>
            ))}
          </ul>
        </div>
      )}

      <ul>
        <li>
          <strong>Hlasitost:</strong> {volumeDb} dB ({dynamicMark})
        </li>
        <li>
          <strong>Dominantní frekvence:</strong> {dominantFreq} Hz
        </li>
        <li>
          <strong>Čistota tónu:</strong> {purity} %
        </li>
      </ul>

      <p>Detailní spektrum (do D7):</p>
      <DetailedSpectrumCanvas
        analyser={analyser}
        harmonicBaseFreq={dominantFreq}
      />
    </div>
  );
}
