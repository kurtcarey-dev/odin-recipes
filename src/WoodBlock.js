import * as THREE from 'three';

export class WoodBlock {
    constructor(scene, woodType = 'oak') {
        this.scene = scene;
        this.woodType = woodType;
        this.resolution = 60; // Segments per dimension
        this.width = 8;
        this.height = 6;
        this.depth = 8;

        // Create 3D box geometry instead of flat plane
        this.geometry = new THREE.BoxGeometry(
            this.width,
            this.height,
            this.depth,
            this.resolution,
            this.resolution,
            this.resolution
        );

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

    createWoodMaterial(woodType) {
        const woodColors = {
            oak: { base: 0xc19a6b, dark: 0x8b6f47, grain: 0x7a5a3a },
            walnut: { base: 0x5a3a29, dark: 0x3e2a1f, grain: 0x2d1f15 },
            pine: { base: 0xf4e4c1, dark: 0xd4c4a1, grain: 0xb4a481 },
            cherry: { base: 0xb85450, dark: 0x984540, grain: 0x783530 }
        };

        const colors = woodColors[woodType] || woodColors.oak;

        // Create procedural wood texture with enhanced realism
        const canvas = document.createElement('canvas');
        canvas.width = 2048;
        canvas.height = 2048;
        const ctx = canvas.getContext('2d');

        // Base color with slight variation
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, `#${colors.base.toString(16).padStart(6, '0')}`);
        gradient.addColorStop(0.5, `#${colors.dark.toString(16).padStart(6, '0')}`);
        gradient.addColorStop(1, `#${colors.base.toString(16).padStart(6, '0')}`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add vertical wood grain (like real wood grain runs)
        for (let i = 0; i < 80; i++) {
            const x = Math.random() * canvas.width;
            const grainWidth = 1 + Math.random() * 5;
            const opacity = 0.15 + Math.random() * 0.4;

            const grainGradient = ctx.createLinearGradient(x, 0, x + grainWidth, 0);
            grainGradient.addColorStop(0, `rgba(${(colors.grain >> 16) & 255}, ${(colors.grain >> 8) & 255}, ${colors.grain & 255}, 0)`);
            grainGradient.addColorStop(0.5, `rgba(${(colors.grain >> 16) & 255}, ${(colors.grain >> 8) & 255}, ${colors.grain & 255}, ${opacity})`);
            grainGradient.addColorStop(1, `rgba(${(colors.grain >> 16) & 255}, ${(colors.grain >> 8) & 255}, ${colors.grain & 255}, 0)`);

            ctx.fillStyle = grainGradient;
            ctx.fillRect(x, 0, grainWidth, canvas.height);
        }

        // Add growth ring patterns
        ctx.strokeStyle = `rgba(${(colors.dark >> 16) & 255}, ${(colors.dark >> 8) & 255}, ${colors.dark & 255}, 0.25)`;
        for (let i = 0; i < 30; i++) {
            const x = (i / 30) * canvas.width;
            const amplitude = 30 + Math.random() * 60;
            const frequency = 0.008 + Math.random() * 0.015;

            ctx.beginPath();
            for (let y = 0; y < canvas.height; y++) {
                const offset = Math.sin(y * frequency) * amplitude;
                if (y === 0) {
                    ctx.moveTo(x + offset, y);
                } else {
                    ctx.lineTo(x + offset, y);
                }
            }
            ctx.lineWidth = 1.5 + Math.random() * 3;
            ctx.stroke();
        }

        // Add realistic knots
        for (let i = 0; i < 4; i++) {
            const knotX = Math.random() * canvas.width;
            const knotY = Math.random() * canvas.height;
            const knotSize = 30 + Math.random() * 60;

            const knotGradient = ctx.createRadialGradient(knotX, knotY, 0, knotX, knotY, knotSize);
            knotGradient.addColorStop(0, `rgba(${(colors.dark >> 16) & 255}, ${(colors.dark >> 8) & 255}, ${colors.dark & 255}, 0.8)`);
            knotGradient.addColorStop(0.5, `rgba(${(colors.dark >> 16) & 255}, ${(colors.dark >> 8) & 255}, ${colors.dark & 255}, 0.4)`);
            knotGradient.addColorStop(1, `rgba(${(colors.dark >> 16) & 255}, ${(colors.dark >> 8) & 255}, ${colors.dark & 255}, 0)`);

            ctx.fillStyle = knotGradient;
            ctx.beginPath();
            ctx.arc(knotX, knotY, knotSize, 0, Math.PI * 2);
            ctx.fill();

            // Add knot center
            ctx.fillStyle = `rgba(${(colors.dark >> 16) & 255}, ${(colors.dark >> 8) & 255}, ${colors.dark & 255}, 0.9)`;
            ctx.beginPath();
            ctx.arc(knotX, knotY, knotSize * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);

        // Create normal map for grain depth and texture
        const normalCanvas = document.createElement('canvas');
        normalCanvas.width = 1024;
        normalCanvas.height = 1024;
        const normalCtx = normalCanvas.getContext('2d');

        // Base normal (pointing up)
        normalCtx.fillStyle = '#8080ff';
        normalCtx.fillRect(0, 0, normalCanvas.width, normalCanvas.height);

        // Add pronounced grain normals
        for (let i = 0; i < 60; i++) {
            const x = Math.random() * normalCanvas.width;
            const grainWidth = 1 + Math.random() * 4;

            normalCtx.fillStyle = `rgba(128, 128, ${210 + Math.random() * 45}, ${0.4 + Math.random() * 0.5})`;
            normalCtx.fillRect(x, 0, grainWidth, normalCanvas.height);
        }

        // Add bump variation for wood texture
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * normalCanvas.width;
            const y = Math.random() * normalCanvas.height;
            const size = 2 + Math.random() * 6;

            normalCtx.fillStyle = `rgba(${120 + Math.random() * 16}, ${120 + Math.random() * 16}, ${240 + Math.random() * 15}, 0.2)`;
            normalCtx.fillRect(x, y, size, size);
        }

        const normalMap = new THREE.CanvasTexture(normalCanvas);
        normalMap.wrapS = THREE.RepeatWrapping;
        normalMap.wrapT = THREE.RepeatWrapping;
        normalMap.repeat.set(1, 1);

        // Create PBR material with enhanced properties
        const material = new THREE.MeshStandardMaterial({
            map: texture,
            normalMap: normalMap,
            normalScale: new THREE.Vector2(0.5, 0.5),
            roughness: 0.85,
            metalness: 0.0,
            flatShading: false
        });

        return material;
    }

    carve(point, toolSize, depth, toolType) {
        const positions = this.geometry.attributes.position;
        const vertex = new THREE.Vector3();

        // Tool multipliers for different effects
        const toolMultipliers = {
            chisel: { size: 1.0, depth: 1.0, falloff: 2.0 },
            gouge: { size: 1.5, depth: 0.7, falloff: 1.5 },
            knife: { size: 0.5, depth: 1.2, falloff: 2.5 }
        };

        const tool = toolMultipliers[toolType] || toolMultipliers.chisel;

        const effectiveSize = (toolSize / 8) * tool.size;
        const effectiveDepth = (depth / 15) * tool.depth;

        // Update vertices near the carving point
        for (let i = 0; i < positions.count; i++) {
            vertex.fromBufferAttribute(positions, i);

            // Calculate 3D distance from carving point
            const distance = Math.sqrt(
                Math.pow(vertex.x - point.x, 2) +
                Math.pow(vertex.y - point.y, 2) +
                Math.pow(vertex.z - point.z, 2)
            );

            // Apply carving effect with falloff
            if (distance < effectiveSize) {
                const falloff = Math.pow(1 - (distance / effectiveSize), tool.falloff);
                const carveAmount = effectiveDepth * falloff;

                // Calculate direction from vertex to carving point (inward)
                const direction = new THREE.Vector3(
                    vertex.x - point.x,
                    vertex.y - point.y,
                    vertex.z - point.z
                );
                direction.normalize();

                // Push vertex away from carving point (remove material)
                vertex.x += direction.x * carveAmount;
                vertex.y += direction.y * carveAmount;
                vertex.z += direction.z * carveAmount;

                // Keep vertices within reasonable bounds
                const maxBound = this.width / 2;
                vertex.x = Math.max(-maxBound, Math.min(maxBound, vertex.x));
                vertex.y = Math.max(-this.height / 2, Math.min(this.height / 2, vertex.y));
                vertex.z = Math.max(-this.depth / 2, Math.min(this.depth / 2, vertex.z));

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
    }

    dispose() {
        this.geometry.dispose();
        this.material.dispose();
        this.scene.remove(this.mesh);
    }
}
