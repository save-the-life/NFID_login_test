// src/features/Auth/model/useAuth.js
import { useState, useEffect } from 'react';
import { AuthClient } from "@dfinity/auth-client";
import { HttpAgent, Actor } from "@dfinity/agent";
import { idlFactory as backend_idlFactory, canisterId as backend_canisterId } from 'declarations/NFID_login_backend';

export const useAuth = () => {
  const [authClient, setAuthClient] = useState(null);
  const [principal, setPrincipal] = useState(null);
  const [sessionExpiry, setSessionExpiry] = useState(null);

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
    if (sessionExpiry) {
      const timer = setInterval(() => {
        if (Date.now() >= sessionExpiry) {
          logout();
        }
      }, 10000);

      return () => clearInterval(timer);
    }
  }, [sessionExpiry]);

  // Internet Identity login
  const loginII = async (event) => {
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

        await addUserToBackend(identity.getPrincipal());
      },
      onError: (err) => {
        console.error('Login failed:', err);
      }
    });
  };

  // NFID login
  const loginNFID = async (event) => {
    event.preventDefault();
    if (!authClient) return;

    const arrayOfYourBackendCanisters = [
      "cuj6u-c4aaa-aaaaa-qaajq-cai", 
      "cbopz-duaaa-aaaaa-qaaka-cai", 
      "ctiya-peaaa-aaaaa-qaaja-cai"
    ];

    authClient.login({
      identityProvider: 'https://nfid.one/authenticate',
      maxTimeToLive: BigInt(1 * 60 * 10000000000),
      targets: arrayOfYourBackendCanisters,
      
      onSuccess: async () => {
        const identity = authClient.getIdentity();
        const expiryTime = Date.now() + 1 * 60 * 10000;
        setPrincipal(identity.getPrincipal().toText());
        setSessionExpiry(expiryTime);
        localStorage.setItem('principal', identity.getPrincipal().toText());
        localStorage.setItem('expiresAt', expiryTime.toString());

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
    await agent.fetchRootKey();
    
    const backendActor = Actor.createActor(backend_idlFactory, {
      agent,
      canisterId: backend_canisterId,
    });

    await backendActor.add_user(principal);
  };

  // logout
  const logout = async () => {
    if (!authClient) return;

    await authClient.logout();
    setPrincipal(null);
    setSessionExpiry(null);
    localStorage.removeItem('principal');
    localStorage.removeItem('expiresAt');
  };

  return { principal, sessionExpiry, loginII, loginNFID, logout };
};
