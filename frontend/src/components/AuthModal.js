// src/components/AuthModal.js     
import { useState } from "react";
import { auth } from "../firebaseClient";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

export default function AuthModal({ onClose }) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handle = async (e) => {
    e.preventDefault();
    try {
      if (isSignup) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
      onClose();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="auth-modal">
      <div className="auth-card">
        <h3>{isSignup ? "Create Account" : "Welcome Back"}</h3>
        <form onSubmit={handle}>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit">{isSignup ? "Sign Up" : "Login"}</button>
        </form>
        <p onClick={() => setIsSignup(!isSignup)}>
          {isSignup ? "Have account? Login" : "No account? Sign up"}
        </p>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>
    </div>
  );
}