import axios from "axios";
const token = localStorage.getItem("token");
const APIURL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

const getDocterList = async () => {
  try {
    const response = await axios.get(`${APIURL}/doctor/getDoctor`);
    return response.data;
  } catch (error) {
    console.log(error);
  }
};

const approvelStatus = async (id, status) => {
  try {
    const response = await axios.put(`${APIURL}/approvel/status/${id}`, {
      status: status,
    });
    return response.data;
  } catch (error) {
    console.log(error);
  }
};

const getDoctor = async () => {
  const response = await axios.get(`${APIURL}/doctor/getDoctorData`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

const updateDoctor = async (formdata) => {
  try {
    const response = await axios.post(`${APIURL}/doctor/updateDoctor`,formdata, {
      headers: {
        Authorization: `Bearer ${token}`, 
      },
    });
    return response.data;
  } catch (error) {
    console.log(error);
  }
};

const doctorAvailble = async()=>{
    try {
        const response = await axios.post(`${APIURL}/doctor/availability`,{
            headers: {
             Authorization: `Bearer ${token}`, 
            }
        })
        return response.data
    } catch (error) {
         console.log(error);
    }
}

const ApiServece = { getDocterList, approvelStatus, updateDoctor, getDoctor, doctorAvailble };

export default ApiServece;
