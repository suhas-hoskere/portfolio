import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface Milestone {
  id: string;
  year: string;
  title: string;
  category: 'origin' | 'education' | 'skill' | 'project' | 'culture' | 'signal';
  zPos: number;
  xPos: number;
  description: string;
  tags?: string[];
  kannada?: string;
  isProject?: boolean;
  projectDetails?: {
    summary: string;
    architecture: string[];
    tech: string[];
    github: string;
    demo?: string;
  };
}

export const MILESTONES: Milestone[] = [
  {
    id: 'davanagere',
    year: '2020',
    title: 'Davanagere',
    category: 'origin',
    zPos: -10,
    xPos: -1.2,
    description: 'Siddaganga PU College. Where the curiosity for mathematics, analytical physics, and code first began.',
    tags: ['Pre-University', 'Foundations'],
  },
  {
    id: 'bangalore',
    year: '2022',
    title: 'Bangalore Orbit',
    category: 'education',
    zPos: -18,
    xPos: 1.2,
    description: 'PES University, Electronic City Campus. B.Tech in Artificial Intelligence & Machine Learning.',
    tags: ['B.Tech AI & ML', 'Systems'],
  },
  // Skills
  {
    id: 'python',
    year: 'CORE',
    title: 'Python',
    category: 'skill',
    zPos: -26,
    xPos: -1.4,
    description: 'Primary programming language for AI pipelines, computational logic, and asynchronous systems.',
    tags: ['Core Propulsion'],
  },
  {
    id: 'llm',
    year: 'AI',
    title: 'LLM Integration',
    category: 'skill',
    zPos: -30,
    xPos: 1.4,
    description: 'Autonomous reasoning loops, context-aware embeddings, and multi-tool agent pipelines.',
    tags: ['Prompt Engineering', 'LangChain'],
  },
  {
    id: 'scikit',
    year: 'ML',
    title: 'Scikit-learn',
    category: 'skill',
    zPos: -34,
    xPos: -1.4,
    description: 'Statistical modeling, regression analysis, clustering, and GPU-benchmarked feature reduction.',
    tags: ['Google Colab', 'Classification'],
  },
  {
    id: 'cv',
    year: 'VISION',
    title: 'Computer Vision',
    category: 'skill',
    zPos: -38,
    xPos: 1.4,
    description: 'Multi-frame feature extraction, spatial object classification, and boundary vector tracking.',
    tags: ['OpenCV', 'Spatial Tracking'],
  },
  {
    id: 'whisper',
    year: 'VOX',
    title: 'OpenAI Whisper',
    category: 'skill',
    zPos: -42,
    xPos: -1.4,
    description: 'High-accuracy neural speech-to-text models for deep multilingual transcription.',
    tags: ['Speech AI'],
  },
  {
    id: 'vosk',
    year: 'VOX',
    title: 'Vosk Engine',
    category: 'skill',
    zPos: -46,
    xPos: 1.4,
    description: 'Ultra-low latency offline speech recognition with zero cloud dependency and instant stream parsing.',
    tags: ['Offline STT'],
  },
  {
    id: 'moonshine',
    year: 'VOX',
    title: 'Moonshine STT',
    category: 'skill',
    zPos: -50,
    xPos: -1.4,
    description: 'Lightweight on-device speech models optimized for low-resource edge computation.',
    tags: ['Edge AI'],
  },
  {
    id: 'nextjs',
    year: 'WEB',
    title: 'Next.js',
    category: 'skill',
    zPos: -54,
    xPos: 1.4,
    description: 'Production React framework with App Router, server-rendered components, and API routing.',
    tags: ['Full-Stack'],
  },
  {
    id: 'react',
    year: 'WEB',
    title: 'React.js',
    category: 'skill',
    zPos: -58,
    xPos: -1.4,
    description: 'Declarative component design, state architecture, and responsive fluid user cockpits.',
    tags: ['Frontend UI'],
  },
  {
    id: 'pyqt',
    year: 'DESKTOP',
    title: 'PyQt6',
    category: 'skill',
    zPos: -62,
    xPos: 1.4,
    description: 'Multi-threaded native desktop client applications with non-blocking QThread worker loops.',
    tags: ['Native GUI'],
  },
  // Projects
  {
    id: 'proj-voice',
    year: 'EXPEDITION 01',
    title: 'Real-time Voice Engine',
    category: 'project',
    zPos: -68,
    xPos: -1.6,
    description: 'Low-latency multi-engine speech recognition pipeline integrating Whisper, Vosk, and Moonshine with neural TTS voice synthesis.',
    tags: ['Speech AI', 'Whisper', 'Vosk', 'Moonshine'],
    isProject: true,
    projectDetails: {
      summary: 'An advanced, modular speech processing pipeline integrating Whisper, Vosk, and Moonshine for low-latency offline speech-to-text with integrated neural TTS voice synthesis.',
      architecture: [
        'Dual-engine STT: Vosk for instant offline ingestion + Whisper for deep contextual precision',
        'Asynchronous audio stream buffering and neural text-to-speech response',
        'Configurable noise thresholding and low-latency voice-activity detection'
      ],
      tech: ['Python', 'Whisper', 'Vosk', 'Moonshine STT', 'Neural TTS'],
      github: 'https://github.com',
    }
  },
  {
    id: 'proj-web',
    year: 'EXPEDITION 02',
    title: 'Full-stack Web Platform',
    category: 'project',
    zPos: -74,
    xPos: 1.6,
    description: 'Production-grade web application built with Next.js, React, and MongoDB, featuring real-time data persistence and containerized architecture.',
    tags: ['Next.js', 'React', 'MongoDB', 'Docker'],
    isProject: true,
    projectDetails: {
      summary: 'Production-grade web platform featuring Next.js server actions, MongoDB document indexing, and containerized deployment.',
      architecture: [
        'Next.js App Router with server-side caching and dynamic client interactivity',
        'MongoDB document layer with structured schemas and real-time query aggregation',
        'Docker containerized deployment pipeline for reproducible environments'
      ],
      tech: ['Next.js', 'React', 'MongoDB', 'Docker', 'Tailwind CSS'],
      github: 'https://github.com',
      demo: '#',
    }
  },
  {
    id: 'proj-desktop',
    year: 'EXPEDITION 03',
    title: 'Desktop Client',
    category: 'project',
    zPos: -80,
    xPos: -1.6,
    description: 'Native multi-threaded desktop workstation tool designed with PyQt6 for managing local AI pipelines, weights, and hardware metrics.',
    tags: ['Python', 'PyQt6', 'QThread'],
    isProject: true,
    projectDetails: {
      summary: 'Multi-threaded PyQt6 client application orchestrating local AI inference loops without blocking the user interface.',
      architecture: [
        'Custom QThread asynchronous workers to isolate model inference from UI thread',
        'Modern dark-mode aesthetic utilizing custom Qt Style Sheets (QSS)',
        'Direct hardware audio pipeline and background worker monitoring'
      ],
      tech: ['Python 3.12', 'PyQt6', 'Multithreading', 'Qt Designer'],
      github: 'https://github.com',
    }
  },
  {
    id: 'proj-research',
    year: 'EXPEDITION 04',
    title: 'AI/ML Research',
    category: 'project',
    zPos: -86,
    xPos: 1.6,
    description: 'Applied machine learning experiments integrating Large Language Models, spatial computer vision object tracking, and Scikit-learn predictive pipelines.',
    tags: ['LLMs', 'Computer Vision', 'Scikit-learn'],
    isProject: true,
    projectDetails: {
      summary: 'Research models benchmarked for spatial object detection, real-time bounding coordinate tracking, and contextual LLM retrieval.',
      architecture: [
        'Spatial computer vision frame evaluation for boundary tracking and feature extraction',
        'Scikit-learn classification & regression models benchmarked on GPU runtimes',
        'Structured prompt orchestration and document contextual retrieval with LLMs'
      ],
      tech: ['Python', 'Scikit-learn', 'Computer Vision', 'LLMs', 'Google Colab'],
      github: 'https://github.com',
    }
  },
  // Cultural
  {
    id: 'kannada-koota',
    year: 'CULTURE',
    title: 'Kannada Koota Club',
    kannada: 'ಕನ್ನಡ ಕೂಟ',
    category: 'culture',
    zPos: -92,
    xPos: 0,
    description: 'Content Writer. Crafting literary essays, campus communiqués, and celebrating Kannada linguistic heritage and community storytelling.',
    tags: ['Content Writer', 'ಕನ್ನಡ ಕೂಟ', 'Editorial'],
  },
  // Contact Signal
  {
    id: 'signal',
    year: 'TRANSMISSION',
    title: 'Send a Message',
    category: 'signal',
    zPos: -98,
    xPos: 0,
    description: 'The light strands converge into a single beam across spacetime. Establish contact directly with Suhas.',
    tags: ['Email', 'GitHub', 'LinkedIn'],
  },
];

