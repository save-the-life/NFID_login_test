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


      // get principal and sessionExpiration from local storage
      const storedPrincipal = localStorage.getItem('principal');
      const storedExpiresAt = localStorage.getItem('expiresAt');

      // if both of them are not empty, set the values on the principal and sessionExpiry
      if (storedPrincipal && storedExpiresAt) {
        setPrincipal(storedPrincipal);
        setSessionExpiry(parseInt(storedExpiresAt, 10));
      }
    };

    // 
    initAuthClient();
  }, []);

  //check session every 10 seconds
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
    // prevent refresh the page till the form is submitted
    event.preventDefault();

    // if authClient is not exist, do nothing
    if (!authClient) return;

    // use the 'await' wait asynchronous operation to complete
    await authClient.login({
      identityProvider: 'https://identity.ic0.app',
      onSuccess: async () => {
        // get the identity from the authClient
        const identity = authClient.getIdentity();
        // set the session expiration time to 10 min
        const expiryTime = Date.now() + 1 * 60 * 10000;
        // get the user's principal from the identity and set it to string value
        setPrincipal(identity.getPrincipal().toText());
        setSessionExpiry(expiryTime);
        // store the principal and expiration time at the local storage
        localStorage.setItem('principal', identity.getPrincipal().toText());
        localStorage.setItem('expiresAt', expiryTime.toString());

        // add the user's principal to backend canister
        await addUserToBackend(identity.getPrincipal());
      },
      onError: (err) => {
        console.error('Login failed:', err);
      }
    });
  };

  // NFID login
  const loginNFID = async (event) => {
    // prevent refresh the page till the form is submitted
    event.preventDefault();

    // if authClient is not exist, do nothing
    if (!authClient) return;

    // define a list of canister IDs at the backend for 
    const arrayOfYourBackendCanisters = [
      "cuj6u-c4aaa-aaaaa-qaajq-cai", 
      "cbopz-duaaa-aaaaa-qaaka-cai", 
      "ctiya-peaaa-aaaaa-qaaja-cai"
    ];

    // use the 'await' wait asynchronous operation to complete
    await authClient.login({
      identityProvider: 'https://nfid.one/authenticate',
      // set the maximum lifetime of the session to 10 min
      maxTimeToLive: BigInt(1 * 60 * 100000000000),
      // set a list of IDs of backend canisters that users can access when they login
      targets: arrayOfYourBackendCanisters,
      
      onSuccess: async () => {
        // get the identity from the authClient
        const identity = authClient.getIdentity();
        // set the session expiration time to 10 min
        const expiryTime = Date.now() + 1 * 60 * 10000;
        // get the user's principal from the identity and set it to string value
        setPrincipal(identity.getPrincipal().toText());
        setSessionExpiry(expiryTime);
        // store the principal and expiration time at the local storage
        localStorage.setItem('principal', identity.getPrincipal().toText());
        localStorage.setItem('expiresAt', expiryTime.toString());

        // add the user's principal to backend canister
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
    // get the root key to verify the certification only in the local environment
    await agent.fetchRootKey();
    
    // create the Actor to interact with backend canister
    const backendActor = Actor.createActor(backend_idlFactory, {
      agent,
      canisterId: backend_canisterId,
    });

    // call the 'add_user' method to store user's principal at backend canister
    await backendActor.add_user(principal);
  };

  // logout
  const logout = async () => {
    // if authClient is not exist, do nothing
    if (!authClient) return;

    // excute logout from authClient
    await authClient.logout();

    // after logout, set principal and expiration time null
    setPrincipal(null);
    setSessionExpiry(null);

    // after logout, remove principal and expiration time from local storage
    localStorage.removeItem('principal');
    localStorage.removeItem('expiresAt');
  };

  return { principal, sessionExpiry, loginII, loginNFID, logout };
};
