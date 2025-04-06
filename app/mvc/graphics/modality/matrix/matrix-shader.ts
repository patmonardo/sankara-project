// MatrixShader.tsx - Matrix-connected shader component

import { useEffect, useState } from 'react';
import { useMatrixServices } from './matrix-context';

export interface MatrixShaderProps {
  shader: string;
  uniforms: Record<string, any>;
  width: number;
  height: number;
}

export function MatrixShader({ shader, uniforms, width, height }: MatrixShaderProps) {
  const { compute } = useMatrixServices();
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Execute shader when inputs change
  useEffect(() => {
    let isCancelled = false;
    
    async function executeShader() {
      setLoading(true);
      setError(null);
      
      try {
        // Run shader through Matrix compute service
        const result = await compute.runShader(shader, uniforms, { width, height });
        
        // Create image data from result
        if (!isCancelled) {
          const imageData = new ImageData(
            new Uint8ClampedArray(result.result.buffer),
            result.width,
            result.height
          );
          setImageData(imageData);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err.message || 'Failed to execute shader');
          console.error('Shader execution failed:', err);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }
    
    executeShader();
    
    return () => {
      isCancelled = true;
    };
  }, [shader, uniforms, width, height, compute]);
  
  // Render the result
  useEffect(() => {
    if (!imageData) return;
    
    const canvas = document.getElementById('shader-output') as HTMLCanvasElement;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.putImageData(imageData, 0, 0);
      }
    }
  }, [imageData]);
  
  return (
    <div className="matrix-shader">
      {loading && <div className="shader-loading">Processing shader...</div>}
      {error && <div className="shader-error">{error}</div>}
      <canvas 
        id="shader-output"
        width={width}
        height={height}
        style={{ display: loading || error ? 'none' : 'block' }}
      />
    </div>
  );
}