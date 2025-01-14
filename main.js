// * A Starting Template for Lab in Vis Applications course module in TNM093
//  * -------------------------------------
//  *
//  * IMPORTANT:
//  * - This is a basic template serving as a starting template and NOT intended to cover all requirements.
//  * - You are encouraged to implement the lab in your own way.
//  * - Feel free to ignore this template if you prefer to start from scratch.
//  *
//  */


// Main simulation logic

// Select the SVG container
const svg = d3.select("#simulation-area");
const width = svg.attr("width");
const height = svg.attr("height");


// Default integration method
let integrationMethod = "verlet"; // Default to verlet

let simulationSpeed = 5; // Default speed
let particleMass = 0.2; // // Default mass 



// examples of default settings that can be changed later
let rows = parseInt(document.getElementById("rows").value, 10);
let cols = parseInt(document.getElementById("cols").value, 10);
let restoreForce = parseFloat(document.getElementById("restore-force").value);
let damping = parseFloat(document.getElementById("damping").value);
const nodeRadius = 7;
const timeStep = 0.016; // step-size
const padding = 50;

const minX = padding;
const maxX = width - padding;
const minY = padding;
const maxY = height - padding;

const springConstantSlider = document.getElementById('spring-constant');

// Arrays to hold positions, velocities, and forces
let positions = [];
let velocities = [];
let forces = [];
let isRunning = false;

let masses = [];


// Parameters 
//let k = springC


// Particle and spring setup //added by me
let particles = [
    { x: 300, y: 300, vx: 0, vy: 0, fx: 0, fy: 0 }, // First particle
    { x: 510, y: 300, vx: 0, vy: 0, fx: 0, fy: 0 }, // Second particle
];


// Spring between the two particles
let springs = {
    p1: particles[0],
    p2: particles[1],
    l0: 100, // Rest length = 1 m 
};

/**
* Initialize the grid with nodes and reset their positions, velocities, and forces.
*/
function initializeGrid() {



    // Clear old particles and springs to avoid conflicts
    particles = [];
    springs = [];
    positions = [];
    velocities = [];
    forces = [];
    masses = [];


    // Calculate the step size for the grid
    const xStep = (width - 2 * padding) / (cols - 1);
    const yStep = (height - 2 * padding) / (rows - 1);

    //task1
    if (rows === 1 && cols === 2) {
        // Task 1: Two particles connected by a spring
        particles = [
            { x: 300, y: 300, vx: 0, vy: 0, fx: 0, fy: 0, prevX: 300, prevY: 300 },
            { x: 500, y: 300, vx: 0, vy: 0, fx: 0, fy: 0, prevX: 500, prevY: 300 },
        ];

        springs = [
            { p1: particles[0], p2: particles[1], l0: 100 }, // Single spring
        ];

        drawNodes();
        drawEdges();

        return;

    }
    //task2
    if (rows === 2 && cols === 2) {
        particles = [
            { x: 300, y: 200, vx: 0, vy: 0, fx: 0, fy: 0, prevX: 300, prevY: 200 },
            { x: 500, y: 200, vx: 0, vy: 0, fx: 0, fy: 0, prevX: 500, prevY: 200 },
            { x: 300, y: 400, vx: 0, vy: 0, fx: 0, fy: 0, prevX: 300, prevY: 400 },
            { x: 500, y: 400, vx: 0, vy: 0, fx: 0, fy: 0, prevX: 500, prevY: 400 },
        ];

        springs = [
            { p1: particles[0], p2: particles[1], l0: 100 }, // Top edge
            { p1: particles[2], p2: particles[3], l0: 100 }, // Bottom edge
            { p1: particles[0], p2: particles[2], l0: 100 }, // Left edge
            { p1: particles[1], p2: particles[3], l0: 100 }, // Right edge
            // Add diagonal springs
            { p1: particles[0], p2: particles[3], l0: Math.sqrt(100 * 100 + 100 * 100) },
            { p1: particles[1], p2: particles[2], l0: Math.sqrt(100 * 100 + 100 * 100) },
        ];

        drawNodes();
        drawEdges();

        return;
    }
    else {

        // Create particles dynamically
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                particles.push({
                    x: padding + (j * xStep),
                    y: padding + (i * yStep),
                    vx: 0,
                    vy: 0,
                    fx: 0,
                    fy: 0,
                    prevX: padding + (j * xStep), // Initialize prevX
                    prevY: padding + (i * yStep), // Initialize prevY

                });
            }
        }

        // Create structural springs
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const current = i * cols + j;

                // Add horizontal spring
                if (j < cols - 1) {
                    springs.push({
                        p1: particles[current],
                        p2: particles[current + 1],
                        l0: Math.sqrt(
                            Math.pow(particles[current + 1].x - particles[current].x, 2) +
                            Math.pow(particles[current + 1].y - particles[current].y, 2)
                        ), // Dynamically calculate l0
                    });
                }

                // Add vertical spring
                if (i < rows - 1) {
                    springs.push({
                        p1: particles[current],
                        p2: particles[current + cols],
                        l0: Math.sqrt(
                            Math.pow(particles[current + 1].x - particles[current].x, 2) +
                            Math.pow(particles[current + 1].y - particles[current].y, 2)
                        ),
                    });
                }
            }
        }

        // Add diagonal springs
        for (let i = 0; i < rows - 1; i++) {
            for (let j = 0; j < cols - 1; j++) {
                const current = i * cols + j;

                // Top-left to bottom-right
                if (current + cols + 1 < particles.length) {
                    springs.push({
                        p1: particles[current],
                        p2: particles[current + cols + 1],
                        l0: Math.sqrt(
                            Math.pow(particles[current + 1].x - particles[current].x, 2) +
                            Math.pow(particles[current + 1].y - particles[current].y, 2)
                        ),
                    });
                }


                // Top-right to bottom-left
                if (current + cols < particles.length && current + 1 < particles.length) {
                    springs.push({
                        p1: particles[current + 1],
                        p2: particles[current + cols],
                        l0: Math.sqrt(
                            Math.pow(particles[current + cols].x - particles[current + 1].x, 2) +
                            Math.pow(particles[current + cols].y - particles[current + 1].y, 2)
                        ), // Dynamically calculate l0
                    });
                }

            }
        }

        drawNodes();
        drawEdges();
    }



}

