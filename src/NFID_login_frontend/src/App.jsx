import { AuthClient } from "@dfinity/auth-client";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HttpAgent, Actor } from "@dfinity/agent";
import { idlFactory as backend_idlFactory, canisterId as backend_canisterId } from 'declarations/NFID_login_backend';




const App = () => {
  const [authClient, setAuthClient] = useState(null);
  const [principal, setPrincipal] = useState(null);
  const [sessionExpiry, setSessionExpiry] = useState(null);
  const navigate = useNavigate();
  
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

  // check session per 10 second
  useEffect(() => {
    if (sessionExpiry) {
      const timer = setInterval(() => {
        if (Date.now() >= sessionExpiry) { logoutNFID(); }
      }, 10000);

      return () => clearInterval(timer);
    }
  }, [sessionExpiry]);

  
  // Internet Identity login
  const loginII = async (event) =>{
    event.preventDefault();
    if (!authClient) return;

    await authClient.login({
      identityProvider: 'https://identity.ic0.app',
      onSuccess: async () => {
        const identity = authClient.getIdentity();
        const expiryTime = Date.now() + 1 * 60 * 10000;
        setPrincipal(identity.getPrincipal().toText());
        setSessionExpiry(expiryTime);
        localStorage.setItem('principal', identity.getPrincipal().toText());
        localStorage.setItem('expiresAt', expiryTime.toString());

        // Add user to backend
        await addUserToBackend(identity.getPrincipal());
      },
      onError: (err) => {
        console.error('Login failed:', err);
      }
    });
  }
  
  // NFID login
  const loginNFID = async (event) => {
    event.preventDefault();
    if (!authClient) return;

    // locally deployed canister's id
    const arrayOfYourBackendCanisters = [
      "cuj6u-c4aaa-aaaaa-qaajq-cai", 
      "cbopz-duaaa-aaaaa-qaaka-cai", 
      "ctiya-peaaa-aaaaa-qaaja-cai"
    ];

    authClient.login({
      identityProvider: 'https://nfid.one/authenticate',
      maxTimeToLive: BigInt(1 * 60 * 10000000000), // set the session for 1 min
      targets: arrayOfYourBackendCanisters,
      
      onSuccess: async () => {
        const identity = authClient.getIdentity();
        const expiryTime = Date.now() + 1 * 60 * 10000; // expire session after 1 min
        setPrincipal(identity.getPrincipal().toText());
        setSessionExpiry(expiryTime);
        localStorage.setItem('principal', identity.getPrincipal().toText());
        localStorage.setItem('expiresAt', expiryTime.toString());

        // Add user to backend
        await addUserToBackend(identity.getPrincipal());
      },
      onError: (err) => {
        console.error('Login failed:', err);
      }
    });
  };

  // Function to add user to backend
  const addUserToBackend = async (principal) => {
    const agent = new HttpAgent();
    // Fetch root key for certificate verification
    await agent.fetchRootKey();
    
    const backendActor = Actor.createActor(backend_idlFactory, {
      agent,
      canisterId: backend_canisterId,
    });

    await backendActor.add_user(principal);
  };


  // logout
  const logoutNFID = async () => {
    if (!authClient) return;

    await authClient.logout();
    setPrincipal(null);
    setSessionExpiry(null);
    localStorage.removeItem('principal');
    localStorage.removeItem('expiresAt');
  };

  return (
    <main>
      <img src="/logo2.svg" alt="DFINITY logo" />
      {principal ? (
        <div>
          <p>Logged in as: {principal}</p>
          <button onClick={logoutNFID}>Logout</button>
        </div>
      ) : (
        <div>
          <form onSubmit={loginII}>
            <button type="submit">Internet Identity LOGIN</button>
          </form>
          <form onSubmit={loginNFID}>
            <button type="submit">NFID LOGIN</button>
          </form>
        </div>
      )}
      <div>
        <button onClick={() => navigate('/userTest')}>
          testing page
        </button>
      </div>
    </main>
  );
};

export default App;
