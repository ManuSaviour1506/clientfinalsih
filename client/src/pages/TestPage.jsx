import React from 'react';
import { useParams, Link } from 'react-router-dom';
import VideoUploader from '../components/tests/VideoUploader';
import TestInstructions from '../components/tests/TestInstructions'; // You need this import

const MOCK_TESTS = {
  "60d0fe4f5311236168a109ca": {
    name: "Vertical Jump",
    description: "Test your explosive leg power.",
  },
  "60d0fe4f5311236168a109cb": {
    name: "Sit-ups",
    description: "Measure your core muscular endurance.",
  },
  "60d0fe4f5311236168a109cc": {
    name: "Endurance Run",
    description: "A proxy test for cardiovascular fitness.",
  },
  "60d0fe4f5311236168a109cd": {
    name: "Shuttle Run",
    description: "Test your agility and speed.",
  },
  "68d194a772df635c09c25d25": {
    name: "Push-ups",
    description: "Measure your upper body strength and endurance.",
  },
};

const TestPage = () => {
    const { testId } = useParams();
    const test = MOCK_TESTS[testId];

    if (!test) {
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold">Test Not Found</h2>
            <Link to="/dashboard" className="text-amber-500 hover:underline">
              Back to Dashboard
            </Link>
          </div>
        );
    }

    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-amber-500">{test.name}</h1>
          <p className="mt-2 max-w-2xl mx-auto text-md text-gray-600">
            <strong>Instructions:</strong> {test.description}
          </p>
        </div>
        <TestInstructions test={test} />
        <VideoUploader testId={testId} />
      </div>
    );
};

export default TestPage;
