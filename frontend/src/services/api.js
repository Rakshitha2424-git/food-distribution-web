
import axios from "axios";

const BASE_URL = "http://127.0.0.1:8001/api/";

const api = axios.create({
    baseURL: BASE_URL
});

// Attach the current access token to every request
api.interceptors.request.use((config) => {
    const token = sessionStorage.getItem("access_token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// Prevent multiple requests from refreshing simultaneously
let refreshPromise = null;

// Handle expired access tokens
api.interceptors.response.use(
    (response) => response,

    async (error) => {
        const originalRequest = error.config;

        if (
            error.response?.status === 401 &&
            originalRequest &&
            !originalRequest._retry &&
            !originalRequest.url?.includes("token/refresh/")
        ) {
            originalRequest._retry = true;

            const refreshToken = sessionStorage.getItem("refresh_token");

            if (!refreshToken) {
                sessionStorage.removeItem("access_token");
                sessionStorage.removeItem("refresh_token");
                window.location.reload();
                return Promise.reject(error);
            }

            try {
                // Reuse an ongoing refresh request if one exists
                if (!refreshPromise) {
                    refreshPromise = axios.post(
                        `${BASE_URL}auth/token/refresh/`,
                        {
                            refresh: refreshToken
                        }
                    ).then((response) => {
                        const newAccessToken = response.data.access;

                        sessionStorage.setItem(
                            "access_token",
                            newAccessToken
                        );

                        // Save a rotated refresh token if provided
                        if (response.data.refresh) {
                            sessionStorage.setItem(
                                "refresh_token",
                                response.data.refresh
                            );
                        }

                        return newAccessToken;
                    }).finally(() => {
                        refreshPromise = null;
                    });
                }

                const newAccessToken = await refreshPromise;

                originalRequest.headers =
                    originalRequest.headers || {};

                originalRequest.headers.Authorization =
                    `Bearer ${newAccessToken}`;

                // Retry the original failed request
                return api(originalRequest);

            } catch (refreshError) {
                sessionStorage.removeItem("access_token");
                sessionStorage.removeItem("refresh_token");

                // Reload so the application can return to login
                window.location.reload();

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
