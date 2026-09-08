import { useEffect, useRef } from "react";

export default function VideoBackground({ children, overlayOpacity = 0 }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay may be restricted until user interaction
      });
    }
  }, []);

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        width: "100%",
        overflow: "hidden",
        backgroundColor: "transparent",
      }}
    >
      {/* 100% Pure Crystal Clear Background Video */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          objectFit: "cover",
          zIndex: 0,
          pointerEvents: "none",
        }}
      >
        <source src="/animated-bg.mp4" type="video/mp4" />
      </video>

      {/* Optional Subtle Overlay (Only if opacity > 0) */}
      {overlayOpacity > 0 && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: `rgba(0, 0, 0, ${overlayOpacity})`,
            zIndex: 1,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Foreground Content Container */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </div>
    </div>
  );
}
