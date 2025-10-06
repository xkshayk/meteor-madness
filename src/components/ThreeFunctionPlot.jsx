// src/components/ThreeFunctionPlot.jsx
import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three-stdlib";

const ThreeFunctionPlot = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    // === Scene setup ===
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x202020);

    const camera = new THREE.PerspectiveCamera(
      60,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(5, 5, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      mountRef.current.clientWidth,
      mountRef.current.clientHeight
    );
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // === Axes Helper ===
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    // === Lighting ===
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 10, 5);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040));

    // === Function definition ===
    function f(x, y) {
      return Math.sin(Math.sqrt(x * x + y * y)); // <-- replace with your own
    }

    // === Generate surface ===
    const xCount = 100;
    const yCount = 100;
    const xMin = -5, xMax = 5;
    const yMin = -5, yMax = 5;
    const vertices = [];
    const colors = [];
    const color = new THREE.Color();

    for (let i = 0; i < xCount; i++) {
      for (let j = 0; j < yCount; j++) {
        const x0 = xMin + (xMax - xMin) * i / xCount;
        const x1 = xMin + (xMax - xMin) * (i + 1) / xCount;
        const y0 = yMin + (yMax - yMin) * j / yCount;
        const y1 = yMin + (yMax - yMin) * (j + 1) / yCount;

        const z00 = f(x0, y0);
        const z10 = f(x1, y0);
        const z01 = f(x0, y1);
        const z11 = f(x1, y1);

        // Two triangles per grid cell
        vertices.push(x0, y0, z00, x1, y0, z10, x1, y1, z11);
        vertices.push(x0, y0, z00, x1, y1, z11, x0, y1, z01);

        [z00, z10, z11, z00, z11, z01].forEach(z => {
          color.setHSL(0.6 - 0.6 * (z + 1) / 2, 1.0, 0.5);
          colors.push(color.r, color.g, color.b);
        });
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const material = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // === Resize handling ===
    const handleResize = () => {
      const { clientWidth, clientHeight } = mountRef.current;
      renderer.setSize(clientWidth, clientHeight);
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", handleResize);

    // === Animation loop ===
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // === Cleanup ===
    return () => {
      window.removeEventListener("resize", handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} style={{ width: "100%", height: "100vh" }} />;
};

export default ThreeFunctionPlot;
