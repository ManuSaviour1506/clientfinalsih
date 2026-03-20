import React from 'react';
import { Link } from 'react-router-dom';
import Button from "../common/Button.jsx";

const TestCard = ({ test }) => {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 flex flex-col justify-between transform hover:-translate-y-1">
        <div>
          <h3 className="text-lg font-bold text-amber-500">{test.name}</h3>
          <p className="text-sm text-gray-600 mt-2">{test.description}</p>
        </div>
        <div className="mt-4">
          <Link to={`/test/${test._id}`}>
            <Button variant="primary">Start Test</Button>
          </Link>
        </div>
      </div>
    );
};

export default TestCard;
