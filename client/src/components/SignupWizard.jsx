import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InputGroup from './InputGroup';
import api from '../api/axios';

const SignupWizard = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        businessName: '',
        gstNumber: '',
        businessType: '',
        industry: '',
        registrationDate: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        pincode: '',
        state: '',
        country: '',
        businessEmail: '',
        businessPhone: '',
        panNumber: '',
        agreedToTerms: false
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const validateStep = async () => {
        setError('');

        if (step === 1) {
            if (!formData.fullName || !formData.email || !formData.password) return "All fields required";
        }

        if (step === 2) {
            if (!formData.businessName || !formData.gstNumber || !formData.businessType || !formData.industry || !formData.registrationDate) return "All fields required";
            // Check backend for overlaps
            try {
                // Verify with backend if business details are taken
                // Note: Backend check logic should match this
            } catch (e) {
                // handle error
            }
        }

        if (step === 3) {
            if (!formData.addressLine1 || !formData.city || !formData.pincode || !formData.state || !formData.country) return "Address fields required";
        }

        if (step === 4) {
            if (!formData.businessEmail || !formData.businessPhone || !formData.panNumber) return "Contact fields required";
            if (!formData.agreedToTerms) return "You must agree to terms";
        }

        return null;
    };

    const handleNext = async () => {
        const validationError = await validateStep();
        if (validationError) {
            setError(validationError);
            return;
        }

        if (step === 2 || step === 4) {
            // Optional: Pre-check specific unique fields with backend
        }

        setStep(prev => prev + 1);
    };

    const handleBack = () => {
        setStep(prev => prev - 1);
        setError('');
    };

    const handleSubmit = async () => {
        const validationError = await validateStep();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        try {
            // 1. Check with backend first (redundant safety)
            await api.post('/auth/check-user', {
                email: formData.email,
                businessName: formData.businessName,
                businessEmail: formData.businessEmail
            });

            // 2. Register user in our MERN backend (MongoDB + JWT)
            const res = await api.post('/auth/register', formData);
            const token = res.data?.token;
            if (token) {
                localStorage.setItem('token', token);
            }

            alert('Registration Successful');
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-lg mt-10 border border-blue-50">
            <h2 className="text-2xl font-bold text-center text-blue-600 mb-6">Create Account - Step {step}/4</h2>

            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

            {step === 1 && (
                <div className="animate-fade-in">
                    <InputGroup label="Full Name" name="fullName" value={formData.fullName} onChange={handleChange} required />
                    <InputGroup label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} required />
                    <InputGroup label="Password" name="password" type="password" value={formData.password} onChange={handleChange} required />
                </div>
            )}

            {step === 2 && (
                <div className="animate-fade-in">
                    <InputGroup label="Registered Business Name" name="businessName" value={formData.businessName} onChange={handleChange} required />
                    <InputGroup label="GST Number" name="gstNumber" value={formData.gstNumber} onChange={handleChange} required />
                    <InputGroup label="Business Type" name="businessType" type="select" options={['Sole Proprietor', 'Partnership', 'LLP', 'Private Limited', 'Public Limited']} value={formData.businessType} onChange={handleChange} required />
                    <InputGroup label="Industry" name="industry" type="select" options={['Retail', 'Service', 'Manufacturing', 'Technology', 'Construction']} value={formData.industry} onChange={handleChange} required />
                    <InputGroup label="Registration Date" name="registrationDate" type="date" value={formData.registrationDate} onChange={handleChange} required />
                </div>
            )}

            {step === 3 && (
                <div className="animate-fade-in">
                    <InputGroup label="Address Line 1" name="addressLine1" value={formData.addressLine1} onChange={handleChange} required />
                    <InputGroup label="Address Line 2" name="addressLine2" value={formData.addressLine2} onChange={handleChange} />
                    <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="City" name="city" value={formData.city} onChange={handleChange} required />
                        <InputGroup label="Pincode" name="pincode" value={formData.pincode} onChange={handleChange} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="State" name="state" value={formData.state} onChange={handleChange} required />
                        <InputGroup label="Country" name="country" value={formData.country} onChange={handleChange} required />
                    </div>
                </div>
            )}

            {step === 4 && (
                <div className="animate-fade-in">
                    <InputGroup label="Business Email" name="businessEmail" type="email" value={formData.businessEmail} onChange={handleChange} required />
                    <InputGroup label="Business Phone" name="businessPhone" type="tel" value={formData.businessPhone} onChange={handleChange} required />
                    <InputGroup label="PAN Number" name="panNumber" value={formData.panNumber} onChange={handleChange} required />

                    <div className="mb-4">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                name="agreedToTerms"
                                checked={formData.agreedToTerms}
                                onChange={handleChange}
                                className="mr-2 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="text-gray-700">I agree to terms and conditions</span>
                        </label>
                    </div>
                </div>
            )}

            <div className="flex justify-between mt-8">
                {step > 1 && (
                    <button
                        onClick={handleBack}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded transition duration-200"
                    >
                        Back
                    </button>
                )}

                {step < 4 ? (
                    <button
                        onClick={handleNext}
                        className="ml-auto bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded transition duration-200 shadow-md"
                    >
                        Next
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className={`ml-auto bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded transition duration-200 shadow-md ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Creating Account...' : 'Submit'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default SignupWizard;
