import { useEffect, useRef } from 'react';

export function useScrollVideo(videoRef, containerRef = null) {
  const rafRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let isSeeking = false;
    let targetTime = 0;
    
    // Create debug overlay
    let debugDiv = document.getElementById('debug-video-scroll');
    if (!debugDiv) {
      debugDiv = document.createElement('div');
      debugDiv.id = 'debug-video-scroll';
      debugDiv.style.position = 'fixed';
      debugDiv.style.bottom = '10px';
      debugDiv.style.right = '10px';
      debugDiv.style.background = 'rgba(0,0,0,0.8)';
      debugDiv.style.color = '#0f0';
      debugDiv.style.padding = '10px';
      debugDiv.style.zIndex = '999999';
      debugDiv.style.fontFamily = 'monospace';
      document.body.appendChild(debugDiv);
    }

    video.preload = 'auto';

    const performSeek = () => {
      const dur = video.duration || 0;
      if (!dur || isNaN(dur)) return;

      if (isSeeking) return;

      if (Math.abs(video.currentTime - targetTime) > 0.05) {
        isSeeking = true;
        video.currentTime = targetTime;
        
        setTimeout(() => {
          isSeeking = false;
        }, 100);
      }
    };

    const handleSeeked = () => {
      isSeeking = false;
      if (Math.abs(video.currentTime - targetTime) > 0.05) {
        performSeek();
      }
    };

    video.addEventListener('seeked', handleSeeked);

    const onScroll = () => {
      if (rafRef.current) return;
      
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        
        const dur = video.duration || 0;
        
        let progress = 0;
        let scrollStats = "";

        if (containerRef && containerRef.current) {
          const { top, height } = containerRef.current.getBoundingClientRect();
          const maxScroll = height - window.innerHeight;
          if (maxScroll > 0) {
            progress = -top / maxScroll;
          }
          scrollStats = `top: ${Math.round(top)}, height: ${Math.round(height)}, maxScroll: ${Math.round(maxScroll)}`;
        } else {
          const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
          if (maxScroll > 0) {
            progress = window.scrollY / maxScroll;
          }
        }

        progress = Math.max(0, Math.min(1, progress));
        targetTime = progress * dur;
        
        if (debugDiv) {
          debugDiv.innerHTML = `
            Progress: ${(progress * 100).toFixed(2)}% <br/>
            Target Time: ${targetTime.toFixed(3)}s <br/>
            Current Time: ${video.currentTime.toFixed(3)}s <br/>
            Duration: ${dur.toFixed(3)}s <br/>
            ReadyState: ${video.readyState} <br/>
            ${scrollStats}
          `;
        }

        if (!dur || isNaN(dur)) return;
        performSeek();
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    video.addEventListener('loadedmetadata', onScroll);
    video.addEventListener('canplay', onScroll);
    
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      video.removeEventListener('loadedmetadata', onScroll);
      video.removeEventListener('canplay', onScroll);
      video.removeEventListener('seeked', handleSeeked);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (debugDiv && debugDiv.parentNode) debugDiv.parentNode.removeChild(debugDiv);
    };
  }, [videoRef, containerRef]);
}
