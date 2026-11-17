import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import axios from "axios";
const SignUp = () => {
  const navigate = useNavigate();
  const [signUp, setSignUp] = useState({
    userName: "",
    email: "",
    password: "",
    phone: "",
    role: "",
  });
  const [certificates, setCertificates] = useState([]);
  const handleChnage = (e) => {
    const { name, value } = e.target;

    setSignUp((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleCertificates = (e) => {
    setCertificates(Array.from(e.target.files));
  };
  console.log("certificates", certificates);

  console.log("handleChnage", signUp);

  const hadleClick = async () => {
    try {
      const formData = new FormData();
      Object.entries(signUp).forEach(([key, value]) => {
        formData.append(key, value);
      });

      certificates.forEach((file) => {
        formData.append("certificates", file);
      });

      const response = await axios.post(
        "http://localhost:3000/api/v1/user/signup",
        formData,
      );

      if (response.data.response_code === 200) {
        navigate("/");
      }
    } catch (error) {

      console.log(error)
    }
  };

  return (
    <div className="flex h-screen justify-center items-center">
      <div className="w-100 flex flex-col justify-center gap-3 border-2 p-7 rounded-xl">
        <div className="text-2xl font-bold text-center uppercase">SignUp</div>
        <div>
          <input
            type="text"
            placeholder="Username"
            className="outline-1 w-full p-2"
            value={signUp.userName}
            name="userName"
            onChange={handleChnage}
          />
        </div>

        <div>
          <input
            type="text"
            placeholder="Email"
            className="outline-1  w-full p-2"
            value={signUp.email}
            name="email"
            onChange={handleChnage}
          />
        </div>
        <div>
          <input
            type="text"
            placeholder="Password"
            className="outline-1  w-full p-2"
            value={signUp.password}
            name="password"
            onChange={handleChnage}
          />
        </div>

        <div>
          <input
            type="text"
            placeholder="Phone"
            className="outline-1  w-full p-2"
            value={signUp.phone}
            name="phone"
            onChange={handleChnage}
          />
        </div>

        <div>
          <select
            name="role"
            id="user"
            value={signUp.role}
            onChange={handleChnage}
            className="outline-1  w-full p-2"
          >
            <option value="">Select Role</option>
            <option value="user">User</option>
            <option value="doctor">Doctor</option>
          </select>
        </div>

        {signUp.role === "doctor" && (
          <div>
            <input
              type="file"
              className="outline-1  w-full p-2"
              onChange={handleCertificates}
            />
          </div>
        )}
        <p className="text-end ">ForgetPassword</p>
        <button
          className="w-full border-2 bg-blue-600 text-white rounded-md p-2"
          onClick={hadleClick}
        >
          SignUp
        </button>
        <p className="text-center">
          Already have an Account{" "}
          <span>
            <Link to="/login" className="cursor-pointer underline">
              Login
            </Link>
          </span>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
