# Wood Carving Simulator

A realistic wood carving game built with Three.js and WebGL, featuring physically-based rendering (PBR) for authentic wood textures and interactive carving mechanics.

## Features

- **Realistic Wood Textures**: Procedurally generated wood grain with PBR materials
- **Multiple Wood Types**: Oak, Walnut, Pine, and Cherry with unique colors and grain patterns
- **Interactive Carving**: Three different tools with unique characteristics:
  - Chisel: Small, precise cuts
  - Gouge: Medium, curved cuts
  - Knife: Fine detail work
- **Dynamic Lighting**: Multiple light sources for realistic shadows and depth
- **Real-time Physics**: Responsive mesh deformation based on tool interaction
- **Intuitive Controls**: Mouse-based carving with camera rotation and zoom

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
npm install
```

### Running the Development Server

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

## Controls

- **Left Click + Drag**: Carve the wood
- **Right Click + Drag**: Rotate camera view
- **Scroll Wheel**: Zoom in/out
- **UI Panel**: Change wood type, select tools, adjust size and depth

## How It Works

The simulator uses:
- **Three.js** for 3D rendering and WebGL acceleration
- **Procedural textures** for realistic wood grain generation
- **Heightmap-based carving** for smooth, realistic material removal
- **PBR materials** with normal maps for depth and detail
- **Dynamic mesh updates** for real-time carving feedback

## Technical Details

- Resolution: 100x100 vertex grid for smooth carving
- Lighting: Multiple directional lights + ambient + hemisphere lighting
- Shadows: PCF soft shadows for realism
- Tone mapping: ACES Filmic for cinematic look

## Future Enhancements

- Save/export carved models
- More wood types and textures
- Additional carving tools
- Tutorial mode
- Gallery of carved creations
- Sound effects for carving

## License

MIT