// Ambient floating cosmic dust particles
export const TesseractDust: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);

  const particles = useMemo(() => {
    const count = 1200;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 26;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 22;
      positions[i * 3 + 2] = -Math.random() * 110;
    }
    return positions;
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const time = state.clock.getElapsedTime();
    pointsRef.current.rotation.z = time * 0.012;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particles, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.065}
        color="#fbbf24"
        transparent
        opacity={0.5}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

// Endless 3D perspective grid of glowing light columns (The Interstellar Bookshelf)
export const TesseractLatticeMesh: React.FC<{ cameraZ?: number }> = () => {
  const gridLines = useMemo(() => {
    const lines: THREE.Vector3[] = [];
    const spanX = 14;
    const stepX = 2.4;
    const startZ = -2;
    const endZ = -106;
    const stepZ = 5;

    // Vertical columns extending infinitely upward and downward
    for (let x = -spanX; x <= spanX; x += stepX) {
      for (let z = startZ; z >= endZ; z -= stepZ) {
        lines.push(new THREE.Vector3(x, -16, z));
        lines.push(new THREE.Vector3(x, 16, z));
      }
    }

    // Horizontal perspective tie-lines (bookshelf cross-strands)
    for (let y = -8; y <= 8; y += 4) {
      for (let z = startZ; z >= endZ; z -= stepZ) {
        lines.push(new THREE.Vector3(-spanX, y, z));
        lines.push(new THREE.Vector3(spanX, y, z));
      }
    }

    return lines;
  }, []);

  const lineGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(gridLines);
    return geo;
  }, [gridLines]);

  return (
    <group>
      {/* Background Infinite Lattice Lines */}
      <lineSegments geometry={lineGeo}>
        <lineBasicMaterial
          color="#d97706"
          transparent
          opacity={0.16}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      {/* Cold blue light strands running parallel along the time axis */}
      <lineSegments geometry={lineGeo}>
        <lineBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.06}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
};

