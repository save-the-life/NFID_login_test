import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../features/Auth/model/useAuth';
import { useBackend } from '../../../shared/api/useBackend';

const UserTestPage = () => {
  const navigate = useNavigate();
  const { principal, sessionExpiry, logout } = useAuth();
  const { fetchPrincipals } = useBackend();
  const [principalList, setPrincipalList] = useState([]);

  useEffect(() => {
    const getPrincipals = async () => {
      const principals = await fetchPrincipals();
      setPrincipalList(principals);
    };
    getPrincipals();
  }, [fetchPrincipals]);

  return (
    <main>
      {principal ? (
        <div>
          <p>Logged in as: {principal}</p>
          <p>Session time expires at: {new Date(sessionExpiry).toLocaleString()}</p>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <div>
          <p>No Principal...</p>
        </div>
      )}
      <div>
        <h3>Stored Principals:</h3>
        <ul>
          {principalList.map((p, index) => (
            <li key={index}>{p.toText()}</li>
          ))}
        </ul>
      </div>
      <div>
        <button onClick={() => navigate('/')}>
          Go back
        </button>
      </div>
    </main>
  );
};

export default UserTestPage;
