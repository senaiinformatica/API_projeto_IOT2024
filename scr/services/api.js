import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

export const connectToBroker = async (data) => {
  return axios.post(`${API_URL}/connect`, data);
};
