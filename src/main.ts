import {
  Engine,
  Scene,
  Vector3,
  Color3,
  Color4,
  HemisphericLight,
  DirectionalLight,
  UniversalCamera,
  MeshBuilder,
  StandardMaterial,
  Mesh,
  AbstractMesh,
  ActionManager,
  ExecuteCodeAction,
  GlowLayer,
  KeyboardEventTypes,
} from '@babylonjs/core';
import '@babylonjs/inspector';
import { teamMembers, alConfig, adConfig, managerConfig } from './teamData';
import { 
  initConversation, 
  sendMessage, 
  getConversationHistory,
  speak,
  initSpeechRecognition,
  startListening,
  stopListening,
  setApiKey,
} from './claudeApi';
import { 
  saveSceneData, 
  loadSceneData, 
  exportSceneToFile, 
  importSceneFromFile,
  clearSceneData,
  SceneData,
  SceneObjectData,
  getALFigmaUrl,
  setALFigmaUrl,
  getADFigmaUrl,
  setADFigmaUrl,
} from './sceneData';

// Global state
let currentLookingAt: any = null;
let isPointerLocked = false;
let isEditorMode = false;
let currentConversation: string | null = null;
let isListening = false;

class VirtualOffice {
  public engine: Engine;
  public scene: Scene;
  private camera: UniversalCamera;
  private canvas: HTMLCanvasElement;
  // Track ALL meshes we create for saving
  private trackedMeshes: Map<string, AbstractMesh> = new Map();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    this.scene = new Scene(this.engine);
    
    this.setupScene();
    this.setupCamera();
    this.setupLighting();
    this.createOfficeLayout();
    this.loadSavedPositions(); // Apply any saved positions
    this.setupInteraction();
    this.initializeConversations();
    
    this.engine.runRenderLoop(() => {
      this.scene.render();
      if (!isEditorMode) this.checkLookingAt();
    });

