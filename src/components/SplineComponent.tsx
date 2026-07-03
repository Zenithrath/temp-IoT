'use client'
import Spline from "@splinetool/react-spline"
import { useCallback } from "react"

export default function SplineComponent() {
  const handleLoad = useCallback((splineApp: any) => {
    // Disable zoom and rotation, only allow panning
    if (splineApp) {
      try {
        // Attempt to disable mouse interactions that cause zoom/rotate
        const canvas = splineApp._canvas || splineApp.canvas;
        if (canvas) {
          // Prevent scroll zoom
          canvas.addEventListener('wheel', (e: WheelEvent) => {
            e.preventDefault();
            e.stopPropagation();
          }, { passive: false });
        }
      } catch (e) {
        // Spline API may vary, fail silently
      }
    }
  }, []);

  return (
    <div 
      className="w-full h-full cursor-grab active:cursor-grabbing rounded-2xl overflow-hidden"
      onWheel={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <Spline 
        scene="https://prod.spline.design/qEcAzKu8Ec4rKvdx/scene.splinecode" 
        style={{ background: "transparent" }}
        onLoad={handleLoad}
      />
    </div>
  )
}
