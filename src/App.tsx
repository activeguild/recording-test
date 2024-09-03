import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const ThreeJSRecorder = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let renderer: THREE.WebGLRenderer | null = null;
    let videoTexture: THREE.VideoTexture | null = null,
      mesh;

    const initThreeJS = () => {
      if (!videoRef.current || !canvasRef.current) {
        return;
      }

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        preserveDrawingBuffer: true,
      });
      renderer.setSize(window.innerWidth, window.innerHeight);

      const videoElement = videoRef.current;
      videoTexture = new THREE.VideoTexture(videoElement);
      const geometry = new THREE.PlaneGeometry(16, 9);
      const material = new THREE.MeshBasicMaterial({ map: videoTexture });
      mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      camera.position.z = 5;

      const animate = () => {
        requestAnimationFrame(animate);
        renderer?.render(scene!, camera!);
      };

      animate();
    };

    initThreeJS();

    return () => {
      if (renderer) {
        renderer.dispose();
      }
    };
  }, []);

  const startRecording = () => {
    if (!canvasRef.current || !mediaRecorderRef.current) {
      return;
    }
    const canvasStream = canvasRef.current.captureStream(30); // 30fpsでCanvasをキャプチャ
    // const audioStream = videoRef.current.captureStream().getAudioTracks();
    // console.log('audioStream :>> ', audioStream);
    const combinedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      // ...audioStream
    ]);

    mediaRecorderRef.current = new MediaRecorder(combinedStream);
    mediaRecorderRef.current.ondataavailable = (event) => {
      console.log("event.data.size :>> ", event.data.size);
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: "video/mp4" });
      const url = URL.createObjectURL(blob);
      setRecordedVideoUrl(url);
    };

    recordedChunksRef.current = []; // Reset recorded chunks
    mediaRecorderRef.current.start();
    // setTimeout(() => mediaRecorderRef.current.stop(), 5000); // 5秒後に録音を停止
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <button onClick={startRecording}>Start Recording</button>
      <button onClick={stopRecording}>Stop Recording</button>

      <video
        ref={videoRef}
        src="video.mp4"
        muted
        loop
        autoPlay
        playsInline
        style={{ width: "280px" }}
      ></video>
      <canvas
        ref={canvasRef}
        style={{ maxWidth: "280px", maxHeight: "157.5px" }}
      ></canvas>
      {recordedVideoUrl && (
        <video
          src={recordedVideoUrl}
          controls
          style={{ maxWidth: "280px" }}
        ></video>
      )}
    </div>
  );
};

export default ThreeJSRecorder;