    window.addEventListener('resize', () => this.engine.resize());
  }

  private setupScene() {
    this.scene.clearColor = new Color4(0.05, 0.08, 0.12, 1);
    const glow = new GlowLayer('glow', this.scene);
    glow.intensity = 0.5;
  }

  private setupCamera() {
    this.camera = new UniversalCamera('camera', new Vector3(0, 1.7, 15), this.scene);
    this.camera.setTarget(new Vector3(0, 1.7, 0));
    this.camera.attachControl(this.canvas, true);
    
    this.camera.keysUp.push(87);
    this.camera.keysDown.push(83);
    this.camera.keysLeft.push(65);
    this.camera.keysRight.push(68);
    
    this.camera.speed = 0.5;
    this.camera.inertia = 0.7;
    this.camera.angularSensibility = 1000;
    this.camera.checkCollisions = true;
    this.camera.ellipsoid = new Vector3(0.5, 0.9, 0.5);
    this.scene.collisionsEnabled = true;
  }

  private setupLighting() {
    const ambient = new HemisphericLight('ambient', new Vector3(0, 1, 0), this.scene);
    ambient.intensity = 0.4;
    ambient.diffuse = new Color3(0.8, 0.8, 1);
    
    const directional = new DirectionalLight('directional', new Vector3(-1, -2, -1), this.scene);
    directional.intensity = 0.6;
  }

  // Track a mesh so we can save its position later
  private trackMesh(id: string, mesh: AbstractMesh) {
    this.trackedMeshes.set(id, mesh);
  }

  private createOfficeLayout() {
    // Materials
    const floorMat = new StandardMaterial('floorMat', this.scene);
    floorMat.diffuseColor = new Color3(0.1, 0.1, 0.15);
    
    const wallMat = new StandardMaterial('wallMat', this.scene);
    wallMat.diffuseColor = new Color3(0.15, 0.15, 0.2);
    
    const glassMat = new StandardMaterial('glassMat', this.scene);
    glassMat.diffuseColor = new Color3(0.1, 0.2, 0.3);
    glassMat.alpha = 0.3;
    glassMat.emissiveColor = new Color3(0.05, 0.1, 0.15);

    const tableMat = new StandardMaterial('tableMat', this.scene);
    tableMat.diffuseColor = new Color3(0.2, 0.15, 0.1);

    // === CENTRAL MEETING ROOM (Circular) ===
    const meetingFloor = MeshBuilder.CreateCylinder('meetingFloor', { diameter: 12, height: 0.1 }, this.scene);
    meetingFloor.position.y = 0.05;
    meetingFloor.material = floorMat;
    meetingFloor.checkCollisions = true;
    this.trackMesh('meetingFloor', meetingFloor);

    const meetingTable = MeshBuilder.CreateCylinder('meetingTable', { diameter: 4, height: 0.8 }, this.scene);
    meetingTable.position.y = 0.4;
    meetingTable.material = tableMat;
    this.trackMesh('meetingTable', meetingTable);

    const lightFixture = MeshBuilder.CreateTorus('lightFixture', { diameter: 3, thickness: 0.1 }, this.scene);
    lightFixture.position.y = 3.5;
    const lightMat = new StandardMaterial('lightMat', this.scene);
    lightMat.emissiveColor = new Color3(1, 1, 1);
    lightFixture.material = lightMat;
    this.trackMesh('lightFixture', lightFixture);

    // AD in meeting room
    this.createCharacter('ad', adConfig, 2, 0, -2, 0);
    
    // Manager in meeting room
    this.createCharacter('manager', managerConfig, -2, 0, -2, 0);

    // === PERSONAL OFFICES (Radial layout) ===
    const corridorLength = 8;
    const officeWidth = 6;
    const officeDepth = 5;
    
    teamMembers.forEach((member) => {
      if (member.id === 'you') return;
      
      const angle = (member.angle * Math.PI) / 180;
      const corridorX = Math.sin(angle) * (6 + corridorLength / 2);
      const corridorZ = Math.cos(angle) * (6 + corridorLength / 2);
      
      // Corridor floor
      const corridorFloor = MeshBuilder.CreateBox(`corridor_${member.id}`, {
        width: 3, height: 0.1, depth: corridorLength
      }, this.scene);
      corridorFloor.position = new Vector3(corridorX, 0.05, corridorZ);
      corridorFloor.rotation.y = -angle;
      corridorFloor.material = floorMat;
      corridorFloor.checkCollisions = true;
      this.trackMesh(`corridor_${member.id}`, corridorFloor);

      // Light strip
      const lightStrip = MeshBuilder.CreateBox(`lightStrip_${member.id}`, {
        width: 0.1, height: 0.02, depth: corridorLength - 1
      }, this.scene);
      lightStrip.position = new Vector3(corridorX, 0.06, corridorZ);
      lightStrip.rotation.y = -angle;
      const stripMat = new StandardMaterial(`stripMat_${member.id}`, this.scene);
      stripMat.emissiveColor = Color3.FromHexString('#03ABEA');
      lightStrip.material = stripMat;
      this.trackMesh(`lightStrip_${member.id}`, lightStrip);

      // Office position
      const officeX = Math.sin(angle) * (6 + corridorLength + officeDepth / 2);
      const officeZ = Math.cos(angle) * (6 + corridorLength + officeDepth / 2);
      
      // Office floor
      const officeFloor = MeshBuilder.CreateBox(`officeFloor_${member.id}`, {
        width: officeWidth, height: 0.1, depth: officeDepth
      }, this.scene);
      officeFloor.position = new Vector3(officeX, 0.05, officeZ);
      officeFloor.rotation.y = -angle;
      officeFloor.material = floorMat;
      officeFloor.checkCollisions = true;
      this.trackMesh(`officeFloor_${member.id}`, officeFloor);

      // Walls
      const wallHeight = 3;
      const backWallDist = officeDepth / 2;
      
      const backWall = MeshBuilder.CreateBox(`backWall_${member.id}`, {
        width: officeWidth, height: wallHeight, depth: 0.2
      }, this.scene);
      backWall.position = new Vector3(
        officeX + Math.sin(angle) * backWallDist,
        wallHeight / 2,
        officeZ + Math.cos(angle) * backWallDist
      );
      backWall.rotation.y = -angle;
      backWall.material = wallMat;
      backWall.checkCollisions = true;
      this.trackMesh(`backWall_${member.id}`, backWall);

      [-1, 1].forEach((side) => {
        const sideWall = MeshBuilder.CreateBox(`sideWall_${member.id}_${side}`, {
          width: 0.2, height: wallHeight, depth: officeDepth
        }, this.scene);
        const perpAngle = angle + Math.PI / 2;
        sideWall.position = new Vector3(
          officeX + Math.sin(perpAngle) * (officeWidth / 2) * side,
          wallHeight / 2,
          officeZ + Math.cos(perpAngle) * (officeWidth / 2) * side
        );
        sideWall.rotation.y = -angle;
        sideWall.material = wallMat;
        sideWall.checkCollisions = true;
        this.trackMesh(`sideWall_${member.id}_${side}`, sideWall);
      });

      // Window
      const windowMesh = MeshBuilder.CreateBox(`window_${member.id}`, {
        width: 3, height: 1.5, depth: 0.05
      }, this.scene);
      windowMesh.position = new Vector3(
        officeX + Math.sin(angle) * (backWallDist - 0.1),
        1.7,
        officeZ + Math.cos(angle) * (backWallDist - 0.1)
      );
      windowMesh.rotation.y = -angle;
      windowMesh.material = glassMat;
      this.trackMesh(`window_${member.id}`, windowMesh);

      // Desk
      const desk = MeshBuilder.CreateBox(`desk_${member.id}`, {
        width: 1.8, height: 0.75, depth: 0.8
      }, this.scene);
      desk.position = new Vector3(
        officeX + Math.sin(angle) * 1,
        0.375,
        officeZ + Math.cos(angle) * 1
      );
      desk.rotation.y = -angle;
      desk.material = tableMat;
      this.trackMesh(`desk_${member.id}`, desk);

      // Monitor
      const monitor = MeshBuilder.CreateBox(`monitor_${member.id}`, {
        width: 0.6, height: 0.4, depth: 0.05
      }, this.scene);
      monitor.position = new Vector3(
        officeX + Math.sin(angle) * 1.3,
        1.0,
        officeZ + Math.cos(angle) * 1.3
      );
      monitor.rotation.y = -angle;
      const monitorMat = new StandardMaterial(`monitorMat_${member.id}`, this.scene);
      monitorMat.emissiveColor = new Color3(0.1, 0.2, 0.4);
      monitor.material = monitorMat;
      this.trackMesh(`monitor_${member.id}`, monitor);

      // Avatar
      const avatarX = officeX - Math.sin(angle) * 0.5;
      const avatarZ = officeZ - Math.cos(angle) * 0.5;
      this.createCharacter(member.id, member, avatarX, 0, avatarZ, angle);

      // AL next to online members
      if (member.status === 'online') {
        const perpAngle = angle + Math.PI / 2;
        const alX = avatarX + Math.sin(perpAngle) * 1.2;
        const alZ = avatarZ + Math.cos(perpAngle) * 1.2;
        this.createAL(alX, alZ, angle, member.id);
      }

      // Room label
      this.createLabel(member.name, officeX, 3.2, officeZ, member.color);
    });

    // Ground
    const ground = MeshBuilder.CreateGround('ground', { width: 100, height: 100 }, this.scene);
    const groundMat = new StandardMaterial('groundMat', this.scene);
    groundMat.diffuseColor = new Color3(0.05, 0.05, 0.08);
    ground.material = groundMat;
    ground.position.y = -0.01;
    this.trackMesh('ground', ground);
  }

  private createCharacter(id: string, config: any, x: number, y: number, z: number, angle: number) {
    const color = Color3.FromHexString(config.color);
    
    const body = MeshBuilder.CreateCapsule(`body_${id}`, { height: 1.2, radius: 0.25 }, this.scene);
    body.position = new Vector3(x, 0.9, z);
    
    const bodyMat = new StandardMaterial(`bodyMat_${id}`, this.scene);
    bodyMat.diffuseColor = color;
    bodyMat.emissiveColor = color.scale(0.2);
    body.material = bodyMat;

    const head = MeshBuilder.CreateSphere(`head_${id}`, { diameter: 0.35 }, this.scene);
    head.position = new Vector3(0, 0.75, 0);
    head.material = bodyMat;
    head.parent = body;

    if (config.status === 'twin') {
      const ring = MeshBuilder.CreateTorus(`ring_${id}`, { diameter: 0.5, thickness: 0.05 }, this.scene);
      ring.parent = body;
      ring.position = new Vector3(0, 1.1, 0);
      ring.rotation.x = Math.PI / 2;
      const ringMat = new StandardMaterial(`ringMat_${id}`, this.scene);
      ringMat.emissiveColor = new Color3(1, 0.6, 0);
      ring.material = ringMat;
    }

    body.actionManager = new ActionManager(this.scene);
    body.metadata = { type: 'character', id, config };
    
    body.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
        if (!isEditorMode) this.openCharacterChat(id, config);
      })
    );

    this.trackMesh(`body_${id}`, body);
  }

  private createAL(x: number, z: number, angle: number, nearMemberId: string) {
    const alId = `al_near_${nearMemberId}`;
    const color = Color3.FromHexString(alConfig.color);
    
    const body = MeshBuilder.CreateCapsule(`body_${alId}`, { height: 1.2, radius: 0.22 }, this.scene);
    body.position = new Vector3(x, 0.85, z);
    
    const bodyMat = new StandardMaterial(`bodyMat_${alId}`, this.scene);
    bodyMat.diffuseColor = color;
    bodyMat.emissiveColor = color.scale(0.3);
    body.material = bodyMat;

    const head = MeshBuilder.CreateSphere(`head_${alId}`, { diameter: 0.32 }, this.scene);
    head.position = new Vector3(0, 0.8, 0);
    head.material = bodyMat;
    head.parent = body;

    const ring = MeshBuilder.CreateTorus(`ring_${alId}`, { diameter: 0.45, thickness: 0.04 }, this.scene);
    ring.parent = body;
    ring.position = new Vector3(0, 1.1, 0);
    ring.rotation.x = Math.PI / 2;
    const ringMat = new StandardMaterial(`ringMat_${alId}`, this.scene);
    ringMat.emissiveColor = Color3.FromHexString(alConfig.color);
    ring.material = ringMat;

    body.actionManager = new ActionManager(this.scene);
    body.metadata = { type: 'al', id: 'al', config: alConfig };
    
    body.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
        if (!isEditorMode) this.openCharacterChat('al', alConfig);
      })
    );

    this.trackMesh(`body_${alId}`, body);
  }

  private createLabel(text: string, x: number, y: number, z: number, color: string) {
    const label = MeshBuilder.CreateBox(`label_${text}`, { width: 1.5, height: 0.3, depth: 0.1 }, this.scene);
    label.position = new Vector3(x, y, z);
    label.billboardMode = Mesh.BILLBOARDMODE_Y;
    
    const labelMat = new StandardMaterial(`labelMat_${text}`, this.scene);
    labelMat.diffuseColor = Color3.FromHexString(color);
    labelMat.emissiveColor = Color3.FromHexString(color).scale(0.5);
    label.material = labelMat;
    this.trackMesh(`label_${text}`, label);
  }

  // Load saved positions from localStorage and apply them
  private loadSavedPositions() {
    const saved = loadSceneData();
    
    // If user has saved changes, use those
    if (saved && saved.objects && saved.objects.length > 0) {
      console.log('Loading saved positions for', saved.objects.length, 'objects');
      this.applyPositions(saved.objects);
      return;
    }
    
    // Otherwise use default positions (PASTE YOUR EXPORTED JSON OBJECTS HERE)
    const defaultObjects = [
        {
        "id": "meetingFloor",
        "name": "meetingFloor",
        "type": "box",
        "position": {
          "x": 0,
          "y": 0.05,
          "z": 0
        },
        "rotation": {
          "x": 0,
          "y": 0,
          "z": 0
        },
        "scaling": {
          "x": 1,
          "y": 1,
          "z": 1
        }
      },
      {
        "id": "meetingTable",
        "name": "meetingTable",
        "type": "box",
        "position": {
          "x": 0,
          "y": 0.4,
          "z": 0
        },
        "rotation": {
          "x": 0,
          "y": 0,
          "z": 0
        },
        "scaling": {
          "x": 1,
          "y": 1,
          "z": 1
        }
      },
      {
        "id": "lightFixture",
        "name": "lightFixture",
        "type": "box",
        "position": {
          "x": 0,
          "y": 3.5,
          "z": 0
        },
        "rotation": {
          "x": 0,
          "y": 0,
          "z": 0
        },
        "scaling": {
          "x": 1,
          "y": 1,
          "z": 1
        }
      },
      {
        "id": "body_ad",
        "name": "body_ad",
        "type": "box",
        "position": {
          "x": 2,
          "y": 0.9,
          "z": -2
        },
        "rotation": {
          "x": 0,
          "y": 0,
          "z": 0
        },
        "scaling": {
          "x": 1,
          "y": 1,
          "z": 1
        }
      },
      {
        "id": "body_manager",
        "name": "body_manager",
        "type": "box",
        "position": {
          "x": -2,
          "y": 0.9,
          "z": -2
        },
        "rotation": {
          "x": 0,
          "y": 0,
          "z": 0
        },
        "scaling": {
          "x": 1,
          "y": 1,
          "z": 1
        }
      },
      {
        "id": "corridor_alex",
        "name": "corridor_alex",
        "type": "box",
        "position": {
          "x": 8.691656112670898,
          "y": 0.05000000074505806,
          "z": 5.044383525848389
        },
        "rotation": {
          "x": 0,
          "y": -1.9676145396320255,
          "z": 0
        },
        "scaling": {
          "x": 0.999999970771519,
          "y": 1,
          "z": 0.999999970771519
        }
      },
      {
        "id": "lightStrip_alex",
        "name": "lightStrip_alex",
        "type": "box",
        "position": {
          "x": 9.510564804077148,
          "y": 0.05999999865889549,
          "z": 3.090169906616211
        },
        "rotation": {
          "x": 0,
          "y": -1.9571183165014736,
          "z": 0
        },
        "scaling": {
          "x": 1.0000000293840525,
          "y": 1,
          "z": 1.0000000293840525
        }
      },
      {
        "id": "officeFloor_alex",
        "name": "officeFloor_alex",
        "type": "box",
        "position": {
          "x": 15.692432518870033,
          "y": 0.05,
          "z": 5.0987804071866325
        },
        "rotation": {
          "x": 0,
          "y": -1.2566370614359172,
          "z": 0
        },
        "scaling": {
          "x": 1,
          "y": 1,
          "z": 1
        }
      },
      {
        "id": "backWall_alex",
        "name": "backWall_alex",
        "type": "box",
        "position": {
          "x": 18.33655548095703,
          "y": 1.5,
          "z": 4.1762189865112305
        },
        "rotation": {
          "x": 0,
          "y": -1.2566371008426058,
          "z": 0
        },
        "scaling": {
          "x": 1.0000000158832683,
          "y": 1,
          "z": 1.0000000158832683
        }
      },
      {
        "id": "sideWall_alex_-1",
        "name": "sideWall_alex_-1",
        "type": "box",
        "position": {
          "x": 16.65972328186035,
          "y": 1.5,
          "z": 8.166609764099121
        },
        "rotation": {
          "x": 0,
          "y": -1.2566371008426058,
          "z": 0
        },
        "scaling": {
          "x": 1.0000000158832683,
          "y": 1,
          "z": 1.0000000158832683
        }
      },
      {
        "id": "sideWall_alex_1",
        "name": "sideWall_alex_1",
        "type": "box",
        "position": {
          "x": 14.707275390625,
          "y": 1.5,
          "z": 2.0066888332366943
        },
        "rotation": {
          "x": 0,
          "y": -1.2566371008426058,
          "z": 0
        },
        "scaling": {
          "x": 1.0000000158832683,
          "y": 1,
          "z": 1.0000000158832683
        }
      },
      {
        "id": "window_alex",
        "name": "window_alex",
        "type": "box",
        "position": {
          "x": 18.346826553344727,
          "y": 1.7000000476837158,
          "z": 4.564899921417236
        },
        "rotation": {
          "x": 0,
          "y": -1.2566371008426058,
          "z": 0
        },
        "scaling": {
          "x": 1.0000000158832683,
          "y": 1,
          "z": 1.0000000158832683
        }
      },
      {
        "id": "desk_alex",
        "name": "desk_alex",
        "type": "box",
        "position": {
          "x": 16.643489035165185,
          "y": 0.375,
          "z": 5.40779740156158
        },
        "rotation": {
          "x": 0,
          "y": -1.2566370614359172,
          "z": 0
        },
        "scaling": {
          "x": 1,
          "y": 1,
          "z": 1
        }
      },
      {
        "id": "monitor_alex",
        "name": "monitor_alex",
        "type": "box",
        "position": {
          "x": 16.928805990053732,
          "y": 1,
          "z": 5.500502499874064
        },
        "rotation": {
          "x": 0,
          "y": -1.2566370614359172,
          "z": 0
        },
        "scaling": {
          "x": 1,
          "y": 1,
          "z": 1
        }
      },
      {
        "id": "body_alex",
        "name": "body_alex",
        "type": "box",
        "position": {
          "x": 15.216904260722456,
          "y": 0.9,
          "z": 4.944271909999159
        },
        "rotation": {
          "x": 0,
          "y": 0,
          "z": 0
        },
        "scaling": {
          "x": 1,
          "y": 1,
          "z": 1
        }
      },
      {
        "id": "label_Alex Chen",
        "name": "label_Alex Chen",
        "type": "box",
        "position": {
          "x": 15.692432518870033,
          "y": 3.2,
          "z": 5.0987804071866325
        },
        "rotation": {
          "x": 0,
          "y": 0,
          "z": 0
        },
        "scaling": {
          "x": 1,
          "y": 1,
          "z": 1
        }
      },
      {
        "id": "corridor_sara",
        "name": "corridor_sara",
        "type": "box",
        "position": {
          "x": 5.877852439880371,
          "y": 0.05000000074505806,
          "z": -8.090169906616211
        },
        "rotation": {
          "x": 0,
          "y": 2.5294087402479697,
          "z": 0
        },
        "scaling": {
          "x": 0.999999987667758,
          "y": 1,
          "z": 0.999999987667758
        }
      },
      {
        "id": "lightStrip_sara",
        "name": "lightStrip_sara",
        "type": "box",
        "position": {
          "x": 4.692692279815674,
          "y": 0.05999999865889549,
          "z": -9.800972938537598
        },
        "rotation": {
          "x": 0,
          "y": 2.5450596504917717,
          "z": 0
        },
        "scaling": {
          "x": 0.9999999562824681,
          "y": 1,
          "z": 0.9999999562824681
        }
      },
      {
        "id": "officeFloor_sara",
        "name": "officeFloor_sara",
        "type": "box",
        "position": {
          "x": 9.698456662825809,
          "y": 0.05,
          "z": -13.34878040718663
        },
        "rotation": {
          "x": 0,
          "y": -2.5132741228718345,
          "z": 0
        },
        "scaling": {
          "x": 1,
          "y": 1,
          "z": 1
        }
      },
      {
        "id": "backWall_sara",
        "name": "backWall_sara",
        "type": "box",
        "position": {
          "x": 12.460829734802246,
          "y": 1.5,
          "z": -15.181846618652344
        },
        "rotation": {
          "x": 0,
          "y": 2.1986720966480684,
          "z": 0
        },
        "scaling": {
          "x": 0.9999999431966434,
          "y": 1,
          "z": 0.9999999431966434
        }
      },
      {
        "id": "sideWall_sara_-1",
        "name": "sideWall_sara_-1",
        "type": "box",
        "position": {
          "x": 11.00578784942627,
          "y": 1.5,
          "z": -10.783385276794434
        },
        "rotation": {
          "x": 0,
          "y": 2.192369020622675,
          "z": 0
        },
        "scaling": {
          "x": 0.9999998422583243,
          "y": 1,
          "z": 0.9999998422583243
        }
      },
      {
        "id": "sideWall_sara_1",
        "name": "sideWall_sara_1",
        "type": "box",
        "position": {
          "x": 8.008563995361328,
          "y": 1.5,
          "z": -15.659994125366211
        },
        "rotation": {
          "x": 0,
          "y": 2.2099331763615737,
          "z": 0
        },
        "scaling": {
          "x": 1.0000001416730917,
          "y": 1,
          "z": 1.0000001416730917
        }
      },
      {
        "id": "window_sara",
        "name": "window_sara",
        "type": "box",
        "position": {
          "x": 11.856350898742676,
          "y": 1.7000000476837158,
          "z": -15.803747177124023
        },
        "rotation": {
          "x": 0,
          "y": 2.194026027276305,
          "z": 0
        },
        "scaling": {
          "x": 1.0000000957319048,
          "y": 1,
          "z": 1.0000000957319048
        }
      },
      {
        "id": "desk_sara",
        "name": "desk_sara",
        "type": "box",
        "position": {
          "x": 10.286241915118282,
          "y": 0.375,
          "z": -14.157797401561577
        },
        "rotation": {
          "x": 0,
          "y": -2.5132741228718345,
          "z": 0
        },
        "scaling": {
          "x": 1,
          "y": 1,
          "z": 1
        }
      },
      {
        "id": "monitor_sara",
        "name": "monitor_sara",
        "type": "box",
        "position": {
          "x": 10.462577490806025,
          "y": 1,
          "z": -14.400502499874062
        },
        "rotation": {
          "x": 0,
          "y": -2.5132741228718345,
          "z": 0
        },
        "scaling": {
          "x": 1,
          "y": 1,
          "z": 1
        }
      },
      {
        "id": "body_sara",
        "name": "body_sara",
        "type": "box",
        "position": {
          "x": 9.404564036679572,
          "y": 0.9,
          "z": -12.944271909999157
        },
        "rotation": {
          "x": 0,
          "y": 0,
          "z": 0
        },
        "scaling": {
          "x": 1,
          "y": 1,
          "z": 1
        }
      },
      {
        "id": "body_al_near_sara",
        "name": "body_al_near_sara",
        "type": "box",
        "position": {
          "x": 8.433743643429635,
          "y": 0.85,
          "z": -13.649614212750125
        },
        "rotation": {
          "x": 0,
          "y": 0,
          "z": 0
        },
        "scaling": {
          "x": 1,
          "y": 1,
          "z": 1
        }
      },
      {
        "id": "label_Sara Mueller",
        "name": "label_Sara Mueller",
        "type": "box",
        "position": {
          "x": 9.698456662825809,
          "y": 3.2,
          "z": -13.34878040718663
        },
        "rotation": {
          "x": 0,
          "y": 0,
          "z": 0
        },
        "scaling": {
          "x": 1,
          "y": 1,
          "z": 1
        }
      },
      {
        "id": "corridor_kevin",
        "name": "corridor_kevin",
        "type": "box",
        "position": {
          "x": -5.877852439880371,
          "y": 0.05000000074505806,
          "z": -8.090169906616211
        },
        "rotation": {
          "x": 0,
          "y": 0.6192429986030956,
          "z": 0
        },
        "scaling": {
          "x": 1.0000002078259447,
          "y": 1,
          "z": 1.0000002078259447
        }
      },
      {
        "id": "lightStrip_kevin",
        "name": "lightStrip_kevin",
        "type": "box",
        "position": {
          "x": -4.518919944763184,
          "y": 0.05999999865889549,
          "z": -9.629444122314453
        },
        "rotation": {
          "x": 0,
          "y": 0.6083940721612544,
          "z": 0
        },
        "scaling": {
          "x": 0.9999999249373815,
          "y": 1,
          "z": 0.9999999249373815
        }
      },
      {
        "id": "officeFloor_kevin",
        "name": "officeFloor_kevin",
        "type": "box",
        "position": {
          "x": -9.698456662825805,
          "y": 0.05,
          "z": -13.348780407186634
        },
        "rotation": {
          "x": 0,
          "y": -3.7699111843077517,
          "z": 0
        },
        "scaling": {
          "x": 1,
          "y": 1,
          "z": 1
        }
      },
      {
        "id": "backWall_kevin",
        "name": "backWall_kevin",
        "type": "box",
        "position": {
          "x": -8.147476196289062,
          "y": 1.5,
          "z": -15.56772232055664
        },
        "rotation": {
          "x": 0,
          "y": 2.5132741338430824,
          "z": 0
        },
        "scaling": {
          "x": 1.000000001758865,
          "y": 1,
          "z": 1.000000001758865
        }
      },
      {
        "id": "sideWall_kevin_-1",
        "name": "sideWall_kevin_-1",
        "type": "box",
        "position": {
          "x": -12.33226203918457,
          "y": 1.5,
          "z": -15.297870635986328
        },
        "rotation": {
          "x": 0,
          "y": 2.5132741338430824,
          "z": 0
        },
        "scaling": {
          "x": 1.000000001758865,
          "y": 1,
          "z": 1.000000001758865
        }
      },
      {
        "id": "sideWall_kevin_1",
        "name": "sideWall_kevin_1",
        "type": "box",
        "position": {
          "x": -11.18486213684082,
          "y": 1.5,
          "z": -10.926348686218262
        },
        "rotation": {
          "x": 0,
          "y": 0.9596240789648762,
          "z": 0
        },
        "scaling": {
          "x": 0.9999999424430613,
          "y": 1,
          "z": 0.9999999424430613
        }
      },
      {
        "id": "window_kevin",
        "name": "window_kevin",
        "type": "box",
        "position": {
          "x": -11.678564071655273,
          "y": 1.7000000476837158,
          "z": -11.380577087402344
        },
        "rotation": {
          "x": 0,
          "y": 2.5383506854285716,
          "z": 0
        },
        "scaling": {
          "x": 1.000000024536362,
          "y": 1,
          "z": 1.000000024536362
        }
      },
      {
        "id": "desk_kevin",
        "name": "desk_kevin",
        "type": "box",
        "position": {
          "x": -9.786338806152344,
          "y": 0.375,
          "z": -14.845865249633789
        },
        "rotation": {
          "x": 0,
          "y": 2.5132741338430824,
          "z": 0
        },
        "scaling": {
          "x": 1.000000001758865,
          "y": 1,
          "z": 1.000000001758865
        }
      },
      {
        "id": "monitor_kevin",
        "name": "monitor_kevin",
        "type": "box",
        "position": {
          "x": -9.93441104888916,
          "y": 1,
          "z": -15.127463340759277
        },
        "rotation": {
          "x": 0,
          "y": 2.5132741338430824,
          "z": 0
        },
        "scaling": {
          "x": 1.000000001758865,
          "y": 1,
          "z": 1.000000001758865
        }
      },
      {
        "id": "body_kevin",
        "name": "body_kevin",
        "type": "box",
        "position": {
          "x": -9.404564036679568,
          "y": 0.9,
          "z": -12.944271909999161
        },
        "rotation": {
          "x": 0,
          "y": 0,
          "z": 0
        },
        "scaling": {
          "x": 1,
          "y": 1,
          "z": 1
        }
      },
      {
        "id": "body_al_near_kevin",
        "name": "body_al_near_kevin",
        "type": "box",
        "position": {
          "x": -10.375384429929506,
          "y": 0.85,
          "z": -12.238929607248194
        },
        "rotation": {
          "x": 0,
          "y": 0,
          "z": 0
        },
        "scaling": {
          "x": 1,
          "y": 1,
          "z": 1
        }
      },
      {
        "id": "label_Kevin Park",
        "name": "label_Kevin Park",
        "type": "box",
        "position": {
          "x": -9.698456662825805,
          "y": 3.2,
          "z": -13.348780407186634
        },
        "rotation": {
          "x": 0,
          "y": 0,
          "z": 0
        },
        "scaling": {
          "x": 1,
          "y": 1,
          "z": 1
        }
      },
      {
        "id": "corridor_julia",
        "name": "corridor_julia",
        "type": "box",
        "position": {
          "x": -8.809350967407227,
          "y": 0.05000000074505806,
          "z": 5.37846040725708
        },
        "rotation": {
          "x": 0,
          "y": 1.908991934814837,
          "z": 0
        },
        "scaling": {
          "x": 0.9999997925094724,
          "y": 1,
          "z": 0.9999997925094724
        }
      },
      {
        "id": "lightStrip_julia",
        "name": "lightStrip_julia",
        "type": "box",
        "position": {
          "x": -9.452568054199219,
          "y": 0.05999999865889549,
          "z": 3.245972156524658
        },
        "rotation": {
          "x": 0,
          "y": 1.927159514812511,
          "z": 0
        },
        "scaling": {
          "x": 1.000000035350822,
          "y": 1,
          "z": 1.000000035350822
        }
      },
      {
        "id": "officeFloor_julia",
        "name": "officeFloor_julia",
        "type": "box",
        "position": {
          "x": -15.692432518870035,
          "y": 0.05,
          "z": 5.098780407186629
        },
        "rotation": {
          "x": 0,
          "y": -5.026548245743669,
          "z": 0
        },
        "scaling": {
          "x": 1,
          "y": 1,
          "z": 1
        }
      },
      {
        "id": "backWall_julia",
        "name": "backWall_julia",
        "type": "box",
        "position": {
          "x": -18.251144409179688,
          "y": 1.5,
          "z": 4.305235862731934
        },
        "rotation": {
          "x": 0,
          "y": 1.2566371008426058,
          "z": 0
        },
        "scaling": {
          "x": 1.0000000158832683,
          "y": 1,
          "z": 1.0000000158832683
        }
      },
      {
        "id": "sideWall_julia_-1",
        "name": "sideWall_julia_-1",
        "type": "box",
        "position": {
          "x": -14.636935234069824,
          "y": 1.5,
          "z": 1.993015170097351
        },
        "rotation": {
          "x": 0,
          "y": 1.2566371008426058,
          "z": 0
        },
        "scaling": {
          "x": 1.0000000158832683,
          "y": 1,
          "z": 1.0000000158832683
        }
      },
      {
        "id": "sideWall_julia_1",
        "name": "sideWall_julia_1",
        "type": "box",
        "position": {
          "x": -16.721233367919922,
          "y": 1.5,
          "z": 8.159476280212402
        },
        "rotation": {
          "x": 0,
          "y": 1.2566371008426058,
          "z": 0
        },
        "scaling": {
          "x": 1.0000000158832683,
          "y": 1,
          "z": 1.0000000158832683
        }
      },
      {
        "id": "window_julia",
        "name": "window_julia",
        "type": "box",
        "position": {
          "x": -18.15756607055664,
          "y": 1.7000000476837158,
          "z": 4.283570289611816
        },
        "rotation": {
          "x": 0,
          "y": 1.2566371008426058,
          "z": 0
        },
        "scaling": {
          "x": 1.0000000158832683,
          "y": 1,
          "z": 1.0000000158832683
        }
      },
      {
        "id": "desk_julia",
        "name": "desk_julia",
        "type": "box",
        "position": {
          "x": -16.64348903516519,
          "y": 0.375,
          "z": 5.407797401561576
        },
        "rotation": {
          "x": 0,
          "y": -5.026548245743669,
          "z": 0
        },
        "scaling": {
          "x": 1,
          "y": 1,
          "z": 1
        }
      },
      {
        "id": "monitor_julia",
        "name": "monitor_julia",
        "type": "box",
        "position": {
          "x": -16.928805990053736,
          "y": 1,
          "z": 5.50050249987406
        },
        "rotation": {
          "x": 0,
          "y": -5.026548245743669,
          "z": 0
        },
        "scaling": {
          "x": 1,
          "y": 1,
          "z": 1
        }
      },
      {
        "id": "body_julia",
        "name": "body_julia",
        "type": "box",
        "position": {
          "x": -15.216904260722458,
          "y": 0.9,
          "z": 4.944271909999156
        },
        "rotation": {
          "x": 0,
          "y": 0,
          "z": 0
        },
        "scaling": {
          "x": 1,
          "y": 1,
          "z": 1
        }
      },
      {
        "id": "label_Julia Santos",
        "name": "label_Julia Santos",
        "type": "box",
        "position": {
          "x": -15.692432518870035,
          "y": 3.2,
          "z": 5.098780407186629
        },
        "rotation": {
          "x": 0,
          "y": 0,
          "z": 0
        },
        "scaling": {
          "x": 1,
          "y": 1,
          "z": 1
        }
      },
      {
        "id": "ground",
        "name": "ground",
        "type": "box",
        "position": {
          "x": 0,
          "y": -0.01,
          "z": 0
        },
        "rotation": {
          "x": 0,
          "y": 0,
          "z": 0
        },
        "scaling": {
          "x": 1,
          "y": 1,
          "z": 1
        }
      }
    ];
    
    if (defaultObjects.length > 0) {
      console.log('Loading default positions');
      this.applyPositions(defaultObjects);
    }
  }

  private applyPositions(objects: any[]) {
    objects.forEach(obj => {
      const mesh = this.trackedMeshes.get(obj.id);
      if (mesh) {
        mesh.position = new Vector3(obj.position.x, obj.position.y, obj.position.z);
        mesh.rotation = new Vector3(obj.rotation.x, obj.rotation.y, obj.rotation.z);
        mesh.scaling = new Vector3(obj.scaling.x, obj.scaling.y, obj.scaling.z);
      }
    });
  }

  // Save ALL tracked mesh positions
  public saveScene(): void {
    const objects: SceneObjectData[] = [];
    
    this.trackedMeshes.forEach((mesh, id) => {
      objects.push({
        id,
        name: mesh.name,
        type: 'box', // Generic type
        position: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
        rotation: { x: mesh.rotation.x, y: mesh.rotation.y, z: mesh.rotation.z },
        scaling: { x: mesh.scaling.x, y: mesh.scaling.y, z: mesh.scaling.z },
      });
    });
    
    saveSceneData({ 
      version: 1, 
      objects, 
      settings: { 
        fogEnabled: false, 
        fogStart: 60, 
        fogEnd: 250, 
        ambientIntensity: 0.4,
        alFigmaUrl: getALFigmaUrl() || undefined,
        adFigmaUrl: getADFigmaUrl() || undefined,
      } 
    });
    
    console.log('Saved', objects.length, 'objects');
  }

  public exportScene(): void {
    const objects: SceneObjectData[] = [];
    this.trackedMeshes.forEach((mesh, id) => {
      objects.push({
        id, name: mesh.name, type: 'box',
        position: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
        rotation: { x: mesh.rotation.x, y: mesh.rotation.y, z: mesh.rotation.z },
        scaling: { x: mesh.scaling.x, y: mesh.scaling.y, z: mesh.scaling.z },
      });
    });
    exportSceneToFile({ version: 1, objects, settings: { fogEnabled: false, fogStart: 60, fogEnd: 250, ambientIntensity: 0.4 } });
  }

  public importScene(): void {
    importSceneFromFile((data) => {
      saveSceneData(data);
      alert('Scene imported! Refresh to see changes.');
    });
  }

  private setupInteraction() {
    this.scene.onKeyboardObservable.add((kbInfo) => {
      if (kbInfo.type === KeyboardEventTypes.KEYDOWN) {
        if (kbInfo.event.key === 'i' || kbInfo.event.key === 'I') {
          this.toggleInspector();
        }
        if ((kbInfo.event.key === 'e' || kbInfo.event.key === 'E') && !isEditorMode) {
          if (currentLookingAt) {
            this.openCharacterChat(currentLookingAt.id, currentLookingAt.config);
          }
        }
        if (kbInfo.event.key === 'Escape') {
          closeChat();
        }
      }
    });

    this.canvas.addEventListener('click', () => {
      if (!isPointerLocked && !isEditorMode && !document.querySelector('.modal.visible')) {
        this.canvas.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      isPointerLocked = document.pointerLockElement === this.canvas;
      document.getElementById('crosshair')!.style.display = isPointerLocked ? 'block' : 'none';
    });
  }

  private checkLookingAt() {
    if (!isPointerLocked) return;
    
    const ray = this.scene.createPickingRay(
      this.engine.getRenderWidth() / 2,
      this.engine.getRenderHeight() / 2,
      null,
      this.camera
    );
    
    const hit = this.scene.pickWithRay(ray, (mesh) => mesh.metadata?.type === 'character' || mesh.metadata?.type === 'al');
    const prompt = document.getElementById('interact-prompt')!;
    
    if (hit?.pickedMesh?.metadata && hit.distance < 5) {
      currentLookingAt = hit.pickedMesh.metadata;
      prompt.classList.add('visible');
      const name = currentLookingAt.config?.name || currentLookingAt.config?.fullName || 'AL';
      prompt.innerHTML = `Press <strong>E</strong> to talk to ${name}`;
    } else {
      currentLookingAt = null;
      prompt.classList.remove('visible');
    }
  }

  private initializeConversations() {
    initConversation('al', alConfig.personality, alConfig.greeting);
    initConversation('ad', adConfig.personality, adConfig.greeting);
    initConversation('manager', managerConfig.personality, managerConfig.greeting);
    
    teamMembers.forEach(member => {
      if (member.id !== 'you' && member.personality) {
        initConversation(member.id, member.personality, member.greeting || `Hello, I'm ${member.name}.`);
      }
    });

    initSpeechRecognition(
      (text) => handleVoiceInput(text),
      () => { isListening = false; updateMicButton(); }
    );
  }

  private openCharacterChat(id: string, config: any) {
    currentConversation = id;
    document.exitPointerLock();
    
    // Show appropriate Figma UI
    const alFigma = document.getElementById('figma-al')!;
    const adFigma = document.getElementById('figma-ad')!;
    
    if (id === 'al') {
      const url = getALFigmaUrl();
      if (url) {
        alFigma.innerHTML = `<iframe src="${url}" style="width:100%;height:100%;border:none;"></iframe>`;
        alFigma.style.display = 'block';
      }
      adFigma.style.display = 'none';
    } else if (id === 'ad') {
      const url = getADFigmaUrl();
      if (url) {
        adFigma.innerHTML = `<iframe src="${url}" style="width:100%;height:100%;border:none;"></iframe>`;
        adFigma.style.display = 'block';
      }
      alFigma.style.display = 'none';
    } else {
      alFigma.style.display = 'none';
      adFigma.style.display = 'none';
    }
    
    const modal = document.getElementById('chat-modal')!;
    document.getElementById('chat-avatar')!.textContent = config.name?.[0] || 'A';
    (document.getElementById('chat-avatar')! as HTMLElement).style.background = config.color;
    document.getElementById('chat-name')!.textContent = config.name || config.fullName;
    document.getElementById('chat-role')!.textContent = config.role;
    
    document.getElementById('twin-notice')!.style.display = config.status === 'twin' ? 'block' : 'none';
    
    const pending = document.getElementById('pending-info')!;
    pending.style.display = config.pendingInfo ? 'block' : 'none';
    if (config.pendingInfo) pending.textContent = '💡 ' + config.pendingInfo;
    
    const msgs = document.getElementById('chat-messages')!;
    msgs.innerHTML = '';
    getConversationHistory(id).forEach(m => addMessageToUI(m.content, m.role === 'assistant'));
    
    modal.classList.add('visible');
    
    const history = getConversationHistory(id);
    if (history.length === 1) speak(history[0].content);
  }

  public toggleInspector(): void {
    if (this.scene.debugLayer.isVisible()) {
      this.scene.debugLayer.hide();
      isEditorMode = false;
      document.getElementById('editor-panel')!.classList.remove('visible');
    } else {
      this.scene.debugLayer.show({ embedMode: true, overlay: false });
      isEditorMode = true;
      document.exitPointerLock();
      document.getElementById('editor-panel')!.classList.add('visible');
    }
  }
}

