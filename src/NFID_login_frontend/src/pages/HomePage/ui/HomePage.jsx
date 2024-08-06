import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginButton from '../../../features/Auth/ui/LoginButton';
import LogoutButton from '../../../features/Auth/ui/LogoutButton';
import { useAuth } from '../../../features/Auth/model/useAuth';


const HomePage = () => {
  const navigate = useNavigate();
  const { principal, logout } = useAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!principal);
  }, [principal]);

  return (
    <div>
      <h1>Home Page</h1>
      {isLoggedIn  ? (
        <div>
          <p>Logged in as: {principal}</p>
          <LogoutButton onClick={logout} />
        </div>
      ) : (
        <div>
          <LoginButton />
        </div>
      )}
      <div>
        <button onClick={() => navigate('/userTest')}>
          Go to User Test Page
        </button>
      </div>
    </div>
  );
};

export default HomePage;
