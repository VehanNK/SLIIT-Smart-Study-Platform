import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';

const FACULTY_DATA = {
  COMPUTING: {
    label: 'Faculty of Computing',
    prefix: 'IT',
    prefixHint: 'IT',
    programs: [
      { code: 'IT', name: 'Information Technology' },
      { code: 'SE', name: 'Software Engineering' },
      { code: 'CS', name: 'Computer Science' },
      { code: 'DS', name: 'Data Science' },
      { code: 'ISE', name: 'Information Systems Engineering' },
      { code: 'CSNE', name: 'Computer Systems and Network Engineering' },
    ],
  },
  ENGINEERING: {
    label: 'Faculty of Engineering',
    prefix: 'EN',
    prefixHint: 'EN',
    programs: [
      { code: 'CE', name: 'Civil Engineering' },
      { code: 'EE', name: 'Electrical and Electronic Engineering' },
      { code: 'ME', name: 'Mechanical Engineering' },
      { code: 'CHE', name: 'Chemical and Process Engineering' },
      { code: 'MTE', name: 'Materials and Textile Engineering' },
    ],
  },
  BUSINESS: {
    label: 'Faculty of Business',
    prefix: 'BS',
    prefixHint: 'BS',
    programs: [
      { code: 'BA', name: 'Business Administration' },
      { code: 'FM', name: 'Financial Management' },
      { code: 'HRM', name: 'Human Resource Management' },
      { code: 'MKT', name: 'Marketing Management' },
      { code: 'SCM', name: 'Supply Chain Management' },
    ],
  },
};

