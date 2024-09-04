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
  const [audio, setAudio] = useState<
    [MediaStreamAudioDestinationNode, AudioBufferSourceNode] | null
  >(null);
  const [isPlaying, setIsPlaying] = useState(false);


  useEffect(() => {
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let renderer: THREE.WebGLRenderer | null = null;
    let videoTexture: THREE.VideoTexture | null = null,
      mesh;
    (async () => {
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

      async function loadAndPlayMP4Audio() {
        try {
          // MP4ファイルを取得
          const response = await fetch("video.mp4");
          const arrayBuffer = await response.arrayBuffer();

          // MP4ファイルの音声データをデコード
          const audioContext = new AudioContext();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

          // AudioContextで再生
          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;

          // AudioContextの出力をキャプチャ
          const destination = audioContext.createMediaStreamDestination();
          source.connect(destination);
          source.connect(audioContext.destination);
          // source.start(0);

          // キャプチャしたストリームを保存
          setAudio([destination, source]);
        } catch (error) {
          console.error("Error loading or playing audio:", error);
        }
      }

      initThreeJS();
      await loadAndPlayMP4Audio();
    })();
    return () => {
      if (renderer) {
        renderer.dispose();
      }
    };
  }, []);

  const startRecording = async () => {
    if (!canvasRef.current || !videoRef.current || !audio) {
      return;
    }

    console.log("start recording");
    const canvasStream = canvasRef.current.captureStream(30); // 30fpsでCanvasをキャプチャ
    // console.log('audioStream :>> ', audioStream);
    const combinedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...audio[0].stream.getAudioTracks(),
    ]);

    const options: MediaRecorderOptions = { mimeType: "" };

    if (MediaRecorder.isTypeSupported("video/mp4;codecs=avc1.42E01E,opus")) {
      options.mimeType = "video/mp4;codecs=avc1.42E01E,opus";
    } else if (
      MediaRecorder.isTypeSupported("video/mp4;codecs=avc1.42E01E,mp4a.40.2")
    ) {
      options.mimeType = "video/mp4;codecs=avc1.42E01E,mp4a.40.2";
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

    mediaRecorderRef.current.onerror = (error) => {
      console.log("error", error);
    };
    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: "video/mp4" });
      const url = URL.createObjectURL(blob);
      setRecordedVideoUrl(url);
    };

    mediaRecorderRef.current.onerror = (error) => {
      console.error("MediaRecorder error:", error);
      mediaRecorderRef.current!.stop();
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

  const play = () => {
    if(!audio || !videoRef.current) {
      return;
    }

    audio[1].start(0);
    videoRef.current.play();
    setIsPlaying(true)
  };

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <button onClick={play}>Play</button>
      <button disabled={!isPlaying} onClick={startRecording}>Start Recording</button>
      <button disabled={!isPlaying} onClick={stopRecording}>Stop Recording</button>
      <div>data length: {length}</div>
      <div>mimeType: {mimeType2}</div>
      <div>mimeType: {mimeType}</div>
      <video
        ref={videoRef}
        src="video.mp4"
        muted
        loop
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