// Connecting glowing light strands between related milestone columns
export const ConnectingStrands: React.FC = () => {
  const lineObjects = useMemo(() => {
    // 1. Voice engine connections (Whisper, Vosk, Moonshine -> Real-Time Voice Engine)
    const voiceEngineZ = -68;
    const whisperZ = -42;
    const voskZ = -46;
    const moonshineZ = -50;

    const c1 = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-1.4, 0, whisperZ),
      new THREE.Vector3(-2.8, 1.2, (whisperZ + voiceEngineZ) / 2),
      new THREE.Vector3(-1.6, 0, voiceEngineZ)
    );

    const c2 = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(1.4, 0, voskZ),
      new THREE.Vector3(0, 1.5, (voskZ + voiceEngineZ) / 2),
      new THREE.Vector3(-1.6, 0, voiceEngineZ)
    );

    const c3 = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-1.4, 0, moonshineZ),
      new THREE.Vector3(-2.2, -1.0, (moonshineZ + voiceEngineZ) / 2),
      new THREE.Vector3(-1.6, 0, voiceEngineZ)
    );

    // 2. Web connections (Next.js, React -> Full-Stack Web Platform)
    const webPlatformZ = -74;
    const nextZ = -54;
    const reactZ = -58;

    const c4 = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(1.4, 0, nextZ),
      new THREE.Vector3(2.5, 1.0, (nextZ + webPlatformZ) / 2),
      new THREE.Vector3(1.6, 0, webPlatformZ)
    );

    const c5 = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-1.4, 0, reactZ),
      new THREE.Vector3(0, -1.2, (reactZ + webPlatformZ) / 2),
      new THREE.Vector3(1.6, 0, webPlatformZ)
    );

    // 3. Desktop connections (Python, PyQt6 -> Desktop Client)
    const desktopZ = -80;
    const pythonZ = -26;
    const pyqtZ = -62;

    const c6 = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-1.4, 0, pythonZ),
      new THREE.Vector3(-3.5, 2.0, (pythonZ + desktopZ) / 2),
      new THREE.Vector3(-1.6, 0, desktopZ)
    );

    const c7 = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(1.4, 0, pyqtZ),
      new THREE.Vector3(0, -1.5, (pyqtZ + desktopZ) / 2),
      new THREE.Vector3(-1.6, 0, desktopZ)
    );

    const curves = [c1, c2, c3, c4, c5, c6, c7];
    const mat = new THREE.LineBasicMaterial({
      color: '#fbbf24',
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    return curves.map((curve) => {
      const points = curve.getPoints(36);
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      return new THREE.Line(geo, mat);
    });
  }, []);

  return (
    <group>
      {lineObjects.map((line, idx) => (
        <primitive key={idx} object={line} />
      ))}
    </group>
  );
};
