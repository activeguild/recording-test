import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const ThreeJSRecorder = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [mimeType2, setMimeType2] = useState<string | null>(null);
  const [length, setLength] = useState<string | null>(null);

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
      const geometry = new THREE.PlaneGeometry(4, 6);
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
    if (!canvasRef.current) {
      return;
    }

    console.log("start recording");
    const canvasStream = canvasRef.current.captureStream(30); // 30fpsでCanvasをキャプチャ
    // const audioStream = videoRef.current.captureStream().getAudioTracks();
    // console.log('audioStream :>> ', audioStream);
    const combinedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      // ...audioStream
    ]);

    const options: MediaRecorderOptions = { mimeType: "" };

     if (MediaRecorder.isTypeSupported("video/mp4")) {
      options.mimeType = "video/mp4";
    } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
      options.mimeType = "video/webm;codecs=vp9";
    } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8")) {
      options.mimeType = "video/webm;codecs=vp8";
      console.warn("No supported MIME type found for MediaRecorder");
    }

    mediaRecorderRef.current = new MediaRecorder(combinedStream, options);
    setMimeType2(mediaRecorderRef.current.mimeType);
    mediaRecorderRef.current.ondataavailable = (event) => {
      setLength(event.data.size.toString());
      setMimeType(event.data.type);
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorderRef.current.onstop = () => {
      // const blob = new Blob(recordedChunksRef.current, { type: "video/mp4" });
      // const url = URL.createObjectURL(blob);
      // setRecordedVideoUrl(url);
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
      console.log("stop recording");
      mediaRecorderRef.current.stop();
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <button onClick={startRecording}>Start Recording</button>
      <button onClick={stopRecording}>Stop Recording</button>
      <div>data length: {length}</div>
      <div>mimeType: {mimeType2}</div>
      <div>mimeType: {mimeType}</div>
      <video
        ref={videoRef}
        src="video.mp4"
        muted
        loop
        autoPlay
        playsInline
        style={{ width: "280px", height: "157.5px" }}
      ></video>
      <canvas
        ref={canvasRef}
        style={{ maxWidth: "280px", maxHeight: "157.5px" }}
      ></canvas>
      {recordedVideoUrl && (
        <video
          src={recordedVideoUrl}
          controls
          style={{ maxWidth: "280px", maxHeight: "157.5px" }}
        ></video>
      )}
    </div>
  );
};

export default ThreeJSRecorder;
