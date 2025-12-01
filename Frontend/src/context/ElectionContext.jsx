import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  fetchElections,
  fetchBallot,
  fetchResults,
  requestVotingToken,
  castBallot,
} from "../services/electionService";
import { fetchStudentTokens } from "../services/studentService";
import { useAuth } from "./AuthContext";

const ElectionContext = createContext();

export const ElectionProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [elections, setElections] = useState([]);
  const [activeElectionId, setActiveElectionId] = useState(null);
  const [ballot, setBallot] = useState([]);
  const [results, setResults] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Check if user can access ballot/results (admin or student)
  const canAccessBallotResults = isAuthenticated && user && (user.role === "admin" || user.role === "student");

  const loadElections = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchElections();
      setElections(data);
      setActiveElectionId((prev) => prev || data[0]?._id || null);
    } catch (error) {
      console.error("Failed to fetch elections", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadBallot = useCallback(async (id) => {
    if (!id || !canAccessBallotResults) return;
    try {
      const data = await fetchBallot(id);
      setBallot(data);
    } catch (error) {
      // Only log non-403 errors to avoid spam
      if (error.response?.status !== 403) {
        console.error("Failed to fetch ballot", error);
      }
    }
  }, [canAccessBallotResults]);

  const loadResults = useCallback(async (id) => {
    if (!id || !canAccessBallotResults) return;
    try {
      const data = await fetchResults(id);
      setResults(data);
    } catch (error) {
      // Only log non-403 errors to avoid spam
      if (error.response?.status !== 403) {
        console.error("Failed to fetch results", error);
      }
    }
  }, [canAccessBallotResults]);

  const loadTokens = useCallback(async () => {
    try {
      const data = await fetchStudentTokens();
      setTokens(data);
    } catch (error) {
      console.error("Failed to fetch tokens", error);
    }
  }, []);

  const refreshElectionData = useCallback(
    async (id) => {
      await Promise.all([loadBallot(id), loadResults(id)]);
    },
    [loadBallot, loadResults]
  );

  useEffect(() => {
    loadElections();
  }, [loadElections]);

  useEffect(() => {
    if (activeElectionId && canAccessBallotResults) {
      refreshElectionData(activeElectionId);
    }
  }, [activeElectionId, refreshElectionData, canAccessBallotResults]);

  const selectElection = useCallback((id) => {
    setActiveElectionId(id);
  }, []);

  const generateVotingToken = useCallback(
    async (id) => {
      const token = await requestVotingToken(id);
      await loadTokens();
      return token;
    },
    [loadTokens]
  );

  const submitBallot = useCallback(
    async (id, payload) => {
      const response = await castBallot(id, payload);
      await refreshElectionData(id);
      return response;
    },
    [refreshElectionData]
  );

  const value = {
    elections,
    activeElectionId,
    ballot,
    results,
    tokens,
    loading,
    selectElection,
    reloadElections: loadElections,
    loadTokens,
    generateVotingToken,
    submitBallot,
  };

  return (
    <ElectionContext.Provider value={value}>
      {children}
    </ElectionContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useElections = () => useContext(ElectionContext);

