// js/physics.js
import { canvasConfig, physicsConfig, pinConfig, bucketConfig, ballConfig } from './config.js';

// Module aliases
const Engine = Matter.Engine;
const World = Matter.World;
const Bodies = Matter.Bodies;
const Events = Matter.Events;
const Composite = Matter.Composite;

let engine;
let world;
let currentBall = null;
let staticBodies = [];

/**
 * Initializes the Matter.js engine and world.
 */
export function setupPhysics() {
    engine = Engine.create();
    world = engine.world;
    engine.world.gravity.y = physicsConfig.gravity;

    staticBodies = [
        ...createBounds(),
        ...createPins(), // Contains the corrected gap calculation
        ...createBuckets()
    ];
    World.add(world, staticBodies);

    return { engine, world };
}

/** Creates the outer walls/boundaries */
function createBounds() {
    const wallOptions = {
        isStatic: true, restitution: 0.1, friction: 0.5,
        render: { visible: false }
    };
    const thickness = 50;

    return [
        Bodies.rectangle(canvasConfig.width / 2, canvasConfig.height + thickness / 2, canvasConfig.width, thickness, { ...wallOptions, label: 'ground' }),
        Bodies.rectangle(-thickness / 2, canvasConfig.height / 2, thickness, canvasConfig.height, { ...wallOptions, label: 'wall-left' }),
        Bodies.rectangle(canvasConfig.width + thickness / 2, canvasConfig.height / 2, thickness, canvasConfig.height, { ...wallOptions, label: 'wall-right' }),
    ];
}

/** Creates pins, ensuring proper wall clearance using ball diameter */
function createPins() {
    const pins = [];
    const pinOptions = {
        isStatic: true, restitution: physicsConfig.restitution * 0.8,
        friction: physicsConfig.pinFriction, render: { fillStyle: pinConfig.color },
    };

    // --- CORRECTED Minimum distance calculation ---
    // The minimum distance from the wall edge (x=0) to the pin's CENTER.
    // Must allow space for the full ball diameter plus the pin's radius.
    const safetyBuffer = 3; // Keep a small buffer
    const requiredGapToPinCenter = (ballConfig.radius * 2) + pinConfig.radius + safetyBuffer;

    // minX is the smallest allowed X coordinate for a pin's CENTER.
    const minX = requiredGapToPinCenter;
    // maxX is the largest allowed X coordinate for a pin's CENTER.
    const maxX = canvasConfig.width - requiredGapToPinCenter;
    // --- End Corrected Calculation ---


    // --- Create the single starter pin (fixed center) ---
    const starterPinX = canvasConfig.width / 2;
    const starterPinY = pinConfig.offsetTop;

    if (starterPinX < minX || starterPinX > maxX) {
        console.warn(`Canvas width (${canvasConfig.width}px) might be too narrow. Starter pin (center ${starterPinX.toFixed(1)}) requires gap of ${requiredGapToPinCenter.toFixed(1)} from each wall.`);
    }

    pins.push(Bodies.circle(
        starterPinX, starterPinY, pinConfig.radius,
        { ...pinOptions, label: 'starter-pin' }
    ));


    // --- Create the main grid ---
    const gridStartY = starterPinY + pinConfig.rowsPadding;

    for (let row = 0; row < pinConfig.rows; row++) {
        const y = gridStartY + row * pinConfig.rowsPadding;
        const isStaggeredRow = row % 2 === 0;
        const cols = isStaggeredRow
            ? Math.floor(canvasConfig.width / pinConfig.colsPadding) - 1
            : Math.floor(canvasConfig.width / pinConfig.colsPadding);
        const xOffset = isStaggeredRow
            ? pinConfig.colsPadding : pinConfig.colsPadding / 2;

        for (let col = 0; col < cols; col++) {
            const baseX = xOffset + col * pinConfig.colsPadding;
            let randomX = baseX + (Math.random() - 0.5) * pinConfig.positionRandomness * 2;
            const randomY = y + (Math.random() - 0.5) * pinConfig.positionRandomness * 2;

            // Apply CLAMPING using the CORRECTED minX and maxX
            const clampedX = Math.max(minX, Math.min(randomX, maxX));

            pins.push(Bodies.circle(
                clampedX, randomY, pinConfig.radius,
                { ...pinOptions, label: 'pin' }
            ));
        }
    }

    return pins;
}


