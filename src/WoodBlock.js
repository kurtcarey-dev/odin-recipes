import * as THREE from 'three';

export class WoodBlock {
    constructor(scene, woodType = 'oak') {
        this.scene = scene;
        this.woodType = woodType;
        this.resolution = 100; // Higher = more detail but slower
        this.width = 8;
        this.height = 6;
        this.depth = 8;

        // Create heightmap for carving
        this.heightMap = [];
        this.initHeightMap();

        // Create geometry
        this.geometry = new THREE.PlaneGeometry(
            this.width,
            this.depth,
            this.resolution,
            this.resolution
        );

        // Rotate to make it horizontal
        this.geometry.rotateX(-Math.PI / 2);

        // Create material
        this.material = this.createWoodMaterial(woodType);

        // Create mesh
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);

        // Store original positions for reset
        this.originalPositions = this.geometry.attributes.position.array.slice();
    }

    initHeightMap() {
        this.heightMap = [];
        for (let i = 0; i <= this.resolution; i++) {
            this.heightMap[i] = [];
            for (let j = 0; j <= this.resolution; j++) {
                this.heightMap[i][j] = this.height / 2;
            }
        }
    }

    createWoodMaterial(woodType) {
        const woodColors = {
            oak: { base: 0xc19a6b, dark: 0x8b6f47, grain: 0x7a5a3a },
            walnut: { base: 0x5a3a29, dark: 0x3e2a1f, grain: 0x2d1f15 },
            pine: { base: 0xf4e4c1, dark: 0xd4c4a1, grain: 0xb4a481 },
            cherry: { base: 0xb85450, dark: 0x984540, grain: 0x783530 }
        };

        const colors = woodColors[woodType] || woodColors.oak;

        // Create procedural wood texture
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');

        // Base color
        ctx.fillStyle = `#${colors.base.toString(16).padStart(6, '0')}`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add wood grain using noise-like patterns
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * canvas.width;
            const grainWidth = 2 + Math.random() * 4;
            const opacity = 0.1 + Math.random() * 0.3;

            const gradient = ctx.createLinearGradient(x, 0, x + grainWidth, 0);
            gradient.addColorStop(0, `rgba(${(colors.grain >> 16) & 255}, ${(colors.grain >> 8) & 255}, ${colors.grain & 255}, 0)`);
            gradient.addColorStop(0.5, `rgba(${(colors.grain >> 16) & 255}, ${(colors.grain >> 8) & 255}, ${colors.grain & 255}, ${opacity})`);
            gradient.addColorStop(1, `rgba(${(colors.grain >> 16) & 255}, ${(colors.grain >> 8) & 255}, ${colors.grain & 255}, 0)`);

            ctx.fillStyle = gradient;
            ctx.fillRect(x, 0, grainWidth, canvas.height);
        }

        // Add ring patterns (growth rings)
        ctx.strokeStyle = `rgba(${(colors.dark >> 16) & 255}, ${(colors.dark >> 8) & 255}, ${colors.dark & 255}, 0.15)`;
        for (let i = 0; i < 20; i++) {
            const x = (i / 20) * canvas.width;
            const amplitude = 20 + Math.random() * 40;
            const frequency = 0.01 + Math.random() * 0.02;

            ctx.beginPath();
            for (let y = 0; y < canvas.height; y++) {
                const offset = Math.sin(y * frequency) * amplitude;
                if (y === 0) {
                    ctx.moveTo(x + offset, y);
                } else {
                    ctx.lineTo(x + offset, y);
                }
            }
            ctx.lineWidth = 1 + Math.random() * 2;
            ctx.stroke();
        }

        // Add small knots
        for (let i = 0; i < 3; i++) {
            const knotX = Math.random() * canvas.width;
            const knotY = Math.random() * canvas.height;
            const knotSize = 20 + Math.random() * 40;

            const knotGradient = ctx.createRadialGradient(knotX, knotY, 0, knotX, knotY, knotSize);
            knotGradient.addColorStop(0, `rgba(${(colors.dark >> 16) & 255}, ${(colors.dark >> 8) & 255}, ${colors.dark & 255}, 0.6)`);
            knotGradient.addColorStop(1, `rgba(${(colors.dark >> 16) & 255}, ${(colors.dark >> 8) & 255}, ${colors.dark & 255}, 0)`);

            ctx.fillStyle = knotGradient;
            ctx.fillRect(knotX - knotSize, knotY - knotSize, knotSize * 2, knotSize * 2);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(2, 2);

        // Create normal map for grain depth
        const normalCanvas = document.createElement('canvas');
        normalCanvas.width = 512;
        normalCanvas.height = 512;
        const normalCtx = normalCanvas.getContext('2d');

        // Base normal (pointing up)
        normalCtx.fillStyle = '#8080ff';
        normalCtx.fillRect(0, 0, normalCanvas.width, normalCanvas.height);

        // Add grain normals
        for (let i = 0; i < 30; i++) {
            const x = Math.random() * normalCanvas.width;
            const grainWidth = 1 + Math.random() * 3;

            normalCtx.fillStyle = `rgba(128, 128, ${200 + Math.random() * 55}, ${0.3 + Math.random() * 0.4})`;
            normalCtx.fillRect(x, 0, grainWidth, normalCanvas.height);
        }

        const normalMap = new THREE.CanvasTexture(normalCanvas);
        normalMap.wrapS = THREE.RepeatWrapping;
        normalMap.wrapT = THREE.RepeatWrapping;
        normalMap.repeat.set(2, 2);

        // Create PBR material
        const material = new THREE.MeshStandardMaterial({
            map: texture,
            normalMap: normalMap,
            normalScale: new THREE.Vector2(0.3, 0.3),
            roughness: 0.8,
            metalness: 0.0,
            side: THREE.DoubleSide,
            flatShading: false
        });

        return material;
    }

    carve(point, toolSize, depth, toolType) {
        const positions = this.geometry.attributes.position;
        const vertex = new THREE.Vector3();

        // Tool multipliers for different effects
        const toolMultipliers = {
            chisel: { size: 1.0, depth: 1.0, falloff: 0.8 },
            gouge: { size: 1.5, depth: 0.8, falloff: 0.6 },
            knife: { size: 0.5, depth: 1.2, falloff: 0.9 }
        };

        const tool = toolMultipliers[toolType] || toolMultipliers.chisel;

        const effectiveSize = (toolSize / 10) * tool.size;
        const effectiveDepth = (depth / 20) * tool.depth;

        // Update vertices near the carving point
        for (let i = 0; i < positions.count; i++) {
            vertex.fromBufferAttribute(positions, i);

            // Calculate distance from carving point
            const distance = Math.sqrt(
                Math.pow(vertex.x - point.x, 2) +
                Math.pow(vertex.z - point.z, 2)
            );

            // Apply carving effect with falloff
            if (distance < effectiveSize) {
                const falloff = Math.pow(1 - (distance / effectiveSize), tool.falloff);
                const carveAmount = effectiveDepth * falloff;

                // Only carve downward
                vertex.y -= carveAmount;

                // Don't carve below a minimum height
                vertex.y = Math.max(vertex.y, -this.height / 2);

                positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
            }
        }

        // Mark geometry as needing update
        positions.needsUpdate = true;
        this.geometry.computeVertexNormals(); // Recalculate normals for proper lighting
    }

    changeWoodType(woodType) {
        this.woodType = woodType;
        const newMaterial = this.createWoodMaterial(woodType);
        this.mesh.material.dispose();
        this.mesh.material = newMaterial;
    }

    reset() {
        // Reset all vertices to original positions
        const positions = this.geometry.attributes.position;

        for (let i = 0; i < positions.count; i++) {
            positions.setXYZ(
                i,
                this.originalPositions[i * 3],
                this.originalPositions[i * 3 + 1],
                this.originalPositions[i * 3 + 2]
            );
        }

        positions.needsUpdate = true;
        this.geometry.computeVertexNormals();
        this.initHeightMap();
    }

    dispose() {
        this.geometry.dispose();
        this.material.dispose();
        this.scene.remove(this.mesh);
    }
}