/**
* Draw the nodes (circles) on the SVG.
*/
function drawNodes() {

    if (!particles || particles.length === 0) {
        console.error("Particles array is empty or not defined.");
        return;
    }

    const drag = d3.drag()
        .on("start", (event, d) => {
            // Stop particle's velocity while dragging
            d.vx = 0;
            d.vy = 0;
            d3.select(event.sourceEvent.target).attr("fill", "red"); // Highlight

        })
        .on("drag", (event, d) => {
            // Update particle position as it's dragged
            d.x = event.x;
            d.y = event.y;
            d3.select(event.sourceEvent.target).attr("fill", "red"); // Reset color

            // Redraw the updated particle and edges

            drawNodes();
            drawEdges();
        })
        .on("end", (event, d) => {
            // Optionally reset or leave particle's velocity after drag ends
            d.vx = 0;
            d.vy = 0;
            d3.select(event.sourceEvent.target).attr("fill", "blue"); // Reset color

        });


    // example of how to draw nodes on the svg
    const nodes = svg.selectAll("circle").data(particles);
    nodes
        .enter()
        .append("circle")
        .attr("r", nodeRadius)
        .merge(nodes)
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y)
        .attr("fill", "blue")
        .attr("stroke", "white")
        .attr("stroke-width", 2)
        .call(drag); // Attach drag behavior

    ;

    nodes.exit().remove();
}

/**
* Draw the edges (lines) connecting the nodes.
*/
function drawEdges() {
    // TODO: add your implementation here to connect the nodes with lines.

    if (!springs || springs.length === 0) {
        console.error("Springs array is empty or not defined.");
        return;
    }

    const edges = svg.selectAll("line").data(springs);
    edges
        .enter()
        .append("line")
        .merge(edges)
        .attr("x1", (d) => d.p1.x)
        .attr("y1", (d) => d.p1.y)
        .attr("x2", (d) => d.p2.x)
        .attr("y2", (d) => d.p2.y)
        .attr("stroke", "gray")
        .attr("stroke-width", 2);

    edges.exit().remove();

}

/**
* Calculate forces acting on each node.
* This function is a placeholder for students to implement force calculations.
*/
function calculateForces() {
    if (!springs || springs.length === 0) {
        console.error("No springs defined for force calculation.");
        return;
    }

    // Reset forces
    particles.forEach((p) => {
        p.fx = 0;
        p.fy = 0;
    });

    //    const gravity = 9.81; // m/s^2
    //    particles.forEach((p) => {
    //        p.fy += gravity * 0.2; // Add gravity force

    //    }
    //    );

    springs.forEach((spring) => {
        if (!spring.p1 || !spring.p2) {
            console.error("Spring is missing one or both particles:", spring);
            return;
        }
    
        const dx = spring.p2.x - spring.p1.x;
        const dy = spring.p2.y - spring.p1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const stretch = distance - spring.l0;
    
        if (distance === 0) {
            console.warn("Spring distance is zero; skipping force calculation.");
            return;
        }
    
        // Spring force
        const springForce = restoreForce * stretch;
        const fxSpring = (springForce * dx) / distance;
        const fySpring = (springForce * dy) / distance;
    
        // Damping force
        const dvx = spring.p2.vx - spring.p1.vx;
        const dvy = spring.p2.vy - spring.p1.vy;
        const dampingForceX = damping * dvx;
        const dampingForceY = damping * dvy;
    
        // Total force
        const fx = fxSpring - dampingForceX;
        const fy = fySpring - dampingForceY;
    
        // Apply forces to particles
        spring.p1.fx += fx;
        spring.p1.fy += fy;
        spring.p2.fx -= fx;
        spring.p2.fy -= fy;
        
    });
    


}


