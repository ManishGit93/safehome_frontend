// Local development: export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL ?? "http://localhost:5000";
export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL ?? "https://safehome-backend-cyky.onrender.com";
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_IO_URL ?? BACKEND_URL;
export const MAP_LIBRARY = process.env.NEXT_PUBLIC_MAP_LIBRARY ?? "maplibre";
export const CSRF_HEADER = "x-csrf-token";
export const CSRF_COOKIE = "safehome_csrf";


