import { useState, useEffect, useRef } from 'react';

const BackgroundMusic = () => {
  const [isMuted, setIsMuted] = useState(false);
  const audioContextRef = useRef(null);
  const oscillatorsRef = useRef([]);
  const gainNodeRef = useRef(null);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    // Initialize Web Audio API for rhythmic sci-fi music with beats
    const initAudio = () => {
      if (audioContextRef.current) return;

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext();

      // Create master gain node for volume control
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.gain.value = 0.2; // Slightly higher volume for beats
      gainNodeRef.current.connect(audioContextRef.current.destination);

      // Create rhythmic sci-fi music
      createRhythmicMusic();
    };

    const createRhythmicMusic = () => {
      if (!audioContextRef.current || isPlayingRef.current) return;
      isPlayingRef.current = true;

      const ctx = audioContextRef.current;
      const now = ctx.currentTime;

      // Clear any existing oscillators
      oscillatorsRef.current.forEach(osc => {
        try {
          osc.stop();
        } catch (e) {
          // Oscillator might already be stopped
        }
      });
      oscillatorsRef.current = [];

      // BASS DRUM - Four-on-the-floor kick pattern (120 BPM)
      const bpm = 120;
      const beatInterval = 60 / bpm; // 0.5 seconds per beat
      const createKick = (startTime) => {
        const kickOsc = ctx.createOscillator();
        kickOsc.frequency.value = 60; // Deep bass
        
        const kickGain = ctx.createGain();
        kickGain.gain.value = 0;
        
        // Envelope: quick attack, short decay
        kickGain.gain.setValueAtTime(0.3, startTime);
        kickGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
        
        // Pitch envelope for punch
        kickOsc.frequency.setValueAtTime(150, startTime);
        kickOsc.frequency.exponentialRampToValueAtTime(60, startTime + 0.1);
        
        kickOsc.connect(kickGain);
        kickGain.connect(gainNodeRef.current);
        
        kickOsc.start(startTime);
        kickOsc.stop(startTime + 0.3);
      };

      // Create kick pattern - every beat
      for (let i = 0; i < 32; i++) {
        createKick(now + (i * beatInterval));
      }

      // HI-HAT - Eighth notes for rhythm
      const createHiHat = (startTime) => {
        const hihatOsc = ctx.createOscillator();
        hihatOsc.type = 'square';
        hihatOsc.frequency.value = 10000;
        
        const hihatFilter = ctx.createBiquadFilter();
        hihatFilter.type = 'highpass';
        hihatFilter.frequency.value = 7000;
        
        const hihatGain = ctx.createGain();
        hihatGain.gain.value = 0;
        hihatGain.gain.setValueAtTime(0.08, startTime);
        hihatGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.05);
        
        hihatOsc.connect(hihatFilter);
        hihatFilter.connect(hihatGain);
        hihatGain.connect(gainNodeRef.current);
        
        hihatOsc.start(startTime);
        hihatOsc.stop(startTime + 0.1);
      };

      // Create hi-hat pattern - every half beat
      for (let i = 0; i < 64; i++) {
        createHiHat(now + (i * beatInterval / 2));
      }

      // SNARE - On beats 2 and 4
      const createSnare = (startTime) => {
        const snareOsc = ctx.createOscillator();
        snareOsc.type = 'triangle';
        snareOsc.frequency.value = 200;
        
        const snareNoise = ctx.createOscillator();
        snareNoise.type = 'square';
        snareNoise.frequency.value = 100;
        
        const snareFilter = ctx.createBiquadFilter();
        snareFilter.type = 'highpass';
        snareFilter.frequency.value = 2000;
        
        const snareGain = ctx.createGain();
        snareGain.gain.value = 0;
        snareGain.gain.setValueAtTime(0.15, startTime);
        snareGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
        
        snareOsc.connect(snareGain);
        snareNoise.connect(snareFilter);
        snareFilter.connect(snareGain);
        snareGain.connect(gainNodeRef.current);
        
        snareOsc.start(startTime);
        snareNoise.start(startTime);
        snareOsc.stop(startTime + 0.2);
        snareNoise.stop(startTime + 0.2);
      };

      // Create snare on beats 2 and 4 (backbeat)
      for (let i = 0; i < 16; i++) {
        createSnare(now + beatInterval + (i * beatInterval * 2));
      }

      // BASS SYNTH LINE - Pulsing bass line
      const bassNotes = [65.41, 65.41, 87.31, 65.41]; // C2, C2, F2, C2
      bassNotes.forEach((freq, index) => {
        const bassOsc = ctx.createOscillator();
        bassOsc.type = 'sawtooth';
        bassOsc.frequency.value = freq;
        
        const bassFilter = ctx.createBiquadFilter();
        bassFilter.type = 'lowpass';
        bassFilter.frequency.value = 400;
        bassFilter.Q.value = 5;
        
        const bassGain = ctx.createGain();
        bassGain.gain.value = 0;
        
        // Pulsing envelope
        for (let bar = 0; bar < 8; bar++) {
          const startTime = now + (bar * beatInterval * 4) + (index * beatInterval);
          bassGain.gain.setValueAtTime(0.12, startTime);
          bassGain.gain.exponentialRampToValueAtTime(0.01, startTime + beatInterval * 0.8);
        }
        
        bassOsc.connect(bassFilter);
        bassFilter.connect(bassGain);
        bassGain.connect(gainNodeRef.current);
        
        bassOsc.start(now);
        bassOsc.stop(now + 16);
        
        oscillatorsRef.current.push(bassOsc);
      });

      // LEAD SYNTH - Melodic sci-fi arpeggios
      const arpNotes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
      arpNotes.forEach((freq, index) => {
        const leadOsc = ctx.createOscillator();
        leadOsc.type = 'square';
        leadOsc.frequency.value = freq;
        
        const leadFilter = ctx.createBiquadFilter();
        leadFilter.type = 'lowpass';
        leadFilter.frequency.value = 2000;
        leadFilter.Q.value = 3;
        
        const leadGain = ctx.createGain();
        leadGain.gain.value = 0;
        
        // Arpeggio pattern
        for (let bar = 0; bar < 8; bar++) {
          const startTime = now + (bar * beatInterval * 4) + (index * beatInterval / 2);
          leadGain.gain.setValueAtTime(0.06, startTime);
          leadGain.gain.exponentialRampToValueAtTime(0.01, startTime + beatInterval * 0.4);
          
          // Filter sweep
          leadFilter.frequency.setValueAtTime(1000, startTime);
          leadFilter.frequency.exponentialRampToValueAtTime(2500, startTime + beatInterval * 0.3);
        }
        
        leadOsc.connect(leadFilter);
        leadFilter.connect(leadGain);
        leadGain.connect(gainNodeRef.current);
        
        leadOsc.start(now);
        leadOsc.stop(now + 16);
        
        oscillatorsRef.current.push(leadOsc);
      });

      // PAD - Atmospheric background
      const padFrequencies = [130.81, 164.81, 196.00]; // C3, E3, G3
      padFrequencies.forEach((freq, index) => {
        const padOsc = ctx.createOscillator();
        padOsc.type = 'sine';
        padOsc.frequency.value = freq;
        
        const padGain = ctx.createGain();
        padGain.gain.value = 0;
        padGain.gain.setValueAtTime(0, now + 2);
        padGain.gain.linearRampToValueAtTime(0.04, now + 6);
        
        padOsc.connect(padGain);
        padGain.connect(gainNodeRef.current);
        
        padOsc.start(now);
        padOsc.stop(now + 16);
        
        oscillatorsRef.current.push(padOsc);
      });

      // Schedule the loop to repeat
      setTimeout(() => {
        isPlayingRef.current = false;
        if (!document.hidden) {
          createRhythmicMusic();
        }
      }, 16000); // Loop every 16 seconds (32 beats at 120 BPM)
    };

    // Start audio on user interaction (browsers require this)
    const handleUserInteraction = () => {
      initAudio();
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
    };

    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('keydown', handleUserInteraction);

    return () => {
      window.removeEventListener('click', handleUserInteraction);
      
      // Cleanup audio on unmount
      if (oscillatorsRef.current.length > 0) {
        oscillatorsRef.current.forEach(osc => {
          try {
            osc.stop();
          } catch (e) {
            // Already stopped
          }
        });
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    // Handle mute/unmute
    if (gainNodeRef.current) {
      if (isMuted) {
        gainNodeRef.current.gain.setValueAtTime(gainNodeRef.current.gain.value, audioContextRef.current.currentTime);
        gainNodeRef.current.gain.linearRampToValueAtTime(0, audioContextRef.current.currentTime + 0.5);
      } else {
        gainNodeRef.current.gain.setValueAtTime(gainNodeRef.current.gain.value, audioContextRef.current.currentTime);
        gainNodeRef.current.gain.linearRampToValueAtTime(0.2, audioContextRef.current.currentTime + 0.5);
      }
    }
  }, [isMuted]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <button
      onClick={toggleMute}
      className="fixed top-3 right-3 z-[100] bg-gray-900 bg-opacity-80 hover:bg-opacity-100 text-white p-3 rounded-lg border border-gray-700 transition-all duration-200 hover:scale-110 shadow-lg"
      title={isMuted ? 'Unmute Music' : 'Mute Music'}
    >
      {isMuted ? (
        // Muted icon
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
        </svg>
      ) : (
        // Unmuted icon with sound waves
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        </svg>
      )}
    </button>
  );
};

export default BackgroundMusic;
