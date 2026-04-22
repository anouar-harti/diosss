import React, { useRef, useState, useEffect } from 'react';
import { Eraser, PenTool } from 'lucide-react';

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  title?: string;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, title = "Firma" }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      // Set resolution
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(ratio, ratio);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
      }
    }
  }, []);

  const getCoordinates = (event: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in event) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    } else {
        clientX = (event as React.MouseEvent).clientX;
        clientY = (event as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); // Prevent scrolling on touch
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    const { x, y } = getCoordinates(e);
    ctx?.beginPath();
    ctx?.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    const { x, y } = getCoordinates(e);
    ctx?.lineTo(x, y);
    ctx?.stroke();
    if (!hasSignature) setHasSignature(true);
  };

  const endDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current && hasSignature) {
        onSave(canvasRef.current.toDataURL());
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height); // Note: using raw width/height for clearRect
      setHasSignature(false);
      onSave("");
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 p-3 border-b border-slate-200 flex justify-between items-center">
             <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                <PenTool size={16} /> {title}
            </h3>
            <button 
                onClick={clearSignature}
                className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50"
            >
                <Eraser size={12} /> Borrar
            </button>
        </div>
        <div className="relative w-full h-48 bg-white cursor-crosshair touch-none">
          <canvas
            ref={canvasRef}
            className="w-full h-full block touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={endDrawing}
            onMouseLeave={endDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={endDrawing}
          />
           {!hasSignature && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-slate-300 text-2xl font-handwriting">Firmar Aquí</span>
            </div>
          )}
        </div>
      </div>
      <p className="text-xs text-slate-400 mt-2 text-center">
        Por favor, firme dentro del cuadro blanco arriba.
      </p>
    </div>
  );
};

export default SignaturePad;