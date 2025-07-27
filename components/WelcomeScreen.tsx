import React from 'react';

interface WelcomeScreenProps {
  onNew: () => void;
  onContinue: () => void;
  hasSavedGames: boolean;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNew, onContinue, hasSavedGames }) => {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col items-center justify-center p-4" style={{ fontFamily: "'Georgia', serif" }}>
      <div className="text-center">
        <h1 className="text-5xl md:text-7xl font-bold text-cyan-400 mb-4 tracking-wider" style={{ textShadow: '0 0 10px rgba(74, 222, 128, 0.5)' }}>
          Gemini Dungeon Master
        </h1>
        <p className="text-xl text-gray-400 mb-12">An AI-driven adventure awaits.</p>
        
        <div className="space-y-6">
          <button 
            onClick={onNew} 
            className="w-64 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-4 px-8 rounded-md text-2xl transition-all transform hover:scale-105"
          >
            New Campaign
          </button>
          
          <button 
            onClick={onContinue} 
            disabled={!hasSavedGames} 
            className="w-64 bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-md text-2xl transition-all transform hover:scale-105 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed disabled:transform-none"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
