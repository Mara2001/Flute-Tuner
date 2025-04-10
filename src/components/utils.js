export function smartAutocorrelate(
  buffer,
  sampleRate,
  fftFreq,
  tolerancePercent = 0.2
) {
  const SIZE = buffer.length;
  const MAX_SAMPLES = Math.floor(SIZE / 2);
  let bestOffset = -1;
  let bestCorrelation = 0;
  let rms = 0;

  for (let i = 0; i < SIZE; i++) {
    const val = buffer[i] / 128 - 1;
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1;

  const fLow = fftFreq * (1 - tolerancePercent);
  const fHigh = fftFreq * (1 + tolerancePercent);
  const minOffset = Math.max(1, Math.floor(sampleRate / fHigh));
  const maxOffset = Math.floor(sampleRate / fLow);

  for (let offset = minOffset; offset <= maxOffset; offset++) {
    let correlation = 0;
    for (let i = 0; i < MAX_SAMPLES; i++) {
      correlation += Math.abs(
        buffer[i] / 128 - 1 - (buffer[i + offset] / 128 - 1)
      );
    }
    correlation = 1 - correlation / MAX_SAMPLES;
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestOffset = offset;
    }
  }

  return bestCorrelation > 0.9 && bestOffset !== -1
    ? sampleRate / bestOffset
    : -1;
}

export function generateIdealSpectrum(freqs, f0, p = 1.5, sigma = 8.5, N = 8) {
  return freqs.map((f) => {
    let sum = 0;
    for (let n = 1; n <= N; n++) {
      const A_n = 1 / Math.pow(n, p);
      const delta = f - n * f0;
      sum += A_n * Math.exp(-(delta * delta) / (2 * sigma * sigma));
    }
    return sum;
  });
}

export function computeToneQuality(actual, ideal) {
  const norm = (v) =>
    Math.sqrt(v.reduce((acc, val) => acc + val * val, 0)) + 1e-8;

  const dot = actual.reduce((acc, val, i) => acc + val * ideal[i], 0);
  const sim = dot / (norm(actual) * norm(ideal));
  return sim * 100;
}

const toneSteps = {
  C: 0,
  Cis: 7,
  Des: -5,
  D: 2,
  Dis: 9,
  Es: -3,
  E: 4,
  F: -1,
  Fis: 6,
  Ges: -6,
  G: 1,
  Gis: 8,
  As: -4,
  A: 3,
  Ais: 10,
  B: -2,
  H: 5,
};

const enharmonicMap = {
  "C#": "Cis",
  Db: "Des",
  "D#": "Dis",
  Eb: "Es",
  "F#": "Fis",
  Gb: "Ges",
  "G#": "Gis",
  Ab: "As",
  "A#": "Ais",
  Bb: "B",
  B: "H",
};

function pythagoreanRatio(steps) {
  let ratio = 1;
  for (let i = 0; i < Math.abs(steps); i++) {
    ratio *= steps > 0 ? 3 / 2 : 2 / 3;
  }
  while (ratio >= 2) ratio /= 2;
  while (ratio < 1) ratio *= 2;
  return ratio;
}

function getPythagoreanFrequency(referenceTone, referenceFreq, targetTone) {
  const refSteps = toneSteps[referenceTone];
  const targetSteps = toneSteps[targetTone];
  const stepsFromRef = targetSteps - refSteps;
  const ratio = pythagoreanRatio(stepsFromRef);
  return referenceFreq * ratio;
}

export function getNoteData(freq) {
  const noteNames = [
    "C",
    "Cis",
    "D",
    "Dis",
    "E",
    "F",
    "Fis",
    "G",
    "Gis",
    "A",
    "Ais",
    "H",
  ];

  const log2 = Math.log2(freq / 440);
  const semitonesFromA4 = Math.round(log2 * 12);
  const refFreq = 440 * Math.pow(2, semitonesFromA4 / 12);
  const noteIndex = (semitonesFromA4 + 9 + 12 * 1000) % 12;
  const octave = 4 + Math.floor((semitonesFromA4 + 9) / 12);
  const note = noteNames[noteIndex] + octave;
  const cents = 1200 * Math.log2(freq / refFreq);

  const simpleName = note.replace(/[0-9]/g, "");

  const enharmonicPairs = [
    ["Cis", "Des"],
    ["Dis", "Es"],
    ["Fis", "Ges"],
    ["Gis", "As"],
    ["Ais", "B"],
  ];

  const adjustToOctave = (baseFreq, baseName) => {
    const baseLog = Math.log2(baseFreq);
    const refLog = Math.log2(refFreq);
    let octaveDiff = Math.round(refLog - baseLog);
    return baseFreq * Math.pow(2, octaveDiff);
  };

  const pythaAlternatives = [];
  const pair = enharmonicPairs.find((pair) => pair.includes(simpleName));
  if (pair) {
    for (const name of pair) {
      const rawFreq = getPythagoreanFrequency("A", 440, name);
      const adjustedFreq = adjustToOctave(rawFreq, name);
      pythaAlternatives.push({ name, freq: adjustedFreq });
    }
  }

  const rawMainFreq = getPythagoreanFrequency("A", 440, simpleName);
  const mainFreq = adjustToOctave(rawMainFreq, simpleName);
  const pythaCents = 1200 * Math.log2(mainFreq / refFreq);

  return {
    note,
    refFreq,
    cents,
    pythaCents,
    pythaAlternatives,
  };
}
