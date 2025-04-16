// --- DOM Elements ---
const homePage = document.getElementById('home');
const exercisePage = document.getElementById('exercise');
const phaseDurationSlider = document.getElementById('phaseDurationSlider');
const phaseDurationValueDisplay = document.getElementById('phaseDurationValue');
const timeLimitButtons = document.querySelectorAll('.time-limit-btn');
const selectedTimeLimitDisplay = document.getElementById('selectedTimeLimit');
const startButton = document.getElementById('startButton');
const startNoLimitButton = document.getElementById('startNoLimitButton');
const stopButton = document.getElementById('stopButton');
const totalTimerDisplay = document.getElementById('totalTimerDisplay');
const phaseTimerDisplay = document.getElementById('phaseTimerDisplay');
const phaseNameDisplay = document.getElementById('phaseNameDisplay');
const boxElement = document.getElementById('box');
const dotElement = document.getElementById('dot');

// --- State Variables ---
let phaseDuration = 4; // Default phase duration in seconds
let timeLimit = null; // Time limit in seconds (null means no limit)
let totalTimeElapsed = 0; // Total time elapsed in seconds
let phaseTimeRemaining = 0; // Time remaining in the current phase
let currentPhaseIndex = -1; // Start before the first phase (-1)
const phases = ['inhale', 'hold', 'exhale', 'wait'];
let phaseIntervalId = null; // ID for the phase timer interval
let totalTimerIntervalId = null; // ID for the total timer interval
let animationTimeoutId = null; // ID for animation timing
let isEndingSequence = false; // Flag to manage ending on exhale

// --- Initial Setup ---
phaseDurationSlider.value = phaseDuration;
phaseDurationValueDisplay.textContent = phaseDuration;
dotElement.style.transitionDuration = `${phaseDuration}s`; // Sync dot transition with duration

// --- Helper Functions ---

/**
 * Formats seconds into MM:SS format.
 * @param {number} totalSeconds - The total seconds to format.
 * @returns {string} Formatted time string (MM:SS).
 */
function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
}

/**
 * Updates the display for the total time elapsed.
 */
function updateTotalTimerDisplay() {
    totalTimerDisplay.textContent = formatTime(totalTimeElapsed);
}

/**
 * Updates the display for the phase timer and phase name.
 */
function updatePhaseDisplay() {
    phaseTimerDisplay.textContent = phaseTimeRemaining;
    const currentPhaseName = phases[currentPhaseIndex] || 'Get Ready';
    phaseNameDisplay.textContent = currentPhaseName;
    // Update box data attribute for CSS animation targeting
    if (currentPhaseIndex >= 0) {
        boxElement.dataset.phase = phases[currentPhaseIndex];
    } else {
        delete boxElement.dataset.phase; // Remove attribute when not in a cycle
    }
}

/**
 * Moves to the next phase in the breathing cycle.
 */
function nextPhase() {
    // Check if time limit reached and we are in the ending sequence
    if (isEndingSequence && phases[currentPhaseIndex] === 'exhale') {
        stopExercise();
        return; // Stop after completing the exhale
    }

    // Move to the next phase index, looping back to 0
    currentPhaseIndex = (currentPhaseIndex + 1) % phases.length;
    phaseTimeRemaining = phaseDuration; // Reset phase timer

    // Update dot animation transition duration in case slider changed
    dotElement.style.transitionDuration = `${phaseDuration}s`;

    updatePhaseDisplay(); // Update UI immediately

    // Clear previous animation timeout if any
    if (animationTimeoutId) clearTimeout(animationTimeoutId);

    // Set timeout for the next phase change
    // We use setTimeout instead of setInterval for phase changes
    // to ensure it aligns perfectly with the phase duration.
    animationTimeoutId = setTimeout(nextPhase, phaseDuration * 1000);
}

/**
 * Handles the countdown for the current phase timer (every second).
 */
function phaseTick() {
    if (phaseTimeRemaining > 1) {
        phaseTimeRemaining--;
        updatePhaseDisplay(); // Update countdown display
    }
    // Note: The actual phase change is handled by the `nextPhase` function's setTimeout
}


/**
 * Handles the increment for the total exercise timer (every second).
 */
function totalTimeTick() {
    totalTimeElapsed++;
    updateTotalTimerDisplay();

    // Check if time limit is set and reached
    if (timeLimit !== null && totalTimeElapsed >= timeLimit) {
        if (!isEndingSequence) {
            console.log("Time limit reached. Waiting for exhale to finish...");
            isEndingSequence = true; // Start the ending sequence
            // If currently on exhale, stop immediately after this phase ends
            if (phases[currentPhaseIndex] === 'exhale') {
                // The nextPhase function will handle the stop
            } else {
                // Otherwise, nextPhase will check the flag and stop after the next exhale
            }
        }
    }
}

/**
 * Starts the breathing exercise.
 */
