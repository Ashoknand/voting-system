import apiClient from "./api";

export const fetchStudents = async (params = {}) => {
  const res = await apiClient.get("/students", { params });
  return res.data;
};

export const fetchStudent = async (id) => {
  const res = await apiClient.get(`/students/${id}`);
  return res.data;
};

export const updateStudent = async (id, payload) => {
  const res = await apiClient.put(`/students/${id}`, payload);
  return res.data;
};

export const deleteStudent = async (id) => {
  const res = await apiClient.delete(`/students/${id}`);
  return res.data;
};

export const blockStudent = async (id) => {
  const res = await apiClient.patch(`/students/${id}/block`);
  return res.data;
};

export const unblockStudent = async (id) => {
  const res = await apiClient.patch(`/students/${id}/unblock`);
  return res.data;
};

export const fetchStudentTokens = async () => {
  const res = await apiClient.get("/students/me/tokens");
  return res.data;
};

export const issueStudentVotingToken = async (studentId, electionId) => {
  const res = await apiClient.post(`/admin/students/${studentId}/token`, {
    electionId,
  });
  return res.data;
};

