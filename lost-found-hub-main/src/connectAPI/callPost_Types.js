import axios from './axios';

export const getPostTypes = async () => {
  try {
    const response = await axios.get('/post_types');

    return response.data;

  } catch (error) {
    console.error('GET POST TYPES ERROR:', error);
    throw error;
  }
};