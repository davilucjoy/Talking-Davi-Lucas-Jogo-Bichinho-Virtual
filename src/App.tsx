/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { DaviSceneManager } from './game/scene';
import { TitleScreen } from './components/TitleScreen';
import { HUD } from './components/HUD';
import { WardrobeModal } from './components/WardrobeModal';
import { MiniGameModal } from './components/MiniGameModal';
import { SpeechBubble } from './components/SpeechBubble';
import { soundEngine } from './game/audio';
import { WardrobeHat, WardrobeGlasses } from './game/character';
import { notificationService, NotificationStatus } from './game/notifications';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const sceneManagerRef = useRef<DaviSceneManager | null>(null);

  // Game state
  const [gameState, setGameState] = useState<'title' | 'playing'>('title');

  // Stats & Economy
  const [coins, setCoins] = useState<number>(() => {
    return Number(localStorage.getItem('dl_coins') || 50);
  });
  const [moodJoy, setMoodJoy] = useState<number>(90);
  const [moodHunger, setMoodHunger] = useState<number>(75);
  const [moodEnergy, setMoodEnergy] = useState<number>(85);
  const [isSleeping, setIsSleeping] = useState<boolean>(false);

  // Notifications state
  const [notificationStatus, setNotificationStatus] = useState<NotificationStatus>(() => {
    return notificationService.getPermission();
  });
  const [lowStatAlert, setLowStatAlert] = useState<{ type: 'hunger' | 'energy'; value: number } | null>(null);

  // Wardrobe state
  const [currentHat, setCurrentHat] = useState<WardrobeHat>(() => {
    return (localStorage.getItem('dl_hat') as WardrobeHat) || 'snapback';
  });
  const [currentGlasses, setCurrentGlasses] = useState<WardrobeGlasses>(() => {
    return (localStorage.getItem('dl_glasses') as WardrobeGlasses) || 'none';
  });
  const [currentOutfitColor, setCurrentOutfitColor] = useState<string>(() => {
    return localStorage.getItem('dl_outfit') || '#2563eb';
  });
  const [currentRoomTheme, setCurrentRoomTheme] = useState<string>(() => {
    return localStorage.getItem('dl_room') || 'studio';
  });

  // UI Modals
  const [isWardrobeOpen, setIsWardrobeOpen] = useState<boolean>(false);
  const [isMiniGameOpen, setIsMiniGameOpen] = useState<boolean>(false);

  // Speech & Voice Repeater
  const [speechText, setSpeechText] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isRecordingMic, setIsRecordingMic] = useState<boolean>(false);

  // 1. Mount Three.js Scene once in isolated container
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const manager = new DaviSceneManager(canvasMountRef.current, {
      onInteract: (part) => {
        if (part === 'head') {
          setMoodJoy((prev) => Math.max(10, prev - 5));
        } else if (part === 'belly' || part === 'feet') {
          setMoodJoy((prev) => Math.min(100, prev + 8));
        } else if (part === 'pet') {
          setMoodJoy((prev) => Math.min(100, prev + 6));
        }
      },
      onCoinEarned: (amount) => {
        setCoins((prev) => {
          const next = prev + amount;
          localStorage.setItem('dl_coins', String(next));
          return next;
        });
      },
    });

    sceneManagerRef.current = manager;

    // Apply saved wardrobe
    manager.setHat(currentHat);
    manager.setGlasses(currentGlasses);
    manager.setOutfitColor(currentOutfitColor);
    manager.setRoomTheme(currentRoomTheme);

    return () => {
      manager.dispose();
      sceneManagerRef.current = null;
    };
  }, []);

  // Update wardrobe when changed
  useEffect(() => {
    if (!sceneManagerRef.current) return;
    sceneManagerRef.current.setHat(currentHat);
    localStorage.setItem('dl_hat', currentHat);
  }, [currentHat]);

  useEffect(() => {
    if (!sceneManagerRef.current) return;
    sceneManagerRef.current.setGlasses(currentGlasses);
    localStorage.setItem('dl_glasses', currentGlasses);
  }, [currentGlasses]);

  useEffect(() => {
    if (!sceneManagerRef.current) return;
    sceneManagerRef.current.setOutfitColor(currentOutfitColor);
    localStorage.setItem('dl_outfit', currentOutfitColor);
  }, [currentOutfitColor]);

  useEffect(() => {
    if (!sceneManagerRef.current) return;
    sceneManagerRef.current.setRoomTheme(currentRoomTheme);
    localStorage.setItem('dl_room', currentRoomTheme);
  }, [currentRoomTheme]);

  // Periodic stat decay & recovery
  useEffect(() => {
    const timer = setInterval(() => {
      if (isSleeping) {
        // Recover energy while sleeping
        setMoodEnergy((prev) => Math.min(100, prev + 5));
      } else {
        // Natural energy & hunger decay
        setMoodEnergy((prev) => {
          const next = Math.max(10, prev - 1);
          if (next <= 20) {
            setLowStatAlert({ type: 'energy', value: next });
            notificationService.sendEnergyReminder(next, () => {
              window.focus();
              setGameState('playing');
            });
          }
          return next;
        });
      }

      setMoodHunger((prev) => {
        const next = Math.max(10, prev - 2);
        if (next <= 25) {
          setLowStatAlert({ type: 'hunger', value: next });
          notificationService.sendHungerReminder(next, () => {
            window.focus();
            setGameState('playing');
          });
        }
        return next;
      });

      setMoodJoy((prev) => Math.max(20, prev - 1));
    }, 12000);

    return () => clearInterval(timer);
  }, [isSleeping]);

  // Background tab reminder via Notification API
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (moodHunger <= 25) {
          notificationService.sendHungerReminder(moodHunger, () => {
            window.focus();
            setGameState('playing');
          });
        } else if (moodEnergy <= 20) {
          notificationService.sendEnergyReminder(moodEnergy, () => {
            window.focus();
            setGameState('playing');
          });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [moodHunger, moodEnergy]);

  // Request Notification permission
  const handleRequestNotification = async () => {
    const status = await notificationService.requestPermission();
    setNotificationStatus(status);
    if (status === 'granted') {
      soundEngine.playCoin();
      try {
        new Notification('🔔 Davi Lucas Reminders Enabled!', {
          body: "Awesome! We'll send you a friendly reminder whenever Davi's hunger or energy drops too low.",
          icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🍕</text></svg>',
        });
      } catch (e) {
        console.warn('Test notification error:', e);
      }
    }
  };

  // Handlers
  const handleStartGame = () => {
    setGameState('playing');
    soundEngine.playGiggle();
  };

  const handleFeed = (food: 'pizza' | 'chili' | 'boba' | 'lemon' | 'potion') => {
    if (!sceneManagerRef.current) return;
    sceneManagerRef.current.feedItem(food);
    setMoodHunger((prev) => {
      const next = Math.min(100, prev + 30);
      if (next > 25) {
        setLowStatAlert((curr) => (curr?.type === 'hunger' ? null : curr));
      }
      return next;
    });
    setMoodJoy((prev) => Math.min(100, prev + 15));
  };

  const handleAction = (act: 'guitar' | 'disco' | 'fart' | 'sleep') => {
    if (!sceneManagerRef.current) return;
    if (act === 'guitar') {
      sceneManagerRef.current.triggerGuitarShred();
      setMoodJoy((prev) => Math.min(100, prev + 20));
      setMoodEnergy((prev) => Math.max(10, prev - 5));
    } else if (act === 'disco') {
      sceneManagerRef.current.triggerDiscoDance();
      setMoodJoy((prev) => Math.min(100, prev + 25));
      setMoodEnergy((prev) => Math.max(10, prev - 5));
    } else if (act === 'fart') {
      sceneManagerRef.current.triggerFart();
      setMoodJoy((prev) => Math.min(100, prev + 10));
    } else if (act === 'sleep') {
      sceneManagerRef.current.toggleSleep();
      setIsSleeping((prev) => {
        const nextSleep = !prev;
        if (nextSleep) {
          setLowStatAlert((curr) => (curr?.type === 'energy' ? null : curr));
        }
        return nextSleep;
      });
      setMoodEnergy((prev) => Math.min(100, prev + 25));
    }
  };

  const handleSpeakText = (text: string) => {
    if (!sceneManagerRef.current) return;
    setSpeechText(text);
    setIsSpeaking(true);
    sceneManagerRef.current.character.state = 'talking';

    soundEngine.speakPhrase(
      text,
      () => {
        setIsSpeaking(true);
      },
      () => {
        setIsSpeaking(false);
        if (sceneManagerRef.current) {
          sceneManagerRef.current.character.state = 'idle';
        }
      }
    );
  };

  // Push to talk microphone recording
  const handleToggleRecord = async () => {
    if (isRecordingMic) {
      soundEngine.stopMicrophoneRecording();
      setIsRecordingMic(false);
    } else {
      const ok = await soundEngine.startMicrophoneRecording(
        (rec) => setIsRecordingMic(rec),
        (duration) => {
          setSpeechText('Repeating your voice! 🎤');
          setIsSpeaking(true);
          if (sceneManagerRef.current) {
            sceneManagerRef.current.character.state = 'talking';
          }
        },
        () => {
          setIsSpeaking(false);
          if (sceneManagerRef.current) {
            sceneManagerRef.current.character.state = 'idle';
          }
        }
      );
      if (!ok) {
        handleSpeakText('Please allow microphone permissions to repeat your voice!');
      }
    }
  };

  const handleRewardCoins = (amount: number) => {
    setCoins((prev) => {
      const next = prev + amount;
      localStorage.setItem('dl_coins', String(next));
      return next;
    });
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans">
      {/* 1. Isolated 3D WebGL Canvas Container */}
      <div ref={canvasMountRef} className="absolute inset-0 w-full h-full z-0 cursor-grab active:cursor-grabbing" />

      {/* 2. Comic Speech Bubble */}
      <SpeechBubble text={speechText} isVisible={isSpeaking} />

      {gameState === 'title' ? (
        <TitleScreen
          onStart={handleStartGame}
          coins={coins}
          notificationStatus={notificationStatus}
          onRequestNotification={handleRequestNotification}
        />
      ) : (
        <HUD
          coins={coins}
          moodJoy={moodJoy}
          moodHunger={moodHunger}
          moodEnergy={moodEnergy}
          onFeed={handleFeed}
          onAction={handleAction}
          onOpenWardrobe={() => setIsWardrobeOpen(true)}
          onOpenMiniGames={() => setIsMiniGameOpen(true)}
          onSpeakText={handleSpeakText}
          isSleeping={isSleeping}
          isRecording={isRecordingMic}
          onToggleRecord={handleToggleRecord}
          notificationStatus={notificationStatus}
          onRequestNotification={handleRequestNotification}
          lowStatAlert={lowStatAlert}
        />
      )}

      {/* 4. Wardrobe & Closet Modal */}
      {isWardrobeOpen && (
        <WardrobeModal
          currentHat={currentHat}
          currentGlasses={currentGlasses}
          currentOutfitColor={currentOutfitColor}
          currentRoomTheme={currentRoomTheme}
          coins={coins}
          onSelectHat={setCurrentHat}
          onSelectGlasses={setCurrentGlasses}
          onSelectOutfitColor={setCurrentOutfitColor}
          onSelectRoomTheme={setCurrentRoomTheme}
          onClose={() => setIsWardrobeOpen(false)}
        />
      )}

      {/* 5. Arcade Mini-Games Modal */}
      {isMiniGameOpen && (
        <MiniGameModal onClose={() => setIsMiniGameOpen(false)} onRewardCoins={handleRewardCoins} />
      )}
    </div>
  );
}
