import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isRegister) {
        await axios.post('http://localhost:8080/api/auth/register', { studentId, password });
        alert('Registration successful! Please login.');
        setIsRegister(false);
      } else {
        const res = await axios.post('http://localhost:8080/api/auth/login', { studentId, password });
        localStorage.setItem('token', res.data.token);
        navigate('/dashboard');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>{isRegister ? 'Register' : 'Login'} with SLIIT Student ID</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Student ID (e.g., ST/2022/1234)" value={studentId} onChange={e => setStudentId(e.target.value)} required /><br/>
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required /><br/>
        <button type="submit">{isRegister ? 'Register' : 'Login'}</button>
      </form>
      <button onClick={() => setIsRegister(!isRegister)}>
        {isRegister ? 'Back to Login' : 'Create new account'}
      </button>
    </div>
  );
}

export default Login;