
import React, { useEffect, useState } from 'react';
import { UIAction, ImageAsset, VNCharacter, VNDialogue, VNChoice } from '../../types';
import { BackgroundLayer } from './layers/BackgroundLayer';
import { CharacterLayer } from './layers/CharacterLayer';
import { DialogLayer } from './layers/DialogLayer';
import { resolveImage } from '../../services/imageFactory';

interface VNStageProps {
  background: ImageAsset;
  characters?: VNCharacter[];
  dialogue: VNDialogue;
  choices?: VNChoice[];
  bgm?: string;
  sfx?: string;
  onAction: (action: UIAction) => void;
  path?: string;
  animation?: any;
}

const VNStage: React.FC<VNStageProps> = ({ 
  background, 
  characters = [], 
  dialogue, 
  choices = [], 
  onAction 
}) => {
  const [bgSrc, setBgSrc] = useState<string>('');

  // Guard: If background schema is missing, don't render or crash
  if (!background) {
    return (
        <div className="w-full h-96 flex items-center justify-center bg-zinc-900 text-red-400 font-mono text-xs border border-red-900/50 rounded-xl">
           [VN_STAGE: MISSING_BACKGROUND_DATA]
        </div>
    );
  }

  // 1. Resolve Background Asset
  const { source, value, style } = background;

  useEffect(() => {
    let active = true;
    resolveImage(background).then(url => {
        if (active) setBgSrc(url);
    });
    return () => { active = false; };
  }, [source, value, style]);

  // 2. Handle Global Click (Continue)
  const handleStageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const hasChoices = choices && choices.length > 0;
    
    if (!hasChoices) {
        onAction({
            type: 'SUBMIT_FORM',
            payload: { intent: 'continue' } 
        });
    }
  };
  
  return (
    <div 
        className="relative w-full h-[600px] md:h-[800px] overflow-hidden rounded-2xl border border-white/10 shadow-2xl bg-black select-none cursor-pointer group"
        onClick={handleStageClick}
    >
      {/* Layer 0: Background */}
      <BackgroundLayer src={bgSrc} />

      {/* Layer 1: Characters */}
      <CharacterLayer characters={characters} />

      {/* CRT Scanline Overlay */}
      <div className="absolute inset-0 pointer-events-none z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] opacity-20" />
      <div className="absolute inset-0 pointer-events-none z-10 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.4)_100%)]" />

      {/* Layer 2: UI & Dialogue */}
      {dialogue && (
        <DialogLayer 
            dialogue={dialogue} 
            choices={choices} 
            onAction={onAction} 
        />
      )}

      {/* Loading Indicator for Generation */}
      {background.source === 'GENERATED' && !bgSrc && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-4">
                 <div className="w-16 h-16 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                 <span className="text-cyan-400 font-mono text-xs tracking-widest animate-pulse">NEURAL_RENDERING...</span>
              </div>
          </div>
      )}
    </div>
  );
};

export default VNStage;
