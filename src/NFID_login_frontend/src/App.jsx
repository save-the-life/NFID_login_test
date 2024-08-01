import { AuthClient } from "@dfinity/auth-client";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const App = () => {
  const [authClient, setAuthClient] = useState(null);
  const [principal, setPrincipal] = useState(null);
  const [sessionExpiry, setSessionExpiry] = useState(null);
  const [email, setEmail] = useState(null);
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
      
      onSuccess: () => {
        const identity = authClient.getIdentity();
        const expiryTime = Date.now() + 1 * 60 * 10000; // expire session after 1 min
        setPrincipal(identity.getPrincipal().toText());
        setSessionExpiry(expiryTime);
        console.log(expiryTime);
        console.log(expiryTime.toString());
        localStorage.setItem('principal', identity.getPrincipal().toText());
        localStorage.setItem('expiresAt', expiryTime.toString());

        const email = identity.getEmail();
        setEmail(email);
        localStorage.setItem('email', email);
        console.error('user email :', email);
      },
      onError: (err) => {
        console.error('Login failed:', err);
      }
    });
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
        <form onSubmit={loginNFID}>
          <button type="submit">NFID LOGIN</button>
        </form>
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
