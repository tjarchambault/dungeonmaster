
import React from 'react';
import type { GameState, CityMap, GridMap } from '../types';
import { ALL_MAPS } from '../constants';
import { PartyIcon } from './Icon';

interface MapPageProps {
    gameState: GameState;
    onClose: () => void;
}

const terrainStyles: { [key:string]: string } = {
    forest: 'bg-green-800 text-green-200',
    plains: 'bg-yellow-700 text-yellow-900',
    hills: 'bg-amber-800 text-amber-300',
    mountains: 'bg-gray-600 text-gray-200',
    swamp: 'bg-teal-800 text-teal-200',
    road: 'bg-stone-500 text-stone-200',
    city_gate: 'bg-stone-600 text-yellow-300'
};

const MapPage: React.FC<MapPageProps> = ({ gameState, onClose }) => {
    
    // Determine which map to show. If on a grid, show that. Otherwise, show the city map.
    const currentMap = gameState.partyGridPosition 
        ? ALL_MAPS[gameState.currentMapId]
        : (ALL_MAPS[gameState.currentMapId]?.type === 'city' ? ALL_MAPS[gameState.currentMapId] : ALL_MAPS['silverhaven']); // Fallback to a city map if needed


    if (!currentMap) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
                <div className="bg-gray-800 p-8 rounded-lg text-center" onClick={e => e.stopPropagation()}>
                    <p className="text-xl text-red-400">Map not found!</p>
                    <button onClick={onClose} className="mt-4 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded">Close</button>
                </div>
            </div>
        );
    }
    
    const GridMapView = (map: GridMap) => {
        const { tiles } = map;
        const { partyGridPosition, visitedTiles, revealedMapIds, currentMapId } = gameState;
        const isMapRevealed = revealedMapIds?.includes(currentMapId);
        
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-4">
                 <h2 className="text-4xl text-yellow-200 mb-4 font-bold" style={{ textShadow: '2px 2px 4px black' }}>{map.name}</h2>
                <div className="grid p-2 bg-black bg-opacity-30 border-2 border-gray-600" style={{ gridTemplateColumns: `repeat(${tiles[0].length}, minmax(0, 1fr))` }}>
                    {tiles.flat().map((tile, index) => {
                        const isPlayerPosition = partyGridPosition?.x === tile.x && partyGridPosition?.y === tile.y;
                        const tileKey = `${tile.x},${tile.y}`;
                        const isVisited = !!visitedTiles[tileKey] || isMapRevealed;
                        
                        return (
                             <div
                                key={index}
                                title={tile.description}
                                className={`w-16 h-16 md:w-20 md:h-20 flex items-center justify-center border border-gray-900 border-opacity-50 relative text-4xl transition-all duration-300
                                    ${terrainStyles[tile.terrain] || 'bg-gray-800'}
                                    ${!isVisited ? 'brightness-50' : 'brightness-100'}
                                `}
                            >
                                <span className="opacity-80">{tile.icon}</span>
                                {isPlayerPosition && (
                                    <PartyIcon className="h-12 w-12 absolute text-red-500 drop-shadow-lg" />
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    const CityMapView = (map: CityMap) => {
        const { locations, name, imageUrl } = map;
        const currentLocId = gameState.currentCityLocationId;
        const partyOnCityMap = currentLocId === null;

        return (
             <div 
                className="w-full h-full border-8 border-yellow-900 rounded-md shadow-2xl relative bg-cover bg-center"
                style={{ backgroundImage: `url(${imageUrl})`}}
            >
                <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                <h2 className="text-5xl text-center text-white py-4 font-bold" style={{ fontFamily: "'Uncial Antiqua', cursive", textShadow: '2px 2px 4px black' }}>{name}</h2>
                {locations.map(location => {
                     const isCurrentLocation = location.id === currentLocId;
                     return (
                        <div 
                            key={location.id} 
                            className="absolute transform -translate-x-1/2 -translate-y-1/2" 
                            style={{ top: location.position.top, left: location.position.left }}
                        >
                             <div
                                title={location.name}
                                className={`relative flex items-center justify-center w-16 h-16 rounded-full border-4 transition-all duration-200 group
                                    ${isCurrentLocation ? 'bg-cyan-300 border-cyan-500 ring-4 ring-white animate-pulse' : location.id === map.entryPointId ? 'bg-red-300 border-red-600' : 'bg-yellow-200 border-yellow-800'}
                                `}
                            >
                                <span className="text-4xl text-black opacity-70">{location.icon}</span>
                                {isCurrentLocation && <PartyIcon className="h-10 w-10 absolute text-black drop-shadow-lg" />}
                            </div>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-max px-2 py-1 bg-black bg-opacity-70 text-white text-xs rounded-md pointer-events-none">
                                {location.name}
                                {isCurrentLocation && <span className="font-bold text-cyan-300"> (You are here)</span>}
                            </div>
                        </div>
                     )
                })}
                {partyOnCityMap && (
                     <div 
                        className="absolute transform -translate-x-1/2 -translate-y-1/2"
                        style={{ top: '85%', left: '50%' }}
                    >
                         <PartyIcon className="h-12 w-12 text-red-500 drop-shadow-lg animate-pulse" />
                         <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-max px-2 py-1 bg-black bg-opacity-70 text-white text-xs rounded-md pointer-events-none">Your Party</div>
                    </div>
                )}
            </div>
        )
    }

    let mapContent;
    if (currentMap.type === 'grid') {
        mapContent = GridMapView(currentMap as GridMap);
    } else if (currentMap.type === 'city') {
        mapContent = CityMapView(currentMap as CityMap);
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div className="relative w-full h-full max-w-6xl max-h-[95vh] bg-gray-800 rounded-lg overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                {mapContent}
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white font-bold text-2xl w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 z-10"
                    aria-label="Close map"
                >
                    &times;
                </button>
            </div>
        </div>
    );
};

export default MapPage;
