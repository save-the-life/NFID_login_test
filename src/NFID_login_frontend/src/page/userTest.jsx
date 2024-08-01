import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';


const UserTest = () => {
    const navigate = useNavigate();
    const [authClient] = useState(null);
    const [principal, setPrincipal] = useState(null);
    const [expireTime, setExpireTime] = useState(null);
    
    
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

    // logout
    const logoutNFID = async () => {
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
          <button onClick={logoutNFID}>Logout</button>
        </div>
      ) : (
        <div>
          <p>No Principal...</p>
        </div>
      )}
      <div>
        <button onClick={handleBack}>
            get back
        </button>
      </div>
    </main>
  );
};

export default UserTest;