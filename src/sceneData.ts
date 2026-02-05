// Scene data persistence - saves/loads object positions and properties

export interface SceneObjectData {
  id: string;
  name: string;
  type: 'box' | 'sphere' | 'cylinder' | 'capsule' | 'plane' | 'character' | 'al';
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scaling: { x: number; y: number; z: number };
  color?: string;
  properties?: Record<string, any>;
}

export interface SceneData {
  version: number;
  objects: SceneObjectData[];
  settings: {
    fogEnabled: boolean;
    fogStart: number;
    fogEnd: number;
    ambientIntensity: number;
    alFigmaUrl?: string;
    adFigmaUrl?: string;
  };
}

const STORAGE_KEY = 'virtual-office-scene-data';

export function saveSceneData(data: SceneData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    console.log('Scene saved!', data.objects.length, 'objects');
  } catch (e) {
    console.error('Failed to save scene:', e);
  }
}

export function loadSceneData(): SceneData | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load scene:', e);
  }
  return null;
}

export function exportSceneToFile(data: SceneData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'virtual-office-scene.json';
  a.click();
  URL.revokeObjectURL(url);
}

export function importSceneFromFile(callback: (data: SceneData) => void): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          callback(data);
        } catch (err) {
          console.error('Failed to parse scene file:', err);
        }
      };
      reader.readAsText(file);
    }
  };
  input.click();
}

export function clearSceneData(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// Figma URL helpers
export function getALFigmaUrl(): string | null {
  return localStorage.getItem('al-figma-url');
}

export function setALFigmaUrl(url: string): void {
  localStorage.setItem('al-figma-url', url);
}

export function getADFigmaUrl(): string | null {
  return localStorage.getItem('ad-figma-url');
}

export function setADFigmaUrl(url: string): void {
  localStorage.setItem('ad-figma-url', url);
}
