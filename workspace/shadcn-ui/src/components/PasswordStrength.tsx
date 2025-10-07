
import React from 'react';

const PasswordStrength = ({ password }) => {
  const getPasswordStrength = () => {
    let score = 0;
    if (!password) return score;

    // award 1 point for every character
    score += password.length;

    // award 1 point for using lowercase and uppercase letters
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
      score += 1;
    }

    // award 1 point for using a number
    if (/[0-9]/.test(password)) {
      score += 1;
    }

    // award 1 point for using a symbol
    if (/[^a-zA-Z0-9]/.test(password)) {
      score += 1;
    }

    return score;
  };

  const score = getPasswordStrength();
  let strength = '';
  let color = '';

  if (score > 12) {
    strength = 'Very Strong';
    color = 'bg-green-500';
  } else if (score > 9) {
    strength = 'Strong';
    color = 'bg-blue-500';
  } else if (score > 6) {
    strength = 'Medium';
    color = 'bg-yellow-500';
  } else {
    strength = 'Weak';
    color = 'bg-red-500';
  }

  return (
    <div className="flex items-center mt-2">
      <div className={`w-1/4 h-2 rounded-full mr-2 ${score > 0 ? color : 'bg-gray-200'}`}></div>
      <div className={`w-1/4 h-2 rounded-full mr-2 ${score > 6 ? color : 'bg-gray-200'}`}></div>
      <div className={`w-1/4 h-2 rounded-full mr-2 ${score > 9 ? color : 'bg-gray-200'}`}></div>
      <div className={`w-1/4 h-2 rounded-full ${score > 12 ? color : 'bg-gray-200'}`}></div>
      <div className="ml-2 text-sm">{strength}</div>
    </div>
  );
};

export default PasswordStrength;
