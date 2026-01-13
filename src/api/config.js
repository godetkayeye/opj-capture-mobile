export const API_BASE_URL = 'http://72.61.97.77:8000';

export const getApiUrl = (path) => {
  return `${API_BASE_URL}${path}`;
};
