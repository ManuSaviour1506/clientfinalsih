import React from 'react';

const INSTRUCTIONS = {
    'Vertical Jump': [
        "Stand side-on to the camera in a well-lit area.",
        "Ensure your entire body is visible in the frame.",
        "From a standstill, jump as high as you possibly can.",
        "Land safely with your knees bent.",
    ],
    'Sit-ups': [
        "Lie on your back with knees bent and feet flat on the floor.",
        "Place your hands behind your head or across your chest.",
        "Raise your upper body towards your knees.",
        "Lower yourself back down to complete one rep.",
    ],
    'Endurance Run': [
        "This is a high-knee endurance test.",
        "Stand facing the camera so your full body is visible.",
        "Run in place, bringing each knee clearly above hip level.",
        "Maintain consistent pace throughout the video.",
    ],
    'Shuttle Run': [
        "Set up two markers ~5 meters apart, both visible in frame.",
        "Start at one marker and sprint to the other.",
        "Touch the line/marker and immediately sprint back.",
        "Repeat for the duration of the video.",
    ],
    'Push-ups': [
        "Place hands shoulder-width apart on the floor.",
        "Keep your body in a straight line from head to heels.",
        "Lower your chest until it nearly touches the floor.",
        "Push back up to the starting position to complete one rep.",
    ],
    'Sprint': [
        "Set a clear start and finish line visible in the frame.",
        "Begin from a standing or crouching start position.",
        "Sprint at maximum effort from start to finish line.",
        "Ensure your full run is captured in the video.",
    ],
};

const TestInstructions = ({ test }) => {
    const steps = INSTRUCTIONS[test?.name] || ["No specific instructions available."];
    return (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
            <p className="text-xs font-black text-amber-700 uppercase tracking-wider mb-3">
                📋 Instructions for {test?.name}
            </p>
            <ol className="space-y-2">
                {steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-amber-900">
                        <span className="font-bold text-amber-500 flex-shrink-0">{i + 1}.</span>
                        {step}
                    </li>
                ))}
            </ol>
            <p className="mt-4 text-xs font-semibold text-red-600 border-t border-amber-200 pt-3">
                ⚠️ Ensure you are in a well-lit area with your entire body visible throughout the video.
            </p>
        </div>
    );
};

export default TestInstructions;