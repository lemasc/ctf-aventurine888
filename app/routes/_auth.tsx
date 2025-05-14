import { Outlet } from "react-router";
import { useEffect, useRef } from "react";

export default function AuthLayout() {
  const playerRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const abort = new AbortController();
    window.addEventListener(
      "visibilitychange",
      () => {
        if (document.visibilityState === "hidden") {
          playerRef.current?.pause();
        } else {
          playerRef.current?.play();
        }
      },
      { signal: abort.signal }
    );
    return () => {
      abort.abort();
    };
  }, []);
  return (
    <div className="bg-neutral-900 h-screen w-screen relative">
      <div className="bg-black/50 h-screen">
        <video
          src="https://www.it.kmitl.ac.th/~it67070173/ctf-hsr-bg-login.mp4"
          autoPlay
          loop
          muted
          className="absolute inset-0 object-cover w-full h-full z-0"
          ref={playerRef}
        />
      </div>
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <Outlet />
      </div>
    </div>
  );
}
