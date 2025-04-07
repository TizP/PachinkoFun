// js/graphics.js
import { canvasConfig, pinConfig, bucketConfig, gameRules } from './config.js';

/**
 * Renders the current state of the physics world onto the canvas.
 */
export function render(ctx, bodies) {
    ctx.clearRect(0, 0, canvasConfig.width, canvasConfig.height);
    drawBucketPrizes(ctx); // Draw prize text first (underneath everything else)

    bodies.forEach(body => {
        switch (body.label) {
            case 'ball':
                drawCircle(ctx, body);
                break;
            case 'starter-pin':
            case 'pin':
                drawCircle(ctx, body);
                break;
            case 'bucket-wall':
                drawRectangle(ctx, body);
                break;
            // --- NEW CASE for rounded tops ---
            case 'bucket-divider-top':
                drawCircle(ctx, body); // Draw the circle top
                break;
            // --- END NEW CASE ---
            // Sensors and boundaries are not drawn
        }
    });
}

/** Draws a circle body */
function drawCircle(ctx, body) {
    ctx.beginPath();
    ctx.arc(body.position.x, body.position.y, body.circleRadius, 0, 2 * Math.PI);
    ctx.fillStyle = body.render && body.render.fillStyle ? body.render.fillStyle : '#cccccc';
    ctx.fill();
}

/** Draws a rectangle body (handling rotation) */
function drawRectangle(ctx, body) {
    ctx.save();
    ctx.translate(body.position.x, body.position.y);
    ctx.rotate(body.angle);
    ctx.beginPath();
    const vertices = body.vertices;
    ctx.moveTo(vertices[0].x - body.position.x, vertices[0].y - body.position.y);
    for (let j = 1; j < vertices.length; j++) {
        ctx.lineTo(vertices[j].x - body.position.x, vertices[j].y - body.position.y);
    }
    ctx.closePath();
    ctx.fillStyle = body.render && body.render.fillStyle ? body.render.fillStyle : '#cccccc';
    ctx.fill();
    ctx.restore();
}

/** Draws the prize amounts at the bottom of each bucket */
function drawBucketPrizes(ctx) {
    const bucketWidth = canvasConfig.width / bucketConfig.count;
    const rewards = gameRules.bucketRewards;

    ctx.font = bucketConfig.prizeFont;
    ctx.fillStyle = bucketConfig.prizeColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < bucketConfig.count; i++) {
        const rewardText = `${rewards[i]}€`;
        const bucketCenterX = (i + 0.5) * bucketWidth;
        const textY = canvasConfig.height - bucketConfig.height / 2.5;
        ctx.fillText(rewardText, bucketCenterX, textY);
    }
}