export function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    faculty: '',
    studentId: '',
    email: '',
    academicYear: '',
    semester: '',
    program: '',
    studyStyle: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Auto-generate email whenever studentId changes
  useEffect(() => {
    if (form.studentId && /^(IT|EN|BS)\d{8}$/i.test(form.studentId)) {
      setForm(f => ({ ...f, email: form.studentId.toLowerCase() + '@my.sliit.lk' }));
    } else if (form.studentId === '') {
      setForm(f => ({ ...f, email: '' }));
    }
  }, [form.studentId]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // When faculty changes, reset prefix-dependent fields
    if (name === 'faculty') {
      const prefix = FACULTY_DATA[value]?.prefix || '';
      setForm(f => ({
        ...f,
        faculty: value,
        studentId: prefix,    // pre-fill prefix so user sees it
        email: '',
        program: '',
      }));
      return;
    }

    // For studentId: enforce uppercase and lock the prefix
    if (name === 'studentId') {
      const prefix = FACULTY_DATA[form.faculty]?.prefix || '';
      let upper = value.toUpperCase();
      // Prevent user from deleting the prefix
      if (!upper.startsWith(prefix)) {
        upper = prefix + upper.replace(/^(IT|EN|BS)/i, '');
      }
      // Only allow digits after the prefix, max 10 total chars (2 prefix + 8 digits)
      const digits = upper.slice(prefix.length).replace(/\D/g, '').slice(0, 8);
      setForm(f => ({ ...f, studentId: prefix + digits }));
      return;
    }

    setForm(f => ({ ...f, [name]: value }));
  };

  const validateStep1 = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Full name is required';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs = {};
    if (!form.faculty) errs.faculty = 'Please select your faculty';

    if (!form.studentId || form.studentId.length < 10) {
      errs.studentId = 'Student ID must be 10 characters (prefix + 8 digits)';
    } else if (!/^(IT|EN|BS)\d{8}$/.test(form.studentId)) {
      errs.studentId = 'Invalid format. Example: IT23561298';
    } else {
      const expectedPrefix = FACULTY_DATA[form.faculty]?.prefix;
      if (expectedPrefix && !form.studentId.startsWith(expectedPrefix)) {
        errs.studentId = `Students from ${FACULTY_DATA[form.faculty]?.label} must use the '${expectedPrefix}' prefix`;
      }
    }

    if (!form.academicYear) errs.academicYear = 'Please select your academic year';
    if (!form.semester) errs.semester = 'Please select your semester';
    if (!form.program) errs.program = 'Please select your program';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
    setErrors({});
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setLoading(true);
    setErrors({});

    try {
      await api.post('/auth/register', {
        name: form.name.trim(),
        studentId: form.studentId,
        email: form.email,
        faculty: form.faculty,
        program: form.program,
        academicYear: parseInt(form.academicYear),
        semester: parseInt(form.semester),
        studyStyle: form.studyStyle || null,
        password: form.password,
      });

      // Auto-login after register
      const loginRes = await api.post('/auth/login', {
        studentId: form.studentId,
        password: form.password,
      });
      localStorage.setItem('token', loginRes.data.token);
      window.location.href = '/dashboard';
    } catch (err) {
      setErrors({ api: err.response?.data?.error || err.response?.data?.message || 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) =>
    `w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors ${errors[field] ? 'border-red-400 bg-red-50 focus:ring-red-300' : 'border-slate-300 bg-white'
    }`;

  const selectedFaculty = FACULTY_DATA[form.faculty];
  const availablePrograms = selectedFaculty?.programs || [];

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-sliit-blue items-center justify-center p-12 flex-col gap-8">
        <div className="text-center">
          <div className="w-20 h-20 bg-sliit-gold rounded-2xl flex items-center justify-center mx-auto mb-6">
            <GraduationCap className="w-12 h-12 text-sliit-blue" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            Join SLIIT<br />Study Partner
          </h1>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-start justify-center p-6 bg-slate-50 overflow-y-auto">
        <div className="w-full max-w-lg py-8">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-6">
            <div className="w-14 h-14 bg-sliit-blue rounded-2xl flex items-center justify-center mx-auto mb-3">
              <GraduationCap className="w-8 h-8 text-sliit-gold" />
            </div>
            <h1 className="text-xl font-bold text-slate-800">SLIIT Study Partner</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 elevated-card">
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-2xl font-bold text-slate-800">Create Account</h2>
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                Step {step} of 2
              </span>
            </div>
            <p className="text-slate-500 mb-6 text-sm">Register with your SLIIT details</p>

            <form onSubmit={handleRegister} className="space-y-4">

              {/* Step 1: Account Details */}
              {step === 1 && (
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      className={inputClass('name')}
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        className={`${inputClass('password')} pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 smooth-transition"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password *</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      placeholder="Re-enter password"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      className={inputClass('confirmPassword')}
                    />
                    {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                  </div>

                  <button
                    type="button"
                    onClick={handleNext}
                    className="w-full py-2.5 bg-sliit-blue text-white font-medium rounded-lg hover:bg-blue-900 transition-colors mt-6 smooth-transition"
                  >
                    Next Step
                  </button>
                </div>
              )}

              {/* Step 2: Academic Profile */}
              {step === 2 && (
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Faculty *</label>
                    <select
                      name="faculty"
                      value={form.faculty}
                      onChange={handleChange}
                      className={inputClass('faculty')}
                    >
                      <option value="">Select your faculty</option>
                      {Object.entries(FACULTY_DATA).map(([key, f]) => (
                        <option key={key} value={key}>{f.label}</option>
                      ))}
                    </select>
                    {form.faculty && (
                      <p className="text-blue-600 text-xs mt-1 font-medium">
                        ✓ Your Student ID must start with <strong>{selectedFaculty.prefix}</strong>
                      </p>
                    )}
                    {errors.faculty && <p className="text-red-500 text-xs mt-1">{errors.faculty}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Student ID *</label>
                    <input
                      type="text"
                      name="studentId"
                      placeholder={form.faculty ? `${selectedFaculty?.prefix}YYNNNNNN` : 'Select faculty first'}
                      value={form.studentId}
                      onChange={handleChange}
                      disabled={!form.faculty}
                      maxLength={10}
                      className={`${inputClass('studentId')} font-mono tracking-wider ${!form.faculty ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                    <p className="text-slate-400 text-xs mt-1">
                      {form.studentId.length}/10 characters
                      {form.faculty && ` · Prefix locked to ${selectedFaculty?.prefix}`}
                    </p>
                    {errors.studentId && <p className="text-red-500 text-xs mt-1">{errors.studentId}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      readOnly
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500 cursor-default"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Academic Year *</label>
                      <select
                        name="academicYear"
                        value={form.academicYear}
                        onChange={handleChange}
                        className={inputClass('academicYear')}
                      >
                        <option value="">Year</option>
                        <option value="1">Year 1</option>
                        <option value="2">Year 2</option>
                        <option value="3">Year 3</option>
                        <option value="4">Year 4</option>
                      </select>
                      {errors.academicYear && <p className="text-red-500 text-xs mt-1">{errors.academicYear}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Semester *</label>
                      <select
                        name="semester"
                        value={form.semester}
                        onChange={handleChange}
                        className={inputClass('semester')}
                      >
                        <option value="">Semester</option>
                        <option value="1">Semester 1</option>
                        <option value="2">Semester 2</option>
                      </select>
                      {errors.semester && <p className="text-red-500 text-xs mt-1">{errors.semester}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Program *</label>
                    <select
                      name="program"
                      value={form.program}
                      onChange={handleChange}
                      disabled={!form.faculty}
                      className={`${inputClass('program')} ${!form.faculty ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <option value="">{form.faculty ? 'Select your program' : 'Select faculty first'}</option>
                      {availablePrograms.map(p => (
                        <option key={p.code} value={p.code}>{p.name} ({p.code})</option>
                      ))}
                    </select>
                    {errors.program && <p className="text-red-500 text-xs mt-1">{errors.program}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Study Style <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <select
                      name="studyStyle"
                      value={form.studyStyle}
                      onChange={handleChange}
                      className={inputClass('studyStyle')}
                    >
                      <option value="">Select your study style</option>
                      <option value="visual">Visual – Learn best with diagrams & charts</option>
                      <option value="auditory">Auditory – Learn best by listening & discussion</option>
                      <option value="kinesthetic">Kinesthetic – Learn best by doing & practice</option>
                    </select>
                  </div>

                  {errors.api && (
                    <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-100">
                      {errors.api}
                    </div>
                  )}

                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-medium rounded-lg hover:bg-slate-200 smooth-transition"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-[2] py-2.5 bg-sliit-blue text-white font-medium rounded-lg hover:bg-blue-900 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 smooth-transition"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating...
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>

            <p className="text-center text-sm text-slate-500 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 font-medium hover:underline">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
