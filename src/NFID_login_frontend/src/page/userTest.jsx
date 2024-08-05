import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthClient } from "@dfinity/auth-client";
import { HttpAgent, Actor } from "@dfinity/agent";
import { idlFactory as backend_idlFactory, canisterId as backend_canisterId } from 'declarations/NFID_login_backend';



const UserTest = () => {
  const navigate = useNavigate();
  const [authClient, setAuthClient] = useState(null);
  const [principal, setPrincipal] = useState(null);
  const [expireTime, setExpireTime] = useState(null);
  const [, setSessionExpiry] = useState(null);
  const [principalList, setPrincipalList] = useState([]);

  // initialize AuthClient
  useEffect(() => {
    const initAuthClient = async () => {
      const client = await AuthClient.create();
      setAuthClient(client);

      const storedPrincipal = localStorage.getItem('principal');
      const storedExpiresAt = localStorage.getItem('expiresAt');
      if (storedPrincipal && storedExpiresAt) {
        setPrincipal(storedPrincipal);
        setSessionExpiry(parseInt(storedExpiresAt, 10));
      }
    };
    initAuthClient();
  }, []);
    
  
  //check session per 10 second
  useEffect(() => {
      if (expireTime) {
          const timer = setInterval(() => {
              if (Date.now() >= expireTime) { logoutNFID(); }
          }, 10000);

          return () => clearInterval(timer);
      }
  }, [expireTime]);

  // check principal, sesstion expire time
  useEffect(() => {
      const storedPrincipal = localStorage.getItem('principal');
      const exTime = localStorage.getItem('expiresAt');
      if (storedPrincipal && exTime) {
          setPrincipal(storedPrincipal);
          setExpireTime(parseInt(exTime, 10));
      }
  }, []);

  // fetch all principals from the backend
  useEffect(() => {
    const fetchPrincipals = async () => {
      const agent = new HttpAgent();
      // Fetch root key for certificate verification
      await agent.fetchRootKey();
      
      const backendActor = Actor.createActor(backend_idlFactory, {
        agent,
        canisterId: backend_canisterId,
      });

      const principals = await backendActor.get_all_principals();
      setPrincipalList(principals);
    };

    fetchPrincipals();
  }, []);

  // logout
  const logout = async () => {
      if (!authClient) return;
  
      await authClient.logout();
      setPrincipal(null);
      setExpireTime(null);
      localStorage.removeItem('principal');
      localStorage.removeItem('expiresAt');
  };

  const handleBack = () => {
      navigate('/');
  }

  return (
    <main>
      {principal ? (
        <div>
          <p>Logged in as: {principal}</p>
          <p>Session time expires at: {new Date(expireTime).toLocaleString()}</p>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <div>
          <p>No Principal...</p>
        </div>
      )}
      {/* list of stored prinicpals */}
      <div>
        <h3>Stored Principals:</h3>
        <ul>
          {principalList.map((p, index) => (
            <li key={index}>{p.toText()}</li>
          ))}
        </ul>
      </div>
      <div>
        <button onClick={handleBack}>
            get back
        </button>
      </div>
    </main>
  );
};

export default UserTest;