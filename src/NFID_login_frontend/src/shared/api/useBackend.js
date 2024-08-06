import { HttpAgent, Actor } from "@dfinity/agent";
import { idlFactory as backend_idlFactory, canisterId as backend_canisterId } from 'declarations/NFID_login_backend';

export const useBackend = () => {
  const fetchPrincipals = async () => {
    const agent = new HttpAgent();
    await agent.fetchRootKey();

    const backendActor = Actor.createActor(backend_idlFactory, {
      agent,
      canisterId: backend_canisterId,
    });

    return await backendActor.get_all_principals();
  };

  return { fetchPrincipals };
};
