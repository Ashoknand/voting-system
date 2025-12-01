import apiClient from "./api";

export const fetchElections = async (params = {}) => {
  const res = await apiClient.get("/elections", { params });
  return res.data;
};

export const fetchElection = async (id) => {
  const res = await apiClient.get(`/elections/${id}`);
  return res.data;
};

export const fetchElectionPosts = async (id) => {
  const res = await apiClient.get(`/elections/${id}/posts`);
  return res.data;
};

export const fetchBallot = async (id) => {
  const res = await apiClient.get(`/elections/${id}/ballot`);
  return res.data;
};

export const fetchResults = async (id) => {
  const res = await apiClient.get(`/elections/${id}/results`);
  return res.data;
};

export const requestVotingToken = async (electionId) => {
  const res = await apiClient.post(`/elections/${electionId}/token`, {
    electionId,
  });
  return res.data;
};

export const castBallot = async (electionId, payload) => {
  const res = await apiClient.post(`/elections/${electionId}/cast`, payload);
  return res.data;
};

export const validateToken = async (token) => {
  const res = await apiClient.get(`/elections/tokens/${token}`);
  return res.data;
};