function applyBoundaryConditions(p) {
    // Check X boundaries
    if (p.x <= minX || p.x >= maxX) {
        p.vx = -p.vx; // Reverse velocity in x-direction
        p.x = Math.max(minX, Math.min(p.x, maxX)); // Clamp position within bounds
    }

    // Check Y boundaries
    if (p.y <= minY || p.y >= maxY) {
        p.vy = -p.vy; // Reverse velocity in y-direction
        p.y = Math.max(minY, Math.min(p.y, maxY)); // Clamp position within bounds
    }
}

function updatePositionsEuler() {
    // TODO: think about how to calculate positions and velocities. (e.g. Euler's method)
    calculateForces();

    particles.forEach(p => {

        const ax = p.fx / particleMass; // Acceleration = Force / Mass
        const ay = p.fy / particleMass;

        // Update velocity
        p.vx += 0.5 * ax * timeStep; // Velocity = Velocity + Acceleration * timeStep
        p.vy += 0.5 * ay * timeStep;

        // Update position
        p.x += p.vx * timeStep; // Position = Position + Velocity * timeStep
        p.y += p.vy * timeStep;

        console.log("Updated position:", { x: p.x, y: p.y });
        console.log(`Particle Mass: ${particleMass}, Acceleration: (${ax.toFixed(3)}, ${ay.toFixed(3)})`);

        applyBoundaryConditions(p);


    });

    // TODO: Think about how to redraw nodes and edges with updated positions
    drawNodes();
    drawEdges();
}



function updatePositionsVerlet() {
    particles.forEach(p => {
        if (p.dragged) return; // Skip dragged particles

        // Calculate acceleration
        const ax = p.fx / particleMass; // F = ma
        const ay = p.fy / particleMass;

        // Verlet formula with timeStep^2
        const nextX = 2 * p.x - p.prevX + ax * timeStep * timeStep;
        const nextY = 2 * p.y - p.prevY + ay * timeStep * timeStep;

        // Update previous and current positions
        p.prevX = p.x;
        p.prevY = p.y;
        p.x = nextX;
        p.y = nextY;

        // Apply boundary conditions
        applyBoundaryConditions(p);

        console.log("Updated position:", { x: p.x, y: p.y });
        console.log(`Particle Mass: ${particleMass}, Acceleration: (${ax.toFixed(3)}, ${ay.toFixed(3)})`);
    });

    drawNodes();
    drawEdges();
}



function render() {
    //select the svg area
}
/**
* Main simulation loop.
* Continuously updates the simulation as long as `isRunning` is true.
*/
function simulationLoop() {
    if (!isRunning) return;

    console.log("Simulation running...");

    // TODO: think about how to implement the simulation loop. below are some functions that you might find useful.
    calculateForces(); // Calculate spring and damping forces

    // Choose the integration method
    switch (integrationMethod) {

        case "verlet":
            updatePositionsVerlet();
            break;
        case "euler":
            updatePositionsEuler();
            break;
    }



    drawNodes();       // Redraw particles
    drawEdges();       // Redraw the spring
    requestAnimationFrame(simulationLoop);


}


// ********** Event listeners examples for controls **********

// Start/Stop simulation
document.getElementById("toggle-simulation").addEventListener("click", () => {
    isRunning = !isRunning;
    document.getElementById("toggle-simulation").innerText = isRunning ? "Stop Simulation" : "Start Simulation";
    if (isRunning) simulationLoop();
});

// Update grid rows
document.getElementById("rows").addEventListener("input", (e) => {
    rows = parseInt(e.target.value, 10);
    initializeGrid();
});

// Update grid columns
document.getElementById("cols").addEventListener("input", (e) => {
    cols = parseInt(e.target.value, 10);
    initializeGrid();
});

// Update restore force
document.getElementById("restore-force").addEventListener("input", (e) => {
    restoreForce = parseFloat(e.target.value);
    document.getElementById("restore-force-value").textContent = restoreForce.toFixed(2);
});

 // Update damping
 document.getElementById("damping").addEventListener("input", (e) => {
    damping = parseFloat(e.target.value);
    document.getElementById("damping-value").textContent = damping.toFixed(2);
});

document.getElementById("integration-method").addEventListener("change", (e) => {
    integrationMethod = e.target.value;
    console.log("Integration method set to:", integrationMethod);
});


document.getElementById("simulation-speed").addEventListener("input", (e) => {
    simulationSpeed = parseInt(e.target.value, 10);
    document.getElementById("simulation-speed-value").textContent = simulationSpeed;

});

// Update mass dynamically
document.getElementById("particle-mass").addEventListener("input", (e) => {
    particleMass = parseFloat(e.target.value);
    document.getElementById("particle-mass-value").textContent = particleMass.toFixed(1);
    console.log("Updated particle mass:", particleMass);
});




// Initialize the simulation
initializeGrid();
// additional functions
