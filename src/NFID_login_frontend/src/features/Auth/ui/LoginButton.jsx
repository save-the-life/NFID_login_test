import React from 'react';
import { useAuth } from '../model/useAuth';

const LoginButton = () => {
  const { loginII, loginNFID } = useAuth();
  

  return (
    <div>
        <form onSubmit={loginII}>
            <button type="submit">Internet Identity LOGIN</button>
        </form>

        <form onSubmit={loginNFID}>
            <button type="submit">NFID LOGIN</button>
        </form>
    </div>
  );
};

export default LoginButton;
