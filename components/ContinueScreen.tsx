import React from 'react';
import type { GameState } from '../types';

interface ContinueScreenProps {
  campaigns: GameState[];
  onLoad: (id: string) => void;
  onBack: () => void;
}

const ContinueScreen: React.FC<ContinueScreenProps> = ({ campaigns, onLoad, onBack }) => {
  
  const getRecap = (campaign: GameState): string => {
    const lastDmEntry = [...campaign.storyHistory].reverse().find(entry => entry.type === 'dm');
    return lastDmEntry?.text.substring(0, 150) + '...' || 'The adventure has just begun...';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col items-center justify-center p-4" style={{ fontFamily: "'Georgia', serif" }}>
      <div className="text-center max-w-3xl w-full">
        <h1 className="text-4xl md:text-5xl font-bold text-cyan-400 mb-8 tracking-wider">
          Continue Your Adventure
        </h1>
        
        {campaigns.length > 0 ? (
          <div className="space-y-6 mb-8">
            {campaigns.map(campaign => (
              <div key={campaign.id} className="p-5 rounded-lg border-2 bg-gray-800 border-gray-700 text-left flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div className="mb-4 sm:mb-0">
                  <h2 className="text-2xl font-bold text-cyan-300">{campaign.name}</h2>
                  <p className="text-sm text-gray-500 mb-2">
                    {campaign.type} Mode | Last Played: {new Date(campaign.lastUpdated).toLocaleDateString()}
                  </p>
                  <p className="text-gray-300 italic">"{getRecap(campaign)}"</p>
                </div>
                <button 
                  onClick={() => onLoad(campaign.id)} 
                  className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-6 rounded-md text-lg transition-colors flex-shrink-0"
                >
                  Load
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-xl mb-8">No saved campaigns found.</p>
        )}
        
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

export default ContinueScreen;
