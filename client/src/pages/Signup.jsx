import React from 'react';
import SignupWizard from '../components/SignupWizard';
import { Link } from 'react-router-dom';

const Signup = () => {
    return (
        <div className="min-h-screen bg-blue-50 py-10 px-4">
            <div className="text-center mb-6">
                <h1 className="text-4xl font-bold text-blue-800">Welcome to BMT</h1>
                <p className="text-gray-600 mt-2">Business Management Tool</p>
            </div>
            <SignupWizard />
            <p className="mt-6 text-center text-gray-600">
                Already have an account? <Link to="/login" className="text-blue-500 hover:text-blue-700 font-bold">Sign In</Link>
            </p>
        </div>
    );
};

export default Signup;
