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

    const totalSteps = 4;
    const progress = (step / totalSteps) * 100;

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
            await api.post('/auth/check-user', {
                email: formData.email,
                businessName: formData.businessName,
                businessEmail: formData.businessEmail
            });

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
        <div className="max-w-3xl mx-auto bg-white/90 backdrop-blur-sm p-10 rounded-2xl shadow-2xl mt-10 border border-gray-100 transition-all duration-300">
            {/* Progress Bar Header */}
            <div className="mb-10">
                <div className="flex justify-between items-end mb-2">
                    <h2 className="text-2xl font-bold text-gray-800">
                        {step === 1 && "Account Information"}
                        {step === 2 && "Business Details"}
                        {step === 3 && "Address & Location"}
                        {step === 4 && "Confirmation"}
                    </h2>
                    <span className="text-sm font-semibold text-blue-600">Step {step} of {totalSteps}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6 animate-pulse">
                    <p className="font-medium">Please fix the following error:</p>
                    <p>{error}</p>
                </div>
            )}

            <div className="min-h-[300px]">
                {step === 1 && (
                    <div className="space-y-5 animate-fade-in-up">
                        <InputGroup label="Full Name" name="fullName" value={formData.fullName} onChange={handleChange} required />
                        <InputGroup label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} required />
                        <InputGroup label="Password" name="password" type="password" value={formData.password} onChange={handleChange} required />
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-5 animate-fade-in-up">
                        <InputGroup label="Registered Business Name" name="businessName" value={formData.businessName} onChange={handleChange} required />
                        <InputGroup label="GST Number" name="gstNumber" value={formData.gstNumber} onChange={handleChange} required />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <InputGroup label="Business Type" name="businessType" type="select" options={['Sole Proprietor', 'Partnership', 'LLP', 'Private Limited', 'Public Limited']} value={formData.businessType} onChange={handleChange} required />
                            <InputGroup label="Industry" name="industry" type="select" options={['Retail', 'Service', 'Manufacturing', 'Technology', 'Construction']} value={formData.industry} onChange={handleChange} required />
                        </div>
                        <InputGroup label="Registration Date" name="registrationDate" type="date" value={formData.registrationDate} onChange={handleChange} required />
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-5 animate-fade-in-up">
                        <InputGroup label="Address Line 1" name="addressLine1" value={formData.addressLine1} onChange={handleChange} required />
                        <InputGroup label="Address Line 2" name="addressLine2" value={formData.addressLine2} onChange={handleChange} />
                        <div className="grid grid-cols-2 gap-5">
                            <InputGroup label="City" name="city" value={formData.city} onChange={handleChange} required />
                            <InputGroup label="Pincode" name="pincode" value={formData.pincode} onChange={handleChange} required />
                        </div>
                        <div className="grid grid-cols-2 gap-5">
                            <InputGroup label="State" name="state" value={formData.state} onChange={handleChange} required />
                            <InputGroup label="Country" name="country" value={formData.country} onChange={handleChange} required />
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-5 animate-fade-in-up">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <InputGroup label="Business Email" name="businessEmail" type="email" value={formData.businessEmail} onChange={handleChange} required />
                            <InputGroup label="Business Phone" name="businessPhone" type="tel" value={formData.businessPhone} onChange={handleChange} required />
                        </div>
                        <InputGroup label="PAN Number" name="panNumber" value={formData.panNumber} onChange={handleChange} required />

                        <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="agreedToTerms"
                                    checked={formData.agreedToTerms}
                                    onChange={handleChange}
                                    className="mr-3 h-5 w-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                />
                                <span className="text-gray-700 font-medium">I agree to the Terms & Conditions</span>
                            </label>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center mt-12 pt-6 border-t border-gray-100">
                {step > 1 ? (
                    <button
                        onClick={handleBack}
                        className="text-gray-500 hover:text-gray-700 font-semibold px-4 py-2 rounded transition-colors"
                    >
                        Back
                    </button>
                ) : <div></div>}

                {step < 4 ? (
                    <button
                        onClick={handleNext}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-blue-500/30 transition-all transform hover:-translate-y-0.5"
                    >
                        Next Step
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className={`bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-green-500/30 transition-all transform hover:-translate-y-0.5 flex items-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Creating...
                            </>
                        ) : 'Create Account'}
                    </button>
                )}
            </div>

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fadeInUp 0.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default SignupWizard;
