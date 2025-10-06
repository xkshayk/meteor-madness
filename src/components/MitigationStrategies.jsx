import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const MitigationStrategies = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [earthLoaded, setEarthLoaded] = useState(false);
  const [activeStrategy, setActiveStrategy] = useState(null);
  const sceneRef = useRef(null);
  const trajectoryRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Scene setup for 2D polar coordinate system (top-down view)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000814);
    
    // Camera positioned above looking down (top view)
    const camera = new THREE.OrthographicCamera(
      window.innerWidth / -2,
      window.innerWidth / 2,
      window.innerHeight / 2,
      window.innerHeight / -2,
      0.1,
      2000
    );
    camera.position.set(0, 1000, 0);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current,
      antialias: true,
      alpha: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 500, 200);
    scene.add(directionalLight);

    // Create polar coordinate grid
    const createPolarGrid = () => {
      const gridGroup = new THREE.Group();
      
      // Concentric circles (distance rings)
      const circles = [100, 200, 300, 400, 500, 600, 700, 800];
      circles.forEach((radius, index) => {
        const circleGeometry = new THREE.RingGeometry(radius - 1, radius + 1, 64);
        const circleMaterial = new THREE.MeshBasicMaterial({ 
          color: 0x0066cc,
          opacity: 0.3,
          transparent: true,
          side: THREE.DoubleSide
        });
        const circle = new THREE.Mesh(circleGeometry, circleMaterial);
        circle.rotation.x = -Math.PI / 2;
        gridGroup.add(circle);
      });
      
      // Radial lines (angle lines)
      const angleStep = Math.PI / 12; // 15 degrees
      for (let angle = 0; angle < Math.PI * 2; angle += angleStep) {
        const lineGeometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([
          0, 0, 0,
          Math.cos(angle) * 850, 0, Math.sin(angle) * 850
        ]);
        lineGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        const lineMaterial = new THREE.LineBasicMaterial({ 
          color: 0x0066cc,
          opacity: 0.2,
          transparent: true
        });
        const line = new THREE.Line(lineGeometry, lineMaterial);
        gridGroup.add(line);
      }
      
      return gridGroup;
    };

    const polarGrid = createPolarGrid();
    scene.add(polarGrid);

    // Load Earth model at the origin
    const loader = new GLTFLoader();
    let earthModel;
    
    loader.load(
      '/models/Earth_1_12756.glb',
      (gltf) => {
        earthModel = gltf.scene;
        
        // Scale Earth to appropriate size (let's say 80 units diameter)
        const desiredSize = 80;
        const box = new THREE.Box3().setFromObject(earthModel);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = desiredSize / maxDim;
        earthModel.scale.set(scale, scale, scale);
        
        // Position at origin
        earthModel.position.set(0, 0, 0);
        
        // Rotate to show properly from top view
        earthModel.rotation.x = -Math.PI / 2;
        
        scene.add(earthModel);
        setEarthLoaded(true);
      },
      (progress) => {
        console.log('Loading Earth model:', (progress.loaded / progress.total * 100) + '%');
      },
      (error) => {
        console.error('Error loading Earth model:', error);
      }
    );

    // Create elliptical asteroid trajectory
    const createAsteroidTrajectory = () => {
      const trajectoryGroup = new THREE.Group();
      
      // Ellipse parameters (Keplerian orbit elements)
      const semiMajorAxis = 700; // a: semi-major axis
      const eccentricity = 0.7; // e: eccentricity (0.7 makes it visibly elliptical)
      const semiMinorAxis = semiMajorAxis * Math.sqrt(1 - eccentricity * eccentricity); // b: semi-minor axis
      
      // Center offset for ellipse (one focus at Earth's position)
      const focalDistance = semiMajorAxis * eccentricity; // c: distance from center to focus
      const centerOffset = new THREE.Vector3(focalDistance, 0, 0);
      
      // Create partial elliptical path - coming from the left side
      // Start angle at π (180°, left side) and end near Earth
      const ellipseCurve = new THREE.EllipseCurve(
        centerOffset.x, centerOffset.z,  // center x, y (in XZ plane for top-down view)
        semiMajorAxis, semiMinorAxis,    // xRadius, yRadius
        Math.PI, Math.PI * 1.65,         // start from left (π) and approach Earth (1.65π)
        false,                           // clockwise
        0                                // rotation
      );
      
      const points = ellipseCurve.getPoints(80);
      const pathGeometry = new THREE.BufferGeometry().setFromPoints(
        points.map(p => new THREE.Vector3(p.x, 0, p.y))
      );
      
      // Trajectory line (dotted)
      const pathMaterial = new THREE.LineDashedMaterial({ 
        color: 0xff6600,
        linewidth: 2,
        dashSize: 8,
        gapSize: 4,
        transparent: true,
        opacity: 0.8
      });
      const trajectoryLine = new THREE.Line(pathGeometry, pathMaterial);
      trajectoryLine.computeLineDistances();
      trajectoryGroup.add(trajectoryLine);
      
      // Create asteroid object
      const asteroidGeometry = new THREE.SphereGeometry(15, 16, 16);
      const asteroidMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x8b4513,
        roughness: 0.9,
        metalness: 0.1,
        emissive: 0xff6600,
        emissiveIntensity: 0.3
      });
      const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
      
      // Position asteroid at the START of the trajectory (far left)
      const startPoint = points[0];
      asteroid.position.set(startPoint.x, 0, startPoint.y);
      trajectoryGroup.add(asteroid);
      
      // Add sniper-style target reticle at asteroid position (start of trajectory)
      const targetGroup = new THREE.Group();
      targetGroup.position.copy(asteroid.position);
      targetGroup.rotation.x = -Math.PI / 2;
      
      // Outer ring
      const outerRing = new THREE.RingGeometry(30, 32, 64);
      const outerRingMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff0000,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
      });
      const outerRingMesh = new THREE.Mesh(outerRing, outerRingMaterial);
      targetGroup.add(outerRingMesh);
      
      // Inner ring
      const innerRing = new THREE.RingGeometry(18, 20, 64);
      const innerRingMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff0000,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
      });
      const innerRingMesh = new THREE.Mesh(innerRing, innerRingMaterial);
      targetGroup.add(innerRingMesh);
      
      // Crosshairs (horizontal and vertical lines)
      const crosshairMaterial = new THREE.LineBasicMaterial({ 
        color: 0xff0000,
        transparent: true,
        opacity: 0.8,
        linewidth: 2
      });
      
      // Horizontal crosshair
      const hLineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-35, 0, 0),
        new THREE.Vector3(-22, 0, 0),
        new THREE.Vector3(-10, 0, 0),
        new THREE.Vector3(10, 0, 0),
        new THREE.Vector3(22, 0, 0),
        new THREE.Vector3(35, 0, 0)
      ]);
      const hLine = new THREE.LineSegments(hLineGeometry, crosshairMaterial);
      targetGroup.add(hLine);
      
      // Vertical crosshair
      const vLineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, -35),
        new THREE.Vector3(0, 0, -22),
        new THREE.Vector3(0, 0, -10),
        new THREE.Vector3(0, 0, 10),
        new THREE.Vector3(0, 0, 22),
        new THREE.Vector3(0, 0, 35)
      ]);
      const vLine = new THREE.LineSegments(vLineGeometry, crosshairMaterial);
      targetGroup.add(vLine);
      
      // Center dot
      const centerDot = new THREE.CircleGeometry(0.6, 16);
      const centerDotMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff0000,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9
      });
      const centerDotMesh = new THREE.Mesh(centerDot, centerDotMaterial);
      targetGroup.add(centerDotMesh);
      
      trajectoryGroup.add(targetGroup);
      
      // Add spiral path from asteroid position (start) to Earth's surface
      const spiralPoints = [];
      const asteroidStartPoint = points[0]; // Start from asteroid position
      const spiralTurns = 0.75; // Less than 1 revolution
      const spiralSteps = 100;
      const startRadius = Math.sqrt(asteroidStartPoint.x * asteroidStartPoint.x + asteroidStartPoint.y * asteroidStartPoint.y);
      const startAngle = Math.atan2(asteroidStartPoint.y, asteroidStartPoint.x);
      
      for (let i = 0; i <= spiralSteps; i++) {
        const t = i / spiralSteps;
        // Spiral inward from current radius to Earth radius (40 units)
        const radius = startRadius * (1 - t) + 40 * t;
        // Rotate while spiraling in (reversed direction)
        const angle = startAngle - t * spiralTurns * Math.PI * 2;
        spiralPoints.push(new THREE.Vector3(
          Math.cos(angle) * radius,
          0,
          Math.sin(angle) * radius
        ));
      }
      
      const spiralGeometry = new THREE.BufferGeometry().setFromPoints(spiralPoints);
      const spiralMaterial = new THREE.LineDashedMaterial({ 
        color: 0xff6600,
        linewidth: 1,
        dashSize: 8,
        gapSize: 4,
        transparent: true,
        opacity: 0.6
      });
      const spiralLine = new THREE.Line(spiralGeometry, spiralMaterial);
      spiralLine.computeLineDistances();
      trajectoryGroup.add(spiralLine);
      
      // Add launch point in bottom-right corner
      const launchPointRadius = 700; // Same distance as asteroid trajectory
      const launchAngle = -Math.PI / 4; // Bottom-right (315 degrees or -45 degrees)
      const launchX = launchPointRadius * Math.cos(launchAngle);
      const launchY = launchPointRadius * Math.sin(launchAngle);
      
      const launchPointGeometry = new THREE.CircleGeometry(15, 32);
      const launchPointMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, opacity: 0.8, transparent: true });
      const launchPoint = new THREE.Mesh(launchPointGeometry, launchPointMaterial);
      launchPoint.position.set(launchX, 0, launchY);
      trajectoryGroup.add(launchPoint);
      
      // Store positions for kinetic impact trajectory
      trajectoryGroup.userData.launchPoint = { x: launchX, z: launchY };
      trajectoryGroup.userData.targetPoint = { x: asteroidStartPoint.x, z: asteroidStartPoint.y }; // asteroidStartPoint.y maps to z in 3D
      trajectoryGroup.userData.centerOffset = centerOffset;
      trajectoryGroup.userData.semiMajorAxis = semiMajorAxis;
      trajectoryGroup.userData.semiMinorAxis = semiMinorAxis;
      
      // Pulsing animation for sniper target
      let pulseTime = 0;
      const animateSniperTarget = () => {
        pulseTime += 0.05;
        const scale = 1 + Math.sin(pulseTime) * 0.15;
        targetGroup.scale.set(scale, scale, 1);
        outerRingMaterial.opacity = 0.6 + Math.sin(pulseTime) * 0.2;
        innerRingMaterial.opacity = 0.6 + Math.sin(pulseTime) * 0.2;
        crosshairMaterial.opacity = 0.6 + Math.sin(pulseTime) * 0.2;
      };
      
      // Store animation function
      trajectoryGroup.userData.animateMarker = animateSniperTarget;
      
      return trajectoryGroup;
    };

    const asteroidTrajectory = createAsteroidTrajectory();
    scene.add(asteroidTrajectory);
    
    // Store refs for kinetic impact
    sceneRef.current = scene;
    trajectoryRef.current = asteroidTrajectory;

    // Add axis labels
    const createAxisLabel = (text, position) => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = 256;
      canvas.height = 128;
      context.fillStyle = '#ffffff';
      context.font = 'bold 64px Arial';
      context.textAlign = 'center';
      context.fillText(text, 128, 80);
      
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.position.copy(position);
      sprite.scale.set(100, 50, 1);
      scene.add(sprite);
    };

    createAxisLabel('N', new THREE.Vector3(0, 0, -900));
    createAxisLabel('S', new THREE.Vector3(0, 0, 900));
    createAxisLabel('E', new THREE.Vector3(900, 0, 0));
    createAxisLabel('W', new THREE.Vector3(-900, 0, 0));

    // Magenta dot will be created dynamically when a button is pressed

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Slowly rotate Earth
      if (earthModel) {
        earthModel.rotation.z += 0.001;
      }
      
      // Animate danger marker
      if (asteroidTrajectory.userData.animateMarker) {
        asteroidTrajectory.userData.animateMarker();
      }
      
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      camera.left = window.innerWidth / -2;
      camera.right = window.innerWidth / 2;
      camera.top = window.innerHeight / 2;
      camera.bottom = window.innerHeight / -2;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  const handleKineticImpact = () => {
    setActiveStrategy('laser');
    if (!sceneRef.current || !trajectoryRef.current) return;
    
    const scene = sceneRef.current;
    const trajectory = trajectoryRef.current;
    const launchPoint = trajectory.userData.launchPoint;
    const targetPoint = trajectory.userData.targetPoint;
    
    if (!launchPoint || !targetPoint) return;
    
    // Clear any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    // Remove previous lines and dots if they exist
    if (window.asteroidMovingLine) scene.remove(window.asteroidMovingLine);
    if (window.mitigationMovingLine) scene.remove(window.mitigationMovingLine);
    if (window.magentaDotLine) scene.remove(window.magentaDotLine);
    if (window.magentaArrow) scene.remove(window.magentaArrow);
    if (window.deflectedLine) scene.remove(window.deflectedLine);
    if (window.magentaDot) scene.remove(window.magentaDot);
    
    // Magenta dot position for laser deflection (top of screen)
    const magentaDotPos = { x: 0, z: -200 };
    
    // Create and add magenta dot to scene
    const dotGeometry = new THREE.CircleGeometry(10, 32);
    const dotMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff00ff, 
      opacity: 1.0, 
      transparent: false,
      side: THREE.DoubleSide
    });
    const magentaDot = new THREE.Mesh(dotGeometry, dotMaterial);
    magentaDot.position.set(magentaDotPos.x, 1, magentaDotPos.z);
    magentaDot.rotation.x = -Math.PI / 2;
    scene.add(magentaDot);
    window.magentaDot = magentaDot;
    
    // Get the asteroid trajectory points (the existing dotted trajectory) - REVERSED
    const asteroidPath = [];
    const ellipseCurve = new THREE.EllipseCurve(
      trajectory.userData.centerOffset.x, trajectory.userData.centerOffset.z,
      trajectory.userData.semiMajorAxis, trajectory.userData.semiMinorAxis,
      Math.PI, Math.PI * 1.65,
      false,
      0
    );
    const curvePoints = ellipseCurve.getPoints(100);
    curvePoints.forEach(p => asteroidPath.push(new THREE.Vector3(p.x, 0, p.y)));
    asteroidPath.reverse(); // Reverse to animate from target towards left
    
    // Create mitigation elliptical path from launch point (button 4) to target
    const mitigationPath = [];
    const steps = 100;
    
    // Calculate ellipse parameters
    const dx = targetPoint.x - launchPoint.x;
    const dz = targetPoint.z - launchPoint.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    // Semi-major axis is half the distance between points
    const a = distance / 2;
    // Eccentricity for a nice elliptical curve
    const e = 0.6;
    const b = a * Math.sqrt(1 - e * e); // Semi-minor axis
    
    // Center point between launch and target
    const centerX = (launchPoint.x + targetPoint.x) / 2;
    const centerZ = (launchPoint.z + targetPoint.z) / 2;
    
    // Angle of the line from launch to target
    const rotationAngle = Math.atan2(dz, dx);
    
    // Generate ellipse points from launch to target
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // Parametric ellipse equation (0 to π for half ellipse)
      const theta = Math.PI * t;
      const localX = a * Math.cos(theta);
      const localZ = b * Math.sin(theta);
      
      // Rotate and translate to world position
      const worldX = centerX + (localX * Math.cos(rotationAngle) - localZ * Math.sin(rotationAngle));
      const worldZ = centerZ + (localX * Math.sin(rotationAngle) + localZ * Math.cos(rotationAngle));
      
      mitigationPath.push(new THREE.Vector3(worldX, 0, worldZ));
    }
    
    // Create curved path from magenta dot to target - USING SAME APPROACH AS RED LINE
    const magentaDotPath = [];
    
    // Create POLAR coordinate path from magenta dot to target
    const magentaStartPoint = { x: 0, z: -200 }; // Match the dot position exactly
    const magentaTargetPoint = trajectory.userData.targetPoint;
    
    console.log('Target point for magenta:', magentaTargetPoint);
    
    // Calculate polar coordinates for start and target points
    const startRadius = Math.sqrt(magentaStartPoint.x * magentaStartPoint.x + magentaStartPoint.z * magentaStartPoint.z);
    const startAngle = Math.atan2(magentaStartPoint.z, magentaStartPoint.x);
    
    const targetRadius = Math.sqrt(magentaTargetPoint.x * magentaTargetPoint.x + magentaTargetPoint.z * magentaTargetPoint.z);
    const targetAngle = Math.atan2(magentaTargetPoint.z, magentaTargetPoint.x);
    
    // Generate points using polar interpolation (follows circular arcs)
    const magentaToTargetPoints = [];
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      
      // Interpolate radius and angle separately (POLAR interpolation - COUNTER-CLOCKWISE)
      const radius = startRadius + (targetRadius - startRadius) * t;
      // Go counter-clockwise by going the long way around (subtract instead of add)
      const angleDiff = targetAngle - startAngle;
      const angle = startAngle - t * (2 * Math.PI - angleDiff);
      
      // Convert back to Cartesian coordinates
      const x = radius * Math.cos(angle);
      const z = radius * Math.sin(angle);
      
      magentaToTargetPoints.push(new THREE.Vector3(x, 1, z));
    }
    
    // Continue magenta line past target point along deflection path
    const magentaDeflectionPoints = [];
    const deflectionDistance = 4; // Match the deflection distance
    const deflectionSteps = 50;
    const awayFromEarthAngle = Math.atan2(magentaTargetPoint.z, magentaTargetPoint.x);
    
    for (let i = 1; i <= deflectionSteps; i++) {
      const t = i / deflectionSteps;
      const baseRadius = Math.sqrt(magentaTargetPoint.x * magentaTargetPoint.x + magentaTargetPoint.z * magentaTargetPoint.z);
      
      // Use same easing as deflection line
      const radialEasing = t * (2 - t); // Ease-out quadratic
      const extendedRadius = baseRadius + radialEasing * deflectionDistance;
      
      // Linear progression for constant draw rate - curvature controlled by PI coefficient
      const curveAmount = t * (Math.PI / 2); // Linear progression, π/2 total curve
      const angle = awayFromEarthAngle - curveAmount; // Counter-clockwise
      
      magentaDeflectionPoints.push(new THREE.Vector3(
        Math.cos(angle) * extendedRadius,
        1,
        Math.sin(angle) * extendedRadius
      ));
    }
    
    // Store both segments separately
    magentaDotPath.toTarget = magentaToTargetPoints;
    magentaDotPath.deflection = magentaDeflectionPoints;
    
    console.log('Magenta to target points:', magentaToTargetPoints.length);
    console.log('Magenta deflection points:', magentaDeflectionPoints.length);
    
    // Animation parameters
    const phaseOneDuration = 3000; // 3 seconds to reach target (matches red asteroid)
    const phaseTwoDuration = 2000; // 2 seconds for deflection (matches red deflection)
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      
      if (elapsed < phaseOneDuration) {
        // Phase 1: Moving to target (0-3000ms)
        const progress = Math.min(elapsed / phaseOneDuration, 1);
        const asteroidIndex = Math.floor(progress * (asteroidPath.length - 1));
        const magentaIndex = Math.floor(progress * (magentaDotPath.toTarget.length - 1));
        
        // Draw asteroid trajectory up to current position (RED)
        if (window.asteroidMovingLine) scene.remove(window.asteroidMovingLine);
        const asteroidSegment = asteroidPath.slice(0, asteroidIndex + 1);
        if (asteroidSegment.length > 1 && asteroidSegment.every(p => !isNaN(p.x) && !isNaN(p.y) && !isNaN(p.z))) {
          const asteroidGeom = new THREE.BufferGeometry().setFromPoints(asteroidSegment);
          const asteroidMat = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 20 });
          window.asteroidMovingLine = new THREE.Line(asteroidGeom, asteroidMat);
          scene.add(window.asteroidMovingLine);
        }
        
        // Draw neon green trajectory to target (LASER)
        if (window.magentaDotLine) scene.remove(window.magentaDotLine);
        const magentaSegment = magentaDotPath.toTarget.slice(0, magentaIndex + 1);
        if (magentaSegment.length > 1 && magentaSegment.every(p => p && !isNaN(p.x) && !isNaN(p.y) && !isNaN(p.z))) {
          const magentaGeom = new THREE.BufferGeometry().setFromPoints(magentaSegment);
          const magentaMat = new THREE.LineBasicMaterial({ color: 0x39ff14, linewidth: 20 }); // Neon green
          window.magentaDotLine = new THREE.Line(magentaGeom, magentaMat);
          scene.add(window.magentaDotLine);
        }
        
        animationRef.current = requestAnimationFrame(animate);
      } else if (elapsed < phaseOneDuration + phaseTwoDuration) {
        // Phase 2: Deflection animation (3000-5000ms)
        const deflectionElapsed = elapsed - phaseOneDuration;
        const deflectionProgress = Math.min(deflectionElapsed / phaseTwoDuration, 1);
        
        // Keep full magenta line to target visible
        if (window.magentaDotLine) scene.remove(window.magentaDotLine);
        if (window.magentaArrow) scene.remove(window.magentaArrow);
        
        const fullMagentaToTarget = [...magentaDotPath.toTarget];
        
        // Add deflection portion up to current progress
        const magentaDeflectionIndex = Math.floor(deflectionProgress * magentaDotPath.deflection.length);
        const magentaDeflectionSegment = magentaDotPath.deflection.slice(0, magentaDeflectionIndex + 1);
        const fullMagentaPath = [...fullMagentaToTarget, ...magentaDeflectionSegment];
        
        if (fullMagentaPath.length > 1) {
          const magentaGeom = new THREE.BufferGeometry().setFromPoints(fullMagentaPath);
          const magentaMat = new THREE.LineBasicMaterial({ color: 0x39ff14, linewidth: 20 }); // Neon green
          window.magentaDotLine = new THREE.Line(magentaGeom, magentaMat);
          scene.add(window.magentaDotLine);
          
          // Add arrowhead at the end of the neon green line (when deflection is visible)
          if (magentaDeflectionSegment.length > 1 && deflectionProgress > 0.1) {
            const lastPoint = fullMagentaPath[fullMagentaPath.length - 1];
            const secondLastPoint = fullMagentaPath[fullMagentaPath.length - 2];
            
            // Calculate direction for arrow
            const dir = new THREE.Vector3().subVectors(lastPoint, secondLastPoint).normalize();
            const arrowLength = 20;
            const arrowWidth = 10;
            
            // Create arrow cone
            const arrowGeometry = new THREE.ConeGeometry(arrowWidth, arrowLength, 8);
            const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0x39ff14 }); // Neon green
            const arrowMesh = new THREE.Mesh(arrowGeometry, arrowMaterial);
            
            // Position and orient the arrow
            arrowMesh.position.copy(lastPoint);
            arrowMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
            
            window.magentaArrow = arrowMesh;
            scene.add(window.magentaArrow);
          }
        }
        
        animationRef.current = requestAnimationFrame(animate);
      } else {
        animationRef.current = null;
      }
    };
    
    animate();
  };

  const handleGravityTractor = () => {
    setActiveStrategy('gravity');
    if (!sceneRef.current || !trajectoryRef.current) return;
    
    const scene = sceneRef.current;
    const trajectory = trajectoryRef.current;
    const targetPoint = trajectory.userData.targetPoint;
    
    if (!targetPoint) return;
    
    // Clear any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    // Remove previous lines and dots if they exist
    if (window.asteroidMovingLine) scene.remove(window.asteroidMovingLine);
    if (window.mitigationMovingLine) scene.remove(window.mitigationMovingLine);
    if (window.magentaDotLine) scene.remove(window.magentaDotLine);
    if (window.magentaArrow) scene.remove(window.magentaArrow);
    if (window.deflectedLine) scene.remove(window.deflectedLine);
    if (window.deflectedArrow) scene.remove(window.deflectedArrow);
    if (window.magentaDot) scene.remove(window.magentaDot);
    
    // Magenta dot position for gravity tractor (250 pixels away, 200 degrees)
    // Then move down 150 pixels (positive z) and left 50 pixels (negative x)
    const angleInRadians = (200 * Math.PI) / 180; // 200 degrees to radians
    const radius = 250;
    const magentaDotPos = { 
      x: radius * Math.cos(angleInRadians) - 50,  // 50 pixels to the left
      z: radius * Math.sin(angleInRadians) + 150  // 150 pixels down
    };
    
    // Create and add magenta dot to scene
    const dotGeometry = new THREE.CircleGeometry(10, 32);
    const dotMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff00ff, 
      opacity: 1.0, 
      transparent: false,
      side: THREE.DoubleSide
    });
    const magentaDot = new THREE.Mesh(dotGeometry, dotMaterial);
    magentaDot.position.set(magentaDotPos.x, 1, magentaDotPos.z);
    magentaDot.rotation.x = -Math.PI / 2;
    scene.add(magentaDot);
    window.magentaDot = magentaDot;
    
    // Get the asteroid trajectory points (same as laser deflection)
    const asteroidPath = [];
    const ellipseCurve = new THREE.EllipseCurve(
      trajectory.userData.centerOffset.x, trajectory.userData.centerOffset.z,
      trajectory.userData.semiMajorAxis, trajectory.userData.semiMinorAxis,
      Math.PI, Math.PI * 1.65,
      false,
      0
    );
    const curvePoints = ellipseCurve.getPoints(100);
    curvePoints.forEach(p => asteroidPath.push(new THREE.Vector3(p.x, 0, p.y)));
    asteroidPath.reverse();
    
    // Animation parameters - only red line, no pink line
    const phaseOneDuration = 3000; // 3 seconds to reach target
    const phaseTwoDuration = 6667; // ~6.7 seconds for deflection (30% speed = 3.33x slower)
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      
      if (elapsed < phaseOneDuration) {
        // Phase 1: Red asteroid moving to target (0-3000ms)
        const progress = Math.min(elapsed / phaseOneDuration, 1);
        const asteroidIndex = Math.floor(progress * (asteroidPath.length - 1));
        
        // Draw asteroid trajectory up to current position (RED)
        if (window.asteroidMovingLine) scene.remove(window.asteroidMovingLine);
        const asteroidSegment = asteroidPath.slice(0, asteroidIndex + 1);
        if (asteroidSegment.length > 1 && asteroidSegment.every(p => !isNaN(p.x) && !isNaN(p.y) && !isNaN(p.z))) {
          const asteroidGeom = new THREE.BufferGeometry().setFromPoints(asteroidSegment);
          const asteroidMat = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 20 });
          window.asteroidMovingLine = new THREE.Line(asteroidGeom, asteroidMat);
          scene.add(window.asteroidMovingLine);
        }
        
        animationRef.current = requestAnimationFrame(animate);
      } else if (elapsed < phaseOneDuration + phaseTwoDuration) {
        // Phase 2: Red deflection animation (3000-5000ms)
        const deflectionElapsed = elapsed - phaseOneDuration;
        const deflectionProgress = Math.min(deflectionElapsed / phaseTwoDuration, 1);
        
        // Create deflected path
        const deflectedStartPoint = { x: targetPoint.x, z: targetPoint.z };
        const awayFromEarthAngle = Math.atan2(deflectedStartPoint.z, deflectedStartPoint.x);
        const deflectionDistance = 4;
        const deflectionSteps = 150; // 3x more steps for smooth drawing at slower speed
        const currentSteps = Math.floor(deflectionProgress * deflectionSteps);
        
        const deflectedPath = [];
        for (let i = 0; i <= currentSteps; i++) {
          const t = i / deflectionSteps;
          const radius = Math.sqrt(deflectedStartPoint.x * deflectedStartPoint.x + deflectedStartPoint.z * deflectedStartPoint.z);
          const radialEasing = t * (15 - t);
          const extendedRadius = radius + radialEasing * deflectionDistance;
          // Linear progression for constant draw rate - curvature is controlled by the PI coefficient
          const curveAmount = t * (Math.PI * 4.5); // Linear progression, 4.5π total curve
          const angle = awayFromEarthAngle - curveAmount;
          
          deflectedPath.push(new THREE.Vector3(
            Math.cos(angle) * extendedRadius,
            1,
            Math.sin(angle) * extendedRadius
          ));
        }
        
        if (window.deflectedLine) scene.remove(window.deflectedLine);
        if (window.deflectedArrow) scene.remove(window.deflectedArrow);
        
        if (deflectedPath.length > 1) {
          const deflectedGeom = new THREE.BufferGeometry().setFromPoints(deflectedPath);
          const deflectedMat = new THREE.LineBasicMaterial({ 
            color: 0xff0000, 
            linewidth: 20,
            transparent: true,
            opacity: 1.0
          });
          window.deflectedLine = new THREE.Line(deflectedGeom, deflectedMat);
          scene.add(window.deflectedLine);
          
          // Add arrowhead at the end of the deflection line
          if (deflectionProgress > 0.1) {
            const lastPoint = deflectedPath[deflectedPath.length - 1];
            const secondLastPoint = deflectedPath[Math.max(0, deflectedPath.length - 2)];
            
            const dir = new THREE.Vector3().subVectors(lastPoint, secondLastPoint).normalize();
            const arrowLength = 20;
            const arrowWidth = 10;
            
            const arrowGeometry = new THREE.ConeGeometry(arrowWidth, arrowLength, 8);
            const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            const arrowMesh = new THREE.Mesh(arrowGeometry, arrowMaterial);
            
            arrowMesh.position.copy(lastPoint);
            arrowMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
            
            window.deflectedArrow = arrowMesh;
            scene.add(window.deflectedArrow);
          }
        }
        
        animationRef.current = requestAnimationFrame(animate);
      } else {
        animationRef.current = null;
      }
    };
    
    animate();
  };

  const handleKineticImpactor = () => {
    setActiveStrategy('kinetic');
    if (!sceneRef.current || !trajectoryRef.current) return;
    
    const scene = sceneRef.current;
    const trajectory = trajectoryRef.current;
    const launchPoint = trajectory.userData.launchPoint;
    const targetPoint = trajectory.userData.targetPoint;
    
    if (!launchPoint || !targetPoint) return;
    
    // Clear any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    // Remove previous lines and dots if they exist
    if (window.asteroidMovingLine) scene.remove(window.asteroidMovingLine);
    if (window.mitigationMovingLine) scene.remove(window.mitigationMovingLine);
    if (window.magentaDotLine) scene.remove(window.magentaDotLine);
    if (window.magentaArrow) scene.remove(window.magentaArrow);
    if (window.deflectedLine) scene.remove(window.deflectedLine);
    if (window.deflectedArrow) scene.remove(window.deflectedArrow);
    if (window.magentaDot) scene.remove(window.magentaDot);
    
    // Magenta dot position - same as laser deflection (top of screen)
    const magentaDotPos = { x: 0, z: -200 };
    
    // Create and add magenta dot to scene
    const dotGeometry = new THREE.CircleGeometry(10, 32);
    const dotMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff00ff, 
      opacity: 1.0, 
      transparent: false,
      side: THREE.DoubleSide
    });
    const magentaDot = new THREE.Mesh(dotGeometry, dotMaterial);
    magentaDot.position.set(magentaDotPos.x, 1, magentaDotPos.z);
    magentaDot.rotation.x = -Math.PI / 2;
    scene.add(magentaDot);
    window.magentaDot = magentaDot;
    
    // Get the asteroid trajectory points
    const asteroidPath = [];
    const ellipseCurve = new THREE.EllipseCurve(
      trajectory.userData.centerOffset.x, trajectory.userData.centerOffset.z,
      trajectory.userData.semiMajorAxis, trajectory.userData.semiMinorAxis,
      Math.PI, Math.PI * 1.65,
      false,
      0
    );
    const curvePoints = ellipseCurve.getPoints(100);
    curvePoints.forEach(p => asteroidPath.push(new THREE.Vector3(p.x, 0, p.y)));
    asteroidPath.reverse();
    
    // Create magenta path to target ONLY (no deflection continuation)
    const magentaStartPoint = { x: 0, z: -200 };
    const magentaTargetPoint = trajectory.userData.targetPoint;
    
    const startRadius = Math.sqrt(magentaStartPoint.x * magentaStartPoint.x + magentaStartPoint.z * magentaStartPoint.z);
    const startAngle = Math.atan2(magentaStartPoint.z, magentaStartPoint.x);
    
    const targetRadius = Math.sqrt(magentaTargetPoint.x * magentaTargetPoint.x + magentaTargetPoint.z * magentaTargetPoint.z);
    const targetAngle = Math.atan2(magentaTargetPoint.z, magentaTargetPoint.x);
    
    // Magenta line to target only (no deflection)
    const magentaToTargetPoints = [];
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const radius = startRadius + (targetRadius - startRadius) * t;
      const angleDiff = targetAngle - startAngle;
      const angle = startAngle - t * (2 * Math.PI - angleDiff);
      
      const x = radius * Math.cos(angle);
      const z = radius * Math.sin(angle);
      
      magentaToTargetPoints.push(new THREE.Vector3(x, 1, z));
    }
    
    // Animation parameters
    const phaseOneDuration = 3000; // 3 seconds to reach target
    const phaseTwoDuration = 2000; // 2 seconds for deflection
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      
      if (elapsed < phaseOneDuration) {
        // Phase 1: Moving to target (0-3000ms)
        const progress = Math.min(elapsed / phaseOneDuration, 1);
        const asteroidIndex = Math.floor(progress * (asteroidPath.length - 1));
        const magentaIndex = Math.floor(progress * (magentaToTargetPoints.length - 1));
        
        // Draw asteroid trajectory up to current position (RED)
        if (window.asteroidMovingLine) scene.remove(window.asteroidMovingLine);
        const asteroidSegment = asteroidPath.slice(0, asteroidIndex + 1);
        if (asteroidSegment.length > 1 && asteroidSegment.every(p => !isNaN(p.x) && !isNaN(p.y) && !isNaN(p.z))) {
          const asteroidGeom = new THREE.BufferGeometry().setFromPoints(asteroidSegment);
          const asteroidMat = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 20 });
          window.asteroidMovingLine = new THREE.Line(asteroidGeom, asteroidMat);
          scene.add(window.asteroidMovingLine);
        }
        
        // Draw magenta trajectory to target (MAGENTA - stops at target)
        if (window.magentaDotLine) scene.remove(window.magentaDotLine);
        const magentaSegment = magentaToTargetPoints.slice(0, magentaIndex + 1);
        if (magentaSegment.length > 1 && magentaSegment.every(p => p && !isNaN(p.x) && !isNaN(p.y) && !isNaN(p.z))) {
          const magentaGeom = new THREE.BufferGeometry().setFromPoints(magentaSegment);
          const magentaMat = new THREE.LineBasicMaterial({ color: 0xff00ff, linewidth: 20 });
          window.magentaDotLine = new THREE.Line(magentaGeom, magentaMat);
          scene.add(window.magentaDotLine);
        }
        
        animationRef.current = requestAnimationFrame(animate);
      } else if (elapsed < phaseOneDuration + phaseTwoDuration) {
        // Phase 2: Red deflection animation (3000-5000ms) with curve = -1.0
        const deflectionElapsed = elapsed - phaseOneDuration;
        const deflectionProgress = Math.min(deflectionElapsed / phaseTwoDuration, 1);
        
        // Create deflected path with tighter curve (more angular deflection, less radial distance)
        const deflectedStartPoint = { x: targetPoint.x, z: targetPoint.z };
        const awayFromEarthAngle = Math.atan2(deflectedStartPoint.z, deflectedStartPoint.x);
        const deflectionDistance = 2.5; // Reduced from 4 for tighter curve
        const deflectionSteps = 50;
        const currentSteps = Math.floor(deflectionProgress * deflectionSteps);
        
        const deflectedPath = [];
        for (let i = 0; i <= currentSteps; i++) {
          const t = i / deflectionSteps;
          const radius = Math.sqrt(deflectedStartPoint.x * deflectedStartPoint.x + deflectedStartPoint.z * deflectedStartPoint.z);
          const radialEasing = t * (25 - t); // Ease-out quadratic - same as laser
          const extendedRadius = radius + radialEasing * deflectionDistance;
          // Linear progression for constant draw rate - curvature controlled by coefficient
          const curveAmount = t * 1.5; // Linear progression, 1.5 radians total curve (about 86 degrees)
          const angle = awayFromEarthAngle - curveAmount; // Counter-clockwise
          
          deflectedPath.push(new THREE.Vector3(
            Math.cos(angle) * extendedRadius,
            1,
            Math.sin(angle) * extendedRadius
          ));
        }
        
        if (window.deflectedLine) scene.remove(window.deflectedLine);
        if (window.deflectedArrow) scene.remove(window.deflectedArrow);
        
        if (deflectedPath.length > 1) {
          const deflectedGeom = new THREE.BufferGeometry().setFromPoints(deflectedPath);
          const deflectedMat = new THREE.LineBasicMaterial({ 
            color: 0xff0000, 
            linewidth: 20,
            transparent: true,
            opacity: 1.0
          });
          window.deflectedLine = new THREE.Line(deflectedGeom, deflectedMat);
          scene.add(window.deflectedLine);
          
          // Add arrowhead at the end of the deflection line
          if (deflectionProgress > 0.1) {
            const lastPoint = deflectedPath[deflectedPath.length - 1];
            const secondLastPoint = deflectedPath[Math.max(0, deflectedPath.length - 2)];
            
            const dir = new THREE.Vector3().subVectors(lastPoint, secondLastPoint).normalize();
            const arrowLength = 20;
            const arrowWidth = 10;
            
            const arrowGeometry = new THREE.ConeGeometry(arrowWidth, arrowLength, 8);
            const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            const arrowMesh = new THREE.Mesh(arrowGeometry, arrowMaterial);
            
            arrowMesh.position.copy(lastPoint);
            arrowMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
            
            window.deflectedArrow = arrowMesh;
            scene.add(window.deflectedArrow);
          }
        }
        
        animationRef.current = requestAnimationFrame(animate);
      } else {
        animationRef.current = null;
      }
    };
    
    animate();
  };

  const handleReset = () => {
    setActiveStrategy(null);
    if (!sceneRef.current) return;
    
    const scene = sceneRef.current;
    
    // Clear any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    // Remove all lines, dots, and arrowheads
    if (window.asteroidMovingLine) scene.remove(window.asteroidMovingLine);
    if (window.mitigationMovingLine) scene.remove(window.mitigationMovingLine);
    if (window.magentaDotLine) scene.remove(window.magentaDotLine);
    if (window.magentaArrow) scene.remove(window.magentaArrow);
    if (window.deflectedLine) scene.remove(window.deflectedLine);
    if (window.deflectedArrow) scene.remove(window.deflectedArrow);
    if (window.magentaDot) scene.remove(window.magentaDot);
    
    // Clear references
    window.asteroidMovingLine = null;
    window.mitigationMovingLine = null;
    window.magentaDotLine = null;
    window.magentaArrow = null;
    window.deflectedLine = null;
    window.deflectedArrow = null;
    window.magentaDot = null;
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-b from-gray-900 to-black">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-gray-900 bg-opacity-90 border border-gray-700 hover:bg-gray-800 transition-colors text-white rounded shadow-lg"
      >
        <span>←</span>
        <span className="font-medium">BACK</span>
      </button>

      {/* Title */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-40 text-center">
        <h1 className="text-4xl font-bold text-white tracking-wider mb-2">
          🛡️ MITIGATION STRATEGIES
        </h1>
        <p className="text-blue-300 text-sm">
          2D Polar Coordinate System - Earth Defense Planning
        </p>
      </div>

      {/* Loading indicator */}
      {!earthLoaded && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40 text-white text-xl">
          Loading Earth Model...
        </div>
      )}

      {/* Canvas for 3D rendering */}
      <canvas ref={canvasRef} className="absolute inset-0" />
      
      {/* Legend - Right Side */}
      <div className="absolute top-32 right-8 z-50 bg-gray-900 bg-opacity-90 border border-gray-700 rounded-lg p-5 shadow-lg">
        <h3 className="text-white font-bold text-xl mb-4 text-center">LEGEND</h3>
        <div className="flex flex-col gap-3">
          {/* Solid Red Line */}
          <div className="flex items-center gap-3">
            <div className="w-14 h-1 bg-red-600 flex-shrink-0"></div>
            <span className="text-white text-base">Mitigated Asteroid Trajectory</span>
          </div>
          
          {/* Dotted Red Line */}
          <div className="flex items-center gap-3">
            <svg width="56" height="6" className="flex-shrink-0">
              <line x1="0" y1="3" x2="56" y2="3" stroke="#dc2626" strokeWidth="1.5" strokeDasharray="4 4" />
            </svg>
            <span className="text-white text-base">Initial Asteroid Trajectory</span>
          </div>
          
          {/* Pink Line */}
          <div className="flex items-center gap-3">
            <div className="w-14 h-1 bg-pink-500 flex-shrink-0"></div>
            <span className="text-white text-base">Satellite Trajectory</span>
          </div>
          
          {/* Green Line */}
          <div className="flex items-center gap-3">
            <div className="w-14 h-1 flex-shrink-0" style={{ backgroundColor: '#39ff14' }}></div>
            <span className="text-white text-base">Laser Trajectory</span>
          </div>
        </div>
      </div>
      
      {/* Control Buttons - Vertically Aligned */}
      <div className="absolute bottom-8 right-8 z-50 flex flex-col gap-3">
        {/* Reset Button */}
        <button
          onClick={handleReset}
          className="w-52 h-14 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg shadow-lg transition-all duration-200 hover:scale-105 flex items-center justify-center text-sm"
        >
          RESET
        </button>
        
        {/* Button 1 - Laser Deflection */}
        <button
          onClick={handleKineticImpact}
          className="w-52 h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg transition-all duration-200 hover:scale-105 flex items-center justify-center text-sm"
        >
          LASER DEFLECTION
        </button>
        
        {/* Button 2 - Gravity Tractor */}
        <button
          onClick={handleGravityTractor}
          className="w-52 h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg transition-all duration-200 hover:scale-105 flex items-center justify-center text-sm"
        >
          GRAVITY TRACTOR
        </button>
        
        {/* Button 3 - Kinetic Impactor */}
        <button
          onClick={handleKineticImpactor}
          className="w-52 h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg transition-all duration-200 hover:scale-105 flex items-center justify-center text-sm"
        >
          KINETIC IMPACTOR
        </button>
      </div>

      {/* Information Boxes - Bottom Left */}
      {/* Laser Deflection Info */}
      {activeStrategy === 'laser' && (
        <div className="absolute bottom-8 left-8 z-50 bg-gray-900 bg-opacity-95 border-2 border-blue-500 rounded-lg p-4 shadow-2xl max-w-md">
          <h3 className="text-blue-400 font-bold text-xl mb-3">Laser Deflection</h3>
          <p className="text-white text-sm mb-3 leading-relaxed">
            High power laser is aimed at the asteroid's surface, causing material to vaporize and eject. 
            This ejected material generates thrust, pushing asteroid off a collision course.
          </p>
          <div className="border-t border-gray-700 pt-3">
            <h4 className="text-blue-300 font-semibold text-base mb-2">IDEAL SITUATION:</h4>
            <ul className="text-white text-sm space-y-1 list-disc list-inside">
              <li>Smaller asteroids</li>
              <li>Early intervention scenarios</li>
              <li>Continuous operation</li>
            </ul>
          </div>
        </div>
      )}

      {/* Gravity Tractor Info */}
      {activeStrategy === 'gravity' && (
        <div className="absolute bottom-8 left-8 z-50 bg-gray-900 bg-opacity-95 border-2 border-purple-500 rounded-lg p-4 shadow-2xl max-w-md">
          <h3 className="text-purple-400 font-bold text-xl mb-3">Gravity Tractor</h3>
          <p className="text-white text-sm mb-3 leading-relaxed">
            Spacecraft "parks" near the asteroid, its gravitational pull slowly draws asteroid out of Earth's orbit.
          </p>
          <div className="border-t border-gray-700 pt-3">
            <h4 className="text-purple-300 font-semibold text-base mb-2">IDEAL SITUATION:</h4>
            <ul className="text-white text-sm space-y-1 list-disc list-inside">
              <li>Works on asteroids of any size and composition</li>
              <li>Very precise, minimal risk of fragmentation</li>
              <li>Takes years to execute</li>
            </ul>
          </div>
        </div>
      )}

      {/* Kinetic Impactor Info */}
      {activeStrategy === 'kinetic' && (
        <div className="absolute bottom-8 left-8 z-50 bg-gray-900 bg-opacity-95 border-2 border-red-500 rounded-lg p-4 shadow-2xl max-w-md">
          <h3 className="text-red-400 font-bold text-xl mb-3">Kinetic Impactor</h3>
          <p className="text-white text-sm mb-3 leading-relaxed">
            High speed spacecraft & asteroid collision transferring momentum and changing the asteroid's trajectory.
          </p>
          <div className="border-t border-gray-700 pt-3 mb-3">
            <h4 className="text-red-300 font-semibold text-base mb-2">IDEAL SITUATION:</h4>
            <ul className="text-white text-sm space-y-1 list-disc list-inside">
              <li>Solid asteroids</li>
              <li>Early intervention scenarios</li>
            </ul>
          </div>
          <div className="border-t border-gray-700 pt-3">
            <h4 className="text-red-300 font-semibold text-base mb-2">EXAMPLE:</h4>
            <p className="text-white text-sm">
              NASA's DART mission successfully altered the orbit of Dimorphos in 2022.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MitigationStrategies;
