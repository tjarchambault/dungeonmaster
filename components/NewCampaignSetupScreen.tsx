import React from 'react';
import type { CampaignType } from '../types';

interface NewCampaignSetupScreenProps {
  onSelect: (type: CampaignType) => void;
  onBack: () => void;
}

const NewCampaignSetupScreen: React.FC<NewCampaignSetupScreenProps> = ({ onSelect, onBack }) => {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col items-center justify-center p-4" style={{ fontFamily: "'Georgia', serif" }}>
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-bold text-cyan-400 mb-6 tracking-wider">
          Choose Your Adventure Style
        </h1>
        
        <div className="flex flex-col md:flex-row gap-6 justify-center mb-12">
          <div 
            onClick={() => onSelect('Normal')} 
            className="p-6 rounded-lg border-2 bg-gray-800 border-gray-700 hover:border-cyan-500 hover:scale-105 cursor-pointer transition-all w-80"
          >
            <h2 className="text-2xl font-bold text-cyan-300 mb-2">Normal</h2>
            <p className="text-gray-300">The standard D&D experience. A rich, detailed world with complex challenges and authentic storytelling.</p>
          </div>
          
          <div 
            onClick={() => onSelect('Family')}
            className="p-6 rounded-lg border-2 bg-gray-800 border-gray-700 hover:border-purple-500 hover:scale-105 cursor-pointer transition-all w-80"
          >
            <h2 className="text-2xl font-bold text-purple-300 mb-2">Family</h2>
            <p className="text-gray-300">A kid-friendly adventure! The same great game with simpler language and less gruesome combat, perfect for young readers.</p>
          </div>
        </div>

        <button 
          onClick={onBack} 
          className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-md text-lg transition-colors"
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default NewCampaignSetupScreen;
