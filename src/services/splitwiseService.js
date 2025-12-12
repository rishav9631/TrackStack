import axios from 'axios';

const API_URL = (process.env.REACT_APP_BASE_URL || 'http://localhost:5000') + '/api/splitwise';
console.log('Splitwise Service API URL:', API_URL);

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            'x-auth-token': token
        }
    };
};

export const getAuthUrl = async () => {
    const response = await axios.get(`${API_URL}/auth-url`, getAuthHeaders());
    return response.data.url;
};

export const handleOAuthCallback = async (code) => {
    const response = await axios.post(`${API_URL}/oauth/callback`, { code }, getAuthHeaders());
    return response.data;
};

export const getExpenses = async (groupId) => {
    const config = getAuthHeaders();
    if (groupId) {
        config.params = { group_id: groupId };
    }
    const response = await axios.get(`${API_URL}/expenses`, config);
    return response.data;
};

export const getGroup = async (id) => {
    const response = await axios.get(`${API_URL}/group/${id}`, getAuthHeaders());
    return response.data;
};

export const getGroups = async () => {
    const response = await axios.get(`${API_URL}/groups`, getAuthHeaders());
    return response.data;
};

export const getFriends = async () => {
    const response = await axios.get(`${API_URL}/friends`, getAuthHeaders());
    return response.data;
};

export const getCurrentUser = async () => {
    const response = await axios.get(`${API_URL}/current_user`, getAuthHeaders());
    return response.data;
};

export const saveCredentials = async (credentials) => {
    const response = await axios.post(`${API_URL}/credentials`, credentials, getAuthHeaders());
    return response.data;
};
