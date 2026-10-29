import axios from './axios';

export const getCommentsByPost = async (postId) => {
  const response = await axios.get(`/comments/post/${postId}`);
  return response.data;
};

export const createComment = async (formData) => {
  const response = await axios.post('/comments', formData);
  return response.data;
};

export const deleteComment = async (data) => {
  const response = await axios.delete('/comments', { data });
  return response.data;
};