// === UI HELPERS ===
function addMessageToUI(content: string, isAI: boolean) {
  const msgs = document.getElementById('chat-messages')!;
  const div = document.createElement('div');
  div.className = `chat-message ${isAI ? 'ai' : 'user'}`;
  div.textContent = content;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function updateMicButton() {
  const btn = document.getElementById('mic-btn');
  if (btn) {
    btn.textContent = isListening ? '🔴' : '🎤';
    btn.classList.toggle('active', isListening);
  }
}

async function handleVoiceInput(text: string) {
  if (!currentConversation) return;
  addMessageToUI(text, false);
  const response = await sendMessage(currentConversation, text);
  addMessageToUI(response, true);
  speak(response);
}

// === GLOBALS ===
let game: VirtualOffice;

(window as any).startGame = () => {
  document.getElementById('instructions')!.classList.add('hidden');
  game = new VirtualOffice(document.getElementById('renderCanvas') as HTMLCanvasElement);
  (document.getElementById('renderCanvas') as HTMLCanvasElement).requestPointerLock();
};

(window as any).closeChat = () => {
  document.getElementById('chat-modal')!.classList.remove('visible');
  document.getElementById('figma-al')!.style.display = 'none';
  document.getElementById('figma-ad')!.style.display = 'none';
  currentConversation = null;
  window.speechSynthesis.cancel();
};
const closeChat = (window as any).closeChat;

(window as any).sendChatMessage = async () => {
  if (!currentConversation) return;
  const input = document.getElementById('chat-input') as HTMLInputElement;
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  addMessageToUI(text, false);
  const response = await sendMessage(currentConversation, text);
  addMessageToUI(response, true);
  speak(response);
};

(window as any).handleChatKeypress = (e: KeyboardEvent) => {
  if (e.key === 'Enter') (window as any).sendChatMessage();
};

(window as any).toggleMic = () => {
  if (isListening) { stopListening(); isListening = false; }
  else { startListening(); isListening = true; }
  updateMicButton();
};

(window as any).toggleInspector = () => game?.toggleInspector();
(window as any).saveScene = () => { game?.saveScene(); alert('Scene saved! Your changes will persist on reload.'); };
(window as any).exportScene = () => game?.exportScene();
(window as any).importScene = () => game?.importScene();
(window as any).resetScene = () => { 
  if (confirm('This will reset everything to default. Are you sure?')) {
    clearSceneData(); 
    location.reload(); 
  }
};

(window as any).setApiKey = (key: string) => setApiKey(key);
(window as any).showApiKeyPrompt = () => {
  const key = prompt('Enter Claude API key (leave blank for demo mode):');
  if (key) { setApiKey(key); alert('API key set!'); }
};

(window as any).setALFigmaUrl = () => {
  const url = prompt('Enter Figma embed URL for AL interface:\n(Figma > Share > Get embed code > copy src URL)');
  if (url) { setALFigmaUrl(url); alert('AL Figma URL saved!'); }
};

(window as any).setADFigmaUrl = () => {
  const url = prompt('Enter Figma embed URL for AD interface:\n(Figma > Share > Get embed code > copy src URL)');
  if (url) { setADFigmaUrl(url); alert('AD Figma URL saved!'); }
};
