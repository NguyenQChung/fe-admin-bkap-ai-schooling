import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "";

// Tạo instance
const api = axios.create({
    baseURL: API_URL,
});

// Interceptor để tự động gắn token vào header
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor để xử lý lỗi 401
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem("token"); // clear token
            window.location.href = "/signin"; // redirect về login
        }
        return Promise.reject(error);
    }
);

export default api;
