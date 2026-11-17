import axios from "axios";
import React from "react";
import { useContext } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { AuthContext } from "../authContext";

const Login = () => {
  const navigate = useNavigate();
  const {user, userLogin,getProfile } = useContext(AuthContext);
   const [loading, setLoading] = useState(false);
  const [login, setLogin] = useState({
    email: "",
    password: "",
  });
  const handleChnage = (e) => {
    const { name, value } = e.target;

    setLogin((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogin = async () => {
    try {
      setLoading(true)
      const response = await userLogin(login.email,login.password)
      console.log("response", response);

      
        setLoading(false)
 
        if (response?.role === "user") {
          navigate("/userdashboard");
        } else if (response?.role === "doctor") {
          navigate("/doctordashboard");
        } else if(response?.role === "admin"){
          navigate("/admindashboard");
        }
     

             
      
    } catch (error) {
      setLoading(false)
    }
  };
  return (
    <div className="flex h-screen justify-center items-center">
      <div className="w-100 flex flex-col justify-center gap-3 border-2 p-7 rounded-xl">
        <div className="text-2xl font-bold text-center uppercase">SignIn</div>
        <div>
          <input
            type="text"
            name="email"
            value={login.email}
            placeholder="Email"
            className="outline-1 w-full p-2"
            onChange={handleChnage}
          />
        </div>

        <div>
          <input
            type="text"
            name="password"
            value={login.password}
            placeholder="Password"
            className="outline-1  w-full p-2"
            onChange={handleChnage}
          />
        </div>
        <p className="text-end ">ForgetPassword</p>
        <button
          className="w-full border-2 bg-blue-600 text-white rounded-md p-2"
          onClick={handleLogin}
        >
          Login
        </button>
        <p className="text-center">
          Create A New Account{" "}
          <span>
            <Link to="/signup" className="cursor-pointer underline">
              SignUp
            </Link>
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
