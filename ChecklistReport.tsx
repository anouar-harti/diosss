import React, { useState, useEffect } from 'react';
import { Play, Square, Clock, Pause, Coffee } from 'lucide-react';

interface TimerProps {
  startTime: Date | null;
  onStart: () => void;
  onStop: () => void;
  isWorking: boolean;
  // Nuevas props para la pausa
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  totalPausedMs: number;
  pauseStartTime: Date | null;
}

const Timer: React.FC<TimerProps> = ({ 
  startTime, 
  onStart, 
  onStop, 
  isWorking,
  isPaused,
  onPause,
  onResume,
  totalPausedMs,
  pauseStartTime
}) => {
  const [elapsed, setElapsed] = useState<string>("00:00:00");

  useEffect(() => {
    let interval: number | undefined;

    if (isWorking && startTime) {
      // Función para actualizar el display
      const updateTimer = () => {
        const now = new Date();
        
        // Si está pausado, usamos la hora en que se pausó como referencia "actual"
        // para que el reloj visualmente se detenga.
        const referenceTime = isPaused && pauseStartTime ? pauseStartTime : now;
        
        // El tiempo real transcurrido es: (HoraRef - Inicio) - (Total acumulado de pausas anteriores)
        const diff = referenceTime.getTime() - startTime.getTime() - totalPausedMs;
        
        // Evitar números negativos por milisegundos de desajuste
        const safeDiff = Math.max(0, diff);
        
        const hours = Math.floor(safeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((safeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((safeDiff % (1000 * 60)) / 1000);

        setElapsed(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      };

      // Actualizamos inmediatamente y luego cada segundo
      updateTimer();
      interval = window.setInterval(updateTimer, 1000);
    }

    return () => clearInterval(interval);
  }, [isWorking, startTime, isPaused, totalPausedMs, pauseStartTime]);

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-sm border border-slate-200 w-full max-w-md mx-auto">
      <div className="mb-6 relative">
        <div className={`w-40 h-40 rounded-full flex items-center justify-center border-4 transition-colors duration-300
          ${isPaused ? 'border-amber-400 bg-amber-50' : 
            isWorking ? 'border-blue-500 animate-pulse' : 'border-slate-300'}`}>
          <div className={`text-3xl font-mono font-bold ${isPaused ? 'text-amber-600' : 'text-slate-700'}`}>
            {isWorking ? elapsed : "00:00:00"}
          </div>
        </div>
        
        {/* Indicador visual de estado */}
        {isWorking && !isPaused && (
            <span className="absolute top-0 right-0 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
          </span>
        )}
        
        {isPaused && (
           <span className="absolute -top-2 -right-2 bg-amber-100 text-amber-600 px-2 py-1 rounded-full text-xs font-bold border border-amber-200 shadow-sm flex items-center gap-1">
             <Coffee size={12} /> PAUSADO
           </span>
        )}
      </div>

      <div className="flex flex-col w-full gap-3">
        {!isWorking ? (
          <button
            onClick={onStart}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-200"
          >
            <Play size={24} />
            Iniciar Jornada
          </button>
        ) : (
          <>
            {/* Botones de control durante el trabajo */}
            <div className="flex gap-3 w-full">
              {!isPaused ? (
                <button
                  onClick={onPause}
                  className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 px-4 rounded-xl transition-all active:scale-95 shadow-md shadow-amber-200"
                >
                  <Pause size={24} />
                  Pausar
                </button>
              ) : (
                <button
                  onClick={onResume}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-4 rounded-xl transition-all active:scale-95 shadow-md shadow-green-200"
                >
                  <Play size={24} />
                  Reanudar
                </button>
              )}
              
              <button
                onClick={onStop}
                className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-4 rounded-xl transition-all active:scale-95 shadow-md shadow-red-200"
              >
                <Square size={24} />
                Finalizar
              </button>
            </div>
          </>
        )}
      </div>
      
      {startTime && isWorking && (
        <div className="mt-4 text-xs text-slate-400 flex flex-col items-center gap-1">
          <span className="flex items-center gap-1">
            <Clock size={12} />
            Inicio: {startTime.toLocaleTimeString()}
          </span>
          {totalPausedMs > 0 && (
             <span className="text-amber-600 font-medium">
               (Descanso total: {Math.floor(totalPausedMs / 60000)} min)
             </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Timer;