import React, { useState, useEffect, useCallback } from 'react';
import { Zap, Heart, Shield, Trophy, Star, Users } from 'lucide-react';

interface Cell {
  id: number;
  status: 'healthy' | 'infected' | 'protected';
  animating: boolean;
}

interface Player {
  username: string;
  score: number;
}

interface GameStats {
  score: number;
  boosters: number;
  infected: number;
  healthy: number;
  protected: number;
}

function App() {
  const [grid, setGrid] = useState<Cell[]>([]);
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    boosters: 3,
    infected: 0,
    healthy: 100,
    protected: 0
  });
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<Player[]>([
    { username: 'Player1', score: 1250 },
    { username: 'Player2', score: 980 },
    { username: 'Player3', score: 750 },
    { username: 'Player4', score: 620 },
    { username: 'Player5', score: 450 }
  ]);
  const [isAnimating, setIsAnimating] = useState(false);

  // Initialize grid
  useEffect(() => {
    const initialGrid: Cell[] = [];
    for (let i = 0; i < 100; i++) {
      initialGrid.push({
        id: i,
        status: Math.random() < 0.1 ? 'infected' : 'healthy',
        animating: false
      });
    }
    setGrid(initialGrid);
    updateStats(initialGrid);
  }, []);

  const updateStats = (currentGrid: Cell[]) => {
    const infected = currentGrid.filter(cell => cell.status === 'infected').length;
    const healthy = currentGrid.filter(cell => cell.status === 'healthy').length;
    const protectedCount = currentGrid.filter(cell => cell.status === 'protected').length;
    
    setStats(prev => ({
      ...prev,
      infected,
      healthy,
      protected: protectedCount
    }));
  };

  const getNeighbors = (cellId: number): number[] => {
    const row = Math.floor(cellId / 10);
    const col = cellId % 10;
    const neighbors: number[] = [];

    for (let r = row - 1; r <= row + 1; r++) {
      for (let c = col - 1; c <= col + 1; c++) {
        if (r >= 0 && r < 10 && c >= 0 && c < 10 && !(r === row && c === col)) {
          neighbors.push(r * 10 + c);
        }
      }
    }
    return neighbors;
  };

  const animateCell = (cellId: number) => {
    setGrid(prev => prev.map(cell => 
      cell.id === cellId ? { ...cell, animating: true } : cell
    ));
    
    setTimeout(() => {
      setGrid(prev => prev.map(cell => 
        cell.id === cellId ? { ...cell, animating: false } : cell
      ));
    }, 500);
  };

  const infectNeighbors = useCallback(() => {
    if (selectedCell === null || isAnimating) return;
    
    setIsAnimating(true);
    const neighbors = getNeighbors(selectedCell);
    let pointsEarned = 0;

    setGrid(prev => {
      const newGrid = [...prev];
      neighbors.forEach(neighborId => {
        if (newGrid[neighborId].status === 'healthy') {
          newGrid[neighborId].status = 'infected';
          pointsEarned += 10;
          animateCell(neighborId);
        }
      });
      return newGrid;
    });

    setStats(prev => ({ ...prev, score: prev.score + pointsEarned }));
    
    setTimeout(() => {
      setIsAnimating(false);
      updateStats(grid);
    }, 600);
  }, [selectedCell, isAnimating, grid]);

  const healCell = useCallback(() => {
    if (selectedCell === null || isAnimating) return;
    
    setIsAnimating(true);
    animateCell(selectedCell);

    setTimeout(() => {
      setGrid(prev => prev.map(cell => 
        cell.id === selectedCell && cell.status === 'infected' 
          ? { ...cell, status: 'healthy' } 
          : cell
      ));
      setStats(prev => ({ ...prev, score: prev.score + 5 }));
      setIsAnimating(false);
      updateStats(grid);
    }, 500);
  }, [selectedCell, isAnimating, grid]);

  const useBooster = useCallback(() => {
    if (selectedCell === null || stats.boosters <= 0 || isAnimating) return;
    
    setIsAnimating(true);
    animateCell(selectedCell);

    setTimeout(() => {
      setGrid(prev => prev.map(cell => 
        cell.id === selectedCell 
          ? { ...cell, status: 'protected' } 
          : cell
      ));
      setStats(prev => ({ 
        ...prev, 
        boosters: prev.boosters - 1,
        score: prev.score + 15
      }));
      setIsAnimating(false);
      updateStats(grid);
    }, 500);
  }, [selectedCell, stats.boosters, isAnimating, grid]);

  const buyBooster = () => {
    // Simulate Telegram Stars payment
    if (window.Telegram?.WebApp) {
      // Check if showPopup is supported (version 6.1+)
      const version = window.Telegram.WebApp.version;
      const versionNumber = parseFloat(version);
      
      if (versionNumber >= 6.1 && window.Telegram.WebApp.showPopup) {
        window.Telegram.WebApp.showPopup({
          title: 'Покупка бустера',
          message: 'Купить бустер за 10 Telegram Stars?',
          buttons: [
            { type: 'ok', text: 'Купить' },
            { type: 'cancel', text: 'Отмена' }
          ]
        }, (buttonId: string) => {
          if (buttonId === 'ok') {
            setStats(prev => ({ ...prev, boosters: prev.boosters + 1 }));
            window.Telegram.WebApp.showAlert('Бустер успешно куплен!');
          }
        });
      } else {
        // Fallback for older versions - directly purchase
        setStats(prev => ({ ...prev, boosters: prev.boosters + 1 }));
        window.Telegram.WebApp.showAlert('Бустер куплен за 10 Telegram Stars!');
      }
    } else {
      // Fallback for development
      setStats(prev => ({ ...prev, boosters: prev.boosters + 1 }));
    }
  };

  const getCellClassName = (cell: Cell) => {
    let baseClass = "w-8 h-8 border border-gray-300 cursor-pointer transition-all duration-300 transform hover:scale-110 ";
    
    if (cell.animating) {
      baseClass += "animate-pulse scale-125 ";
    }
    
    if (selectedCell === cell.id) {
      baseClass += "ring-2 ring-yellow-400 ";
    }

    switch (cell.status) {
      case 'infected':
        return baseClass + "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200";
      case 'healthy':
        return baseClass + "bg-green-500 hover:bg-green-600 shadow-lg shadow-green-200";
      case 'protected':
        return baseClass + "bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-200";
      default:
        return baseClass + "bg-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            🦠 Virus Game
          </h1>
          <p className="text-gray-300">Заражай, лечи и защищай клетки!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Board */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="grid grid-cols-10 gap-1 mb-6 justify-center">
                {grid.map((cell) => (
                  <div
                    key={cell.id}
                    className={getCellClassName(cell)}
                    onClick={() => setSelectedCell(cell.id)}
                  />
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={infectNeighbors}
                  disabled={selectedCell === null || isAnimating}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100"
                >
                  <Zap className="w-4 h-4" />
                  Заразить соседние
                </button>
                
                <button
                  onClick={healCell}
                  disabled={selectedCell === null || isAnimating}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100"
                >
                  <Heart className="w-4 h-4" />
                  Вылечить клетку
                </button>
                
                <button
                  onClick={useBooster}
                  disabled={selectedCell === null || stats.boosters <= 0 || isAnimating}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100"
                >
                  <Shield className="w-4 h-4" />
                  Использовать бустер ({stats.boosters})
                </button>
              </div>
            </div>
          </div>

          {/* Stats and Leaderboard */}
          <div className="space-y-6">
            {/* Player Stats */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Статистика
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Очки:</span>
                  <span className="text-2xl font-bold text-yellow-400">{stats.score}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Бустеры:</span>
                  <span className="text-lg font-semibold text-blue-400">{stats.boosters}</span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="text-center">
                    <div className="w-4 h-4 bg-red-500 rounded mx-auto mb-1"></div>
                    <div className="text-sm text-gray-300">{stats.infected}</div>
                  </div>
                  <div className="text-center">
                    <div className="w-4 h-4 bg-green-500 rounded mx-auto mb-1"></div>
                    <div className="text-sm text-gray-300">{stats.healthy}</div>
                  </div>
                  <div className="text-center">
                    <div className="w-4 h-4 bg-blue-500 rounded mx-auto mb-1"></div>
                    <div className="text-sm text-gray-300">{stats.protected}</div>
                  </div>
                </div>
              </div>

              <button
                onClick={buyBooster}
                className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-lg transition-all duration-200 transform hover:scale-105"
              >
                <Star className="w-4 h-4" />
                Купить бустер (10 ⭐)
              </button>
            </div>

            {/* Leaderboard */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                Лидерборд
              </h3>
              
              <div className="space-y-2">
                {leaderboard.map((player, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-yellow-400">#{index + 1}</span>
                      <span className="text-gray-300">{player.username}</span>
                    </div>
                    <span className="text-white font-semibold">{player.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
          <p className="text-gray-300 text-center text-sm">
            💡 Выберите клетку и используйте действия. Красные клетки - зараженные, зеленые - здоровые, синие - защищенные.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;