/** Creates the bucket dividers (rounded tops) and sensors */
function createBuckets() {
    const bucketBodies = [];
    const bucketWidth = canvasConfig.width / bucketConfig.count;
    const bucketWallOptions = {
        isStatic: true, restitution: 0.1, friction: 0.5,
        render: { fillStyle: bucketConfig.wallColor }, label: 'bucket-wall'
    };
     const bucketTopOptions = {
        isStatic: true, restitution: 0.2, friction: 0.1,
        render: { fillStyle: bucketConfig.wallColor }, label: 'bucket-divider-top'
    };
    const topRadius = bucketConfig.wallThickness / 2;
    const bucketSensorOptions = {
        isStatic: true, isSensor: true, render: { visible: false }
    };

    // Rectangular walls
    for (let i = 0; i <= bucketConfig.count; i++) {
        const x = i * bucketWidth;
        bucketBodies.push(Bodies.rectangle( x, canvasConfig.height - bucketConfig.height / 2,
            bucketConfig.wallThickness, bucketConfig.height, bucketWallOptions ));
    }
    // Rounded tops for inner dividers
     for (let i = 1; i < bucketConfig.count; i++) {
         const x = i * bucketWidth;
         const topY = canvasConfig.height - bucketConfig.height;
         bucketBodies.push(Bodies.circle( x, topY, topRadius, bucketTopOptions ));
     }
    // Bucket sensors
     for (let i = 0; i < bucketConfig.count; i++) {
        const x = (i + 0.5) * bucketWidth;
        bucketBodies.push(Bodies.rectangle( x, canvasConfig.height - bucketConfig.wallThickness / 2,
            bucketWidth - bucketConfig.wallThickness, bucketConfig.wallThickness,
            { ...bucketSensorOptions, label: `bucket-sensor-${i}` } ));
    }
    return bucketBodies;
}

// Store the last calculated startX (before clamping) for logging
let lastCalculatedStartX = ballConfig.spawnX;

/** Creates a new Pachinko ball */
export function createBall() {
    if (currentBall) removeBall();

    const randomOffset = (Math.random() - 0.5) * ballConfig.spawnXRandomness;
    const startX = ballConfig.spawnX + randomOffset;
    lastCalculatedStartX = startX; // Store for logging

    // Clamp ball's initial position to be within canvas bounds (considering its radius)
    const clampedX = Math.max(
        ballConfig.radius + 1,
        Math.min(startX, canvasConfig.width - ballConfig.radius - 1)
    );

    const ball = Bodies.circle(
        clampedX, ballConfig.spawnY, ballConfig.radius,
        {
            restitution: physicsConfig.restitution, friction: physicsConfig.friction,
            density: 0.005, label: 'ball', render: { fillStyle: ballConfig.color }
        }
    );
    currentBall = ball;
    World.add(world, ball);
    return ball;
}

/** Export function to get the last calculated offset */
export function getLastBallSpawnOffsetX() {
    return lastCalculatedStartX - ballConfig.spawnX;
}

/** Removes the current ball */
export function removeBall() {
    if (currentBall) {
        World.remove(world, currentBall);
        currentBall = null;
    }
}

/** Gets all bodies */
export function getAllBodies() { return Composite.allBodies(world); }
/** Gets the engine */
export function getEngine() { return engine; }
/** Gets the current ball */
export function getCurrentBall() { return currentBall; }

/** Sets up collision events */
export function setupCollisionEvents(callback) {
    Events.on(engine, 'collisionStart', (event) => {
        const pairs = event.pairs;
        for (let i = 0; i < pairs.length; i++) {
            const pair = pairs[i];
            let ball = null, sensor = null;
            if (pair.bodyA.label === 'ball' && pair.bodyB.label.startsWith('bucket-sensor')) {
                ball = pair.bodyA; sensor = pair.bodyB;
            } else if (pair.bodyB.label === 'ball' && pair.bodyA.label.startsWith('bucket-sensor')) {
                ball = pair.bodyB; sensor = pair.bodyA;
            }

            if (ball && sensor && ball === currentBall) {
                const bucketIndex = parseInt(sensor.label.split('-')[2], 10);
                const bucketWidth = canvasConfig.width / bucketConfig.count;
                const sensorCenterX = (bucketIndex + 0.5) * bucketWidth;
                 if (Math.abs(ball.position.x - sensorCenterX) < bucketWidth / 2 - bucketConfig.wallThickness / 2) {
                    callback(bucketIndex);
                 }
            }
        }
    });
}