function startExercise() {
    console.log(`Starting exercise. Duration: ${phaseDuration}s, Limit: ${timeLimit ? timeLimit + 's' : 'None'}`);
    isEndingSequence = false; // Reset ending flag
    totalTimeElapsed = 0;
    currentPhaseIndex = -1; // Reset to start before 'inhale'

    // Update displays
    updateTotalTimerDisplay();
    phaseTimerDisplay.textContent = phaseDuration; // Show initial duration
    phaseNameDisplay.textContent = 'Get Ready';
    delete boxElement.dataset.phase; // Ensure no phase data attribute initially
    dotElement.style.transitionDuration = `${phaseDuration}s`; // Ensure correct transition speed
    // Reset dot to start position visually (bottom-left) - slight delay for transition reset
    dotElement.style.transition = 'none'; // Temporarily disable transition
    dotElement.style.bottom = '0';
    dotElement.style.left = '0';
    // Force reflow to apply position change immediately
    void dotElement.offsetWidth;
    // Re-enable transition
    dotElement.style.transition = `all ${phaseDuration}s ease-in-out`;


    // Show exercise page, hide home page
    homePage.classList.add('hidden');
    exercisePage.classList.remove('hidden');
    exercisePage.classList.add('flex'); // Ensure flex display is re-applied

    // Start the first phase slightly delayed to allow 'Get Ready' message
    setTimeout(() => {
        // Start the phase cycle
        nextPhase(); // This starts the first phase ('inhale') and sets the first animation timeout

        // Start the per-second timers
        // Phase timer ticks down the number display
        phaseIntervalId = setInterval(phaseTick, 1000);
        // Total timer tracks overall time and checks limit
        totalTimerIntervalId = setInterval(totalTimeTick, 1000);
    }, 1000); // 1 second delay for "Get Ready"
}

/**
 * Stops the breathing exercise and returns to the home page.
 */
function stopExercise() {
    console.log("Stopping exercise.");
    // Clear all timers and timeouts
    if (phaseIntervalId) clearInterval(phaseIntervalId);
    if (totalTimerIntervalId) clearInterval(totalTimerIntervalId);
    if (animationTimeoutId) clearTimeout(animationTimeoutId);
    phaseIntervalId = null;
    totalTimerIntervalId = null;
    animationTimeoutId = null;

    // Reset state variables
    timeLimit = null; // Reset selected time limit
    isEndingSequence = false;
    currentPhaseIndex = -1;
    selectedTimeLimitDisplay.textContent = ''; // Clear time limit display


    // Reset UI elements
    phaseNameDisplay.textContent = 'Get Ready';
    phaseTimerDisplay.textContent = phaseDurationSlider.value; // Reset to slider value
    delete boxElement.dataset.phase; // Clear animation state
     // Reset dot to start position visually (bottom-left)
    dotElement.style.transition = 'none';
    dotElement.style.bottom = '0';
    dotElement.style.left = '0';
     void dotElement.offsetWidth; // Reflow
    dotElement.style.transition = `all ${phaseDurationSlider.value}s ease-in-out`; // Reset transition duration


    // Show home page, hide exercise page
    exercisePage.classList.add('hidden');
    exercisePage.classList.remove('flex');
    homePage.classList.remove('hidden');
}

// --- Event Listeners ---

// Update phase duration when slider changes
phaseDurationSlider.addEventListener('input', (e) => {
    phaseDuration = parseInt(e.target.value, 10);
    phaseDurationValueDisplay.textContent = phaseDuration;
    // Update phase timer display immediately if on home screen
    if (homePage.classList.contains('hidden') === false) {
         phaseTimerDisplay.textContent = phaseDuration;
    }
    // Update dot transition duration for next cycle
    dotElement.style.transitionDuration = `${phaseDuration}s`;
});

// Set time limit when a button is clicked
timeLimitButtons.forEach(button => {
    button.addEventListener('click', () => {
        timeLimit = parseInt(button.dataset.time, 10);
        selectedTimeLimitDisplay.textContent = `Time Limit: ${button.textContent}`;
        console.log(`Time limit set to: ${timeLimit} seconds`);
        // Optionally highlight selected button
        timeLimitButtons.forEach(btn => btn.classList.remove('bg-orange-800'));
        button.classList.add('bg-orange-800'); // Darker shade for selection
    });
});

// Start exercise with the selected limit (or default if none selected)
startButton.addEventListener('click', () => {
    // If no time limit button was explicitly clicked, timeLimit remains null (no limit)
     if (timeLimit === null) {
         console.log("Starting with no time limit (Start button clicked).");
     }
    startExercise();
});

// Start exercise explicitly with no time limit
startNoLimitButton.addEventListener('click', () => {
    timeLimit = null; // Ensure no time limit is set
    selectedTimeLimitDisplay.textContent = 'No time limit selected';
    timeLimitButtons.forEach(btn => btn.classList.remove('bg-orange-800')); // Clear selection visuals
    console.log("Starting with no time limit (explicit button).");
    startExercise();
});


// Stop exercise when stop button is clicked
stopButton.addEventListener('click', stopExercise);

// --- Initial UI Update ---
updatePhaseDisplay(); // Set initial phase display text
updateTotalTimerDisplay(); // Set initial total time display
