import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useElections } from "../context/ElectionContext";
import { getImageUrl } from "../utils/imageUrl";

const Ballot = () => {
  const { user, isAuthenticated } = useAuth();
  const {
    elections,
    activeElectionId,
    selectElection,
    ballot,
    tokens,
    loadTokens,
    submitBallot,
    results,
  } = useElections();

  const [selections, setSelections] = useState({});
  const [votingToken, setVotingToken] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const canVote = user?.role === "student";
  const showBallotForm = user?.role === "student" || user?.role === "admin";

  useEffect(() => {
    if (user?.role === "student") {
      loadTokens();
    }
  }, [user, loadTokens]);

  useEffect(() => {
    setSelections({});
  }, [activeElectionId, ballot]);

  const handleSelect = (postId, candidateId) => {
    if (!canVote) return;
    setSelections((prev) => ({ ...prev, [postId]: candidateId }));
  };

  const handleCopyToken = () => {
    if (!votingToken) return;
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(votingToken).catch(() => {});
    }
  };

  const selectablePosts = useMemo(
    () => ballot.filter((post) => post.candidates.length > 0),
    [ballot]
  );
  const hasSelectablePosts = selectablePosts.length > 0;
  const activeTokenRecord = useMemo(() => {
    if (!activeElectionId) return null;
    return tokens.find((token) => token.election?._id === activeElectionId);
  }, [tokens, activeElectionId]);
  const tokenIsUsed = !!activeTokenRecord?.isUsed;

  useEffect(() => {
    if (activeTokenRecord?.token) {
      setVotingToken(activeTokenRecord.token);
    } else {
      setVotingToken("");
    }
  }, [activeTokenRecord]);

  const allPostsSelected = useMemo(() => {
    if (!hasSelectablePosts) return false;
    return selectablePosts.every((post) => selections[post._id]);
  }, [selectablePosts, selections, hasSelectablePosts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated || user.role !== "student") {
      setMessage("Only registered students can cast ballots.");
      return;
    }
    if (!votingToken) {
      setMessage("You need a valid voting ID.");
      return;
    }
    if (tokenIsUsed) {
      setMessage("Your voting ID has already been used for this election.");
      return;
    }
    if (!hasSelectablePosts) {
      setMessage("No candidates are available to vote for in this election yet.");
      return;
    }
    if (!allPostsSelected) {
      setMessage("Select a candidate for each post.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      // Ensure token is a string and trim whitespace
      const normalizedToken = String(votingToken || "").trim();
      
      if (!normalizedToken) {
        setMessage("Voting ID is required. Please ensure you have a valid voting ID.");
        setLoading(false);
        return;
      }

      const payload = {
        electionId: activeElectionId,
        token: normalizedToken,
        selections: Object.entries(selections).map(([postId, candidateId]) => ({
          postId,
          candidateId,
        })),
      };

      console.log("Submitting ballot:", {
        electionId: activeElectionId,
        token: normalizedToken,
        tokenLength: normalizedToken.length,
        selectionsCount: payload.selections.length,
      });

      const response = await submitBallot(activeElectionId, payload);
      setMessage(response.message || "Vote submitted.");
    } catch (error) {
      console.error("Ballot submission error:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to submit ballot";
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const hasBallot = Array.isArray(ballot) && ballot.length > 0;

  return (
    <section className="page">
      <div className="page__header">
        <h2>Cast Your Vote</h2>
        <div className="select-group">
          <label htmlFor="election">Election</label>
          <select
            id="election"
            value={activeElectionId || ""}
            onChange={(e) => selectElection(e.target.value)}
          >
            <option value="">Select election</option>
            {elections.map((election) => (
              <option key={election._id} value={election._id}>
                {election.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {canVote && (
        <div className="token-panel card">
          <p>
            A voting ID has been generated for every election you can join. Select an election to auto-fill your ID.
          </p>
          {activeTokenRecord ? (
            <>
              <p className="small">
                Election: {activeTokenRecord.election?.name || "Selected Election"}
              </p>
              <div className="token-display">
                <input
                  value={votingToken}
                  readOnly
                  placeholder="Voting ID not available"
                />
                <button
                  type="button"
                  className="btn small"
                  onClick={handleCopyToken}
                  disabled={!votingToken}
                >
                  Copy
                </button>
              </div>
              {tokenIsUsed && (
                <p className="small error">
                  This voting ID has already been used for this election.
                </p>
              )}
            </>
          ) : (
            <p className="small">
              No voting ID is available for the selected election. Please contact admin.
            </p>
          )}
          {tokens.length > 0 && (
            <ul className="token-list">
              {tokens.map((token) => (
                <li
                  key={token._id}
                  className={`${token.election?._id === activeElectionId ? "active" : ""} ${
                    token.isUsed ? "used" : ""
                  }`}
                >
                  {token.election?.name || "Election"} — {token.token} (
                  {token.isUsed ? "Used" : "Unused"})
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!showBallotForm && (
        <div className="card">
          <p>Candidates can view live results below but cannot access the voting form.</p>
        </div>
      )}

      {showBallotForm && (
        <form className="ballot-grid" onSubmit={handleSubmit}>
          {!hasBallot && <p>No posts available for this election yet.</p>}
          {ballot?.map((post) => (
          <article key={post._id} className="card ballot-card">
            <header>
              <h3>{post.name}</h3>
              <p>{post.description}</p>
            </header>
            <div className="ballot-card__body">
              {post.candidates.length === 0 && (
                <p className="small muted">No approved candidates assigned.</p>
              )}
              {post.candidates.map((candidate) => (
                <label
                  key={candidate.id}
                  className={`candidate-option ${
                    selections[post._id] === candidate.id ? "selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name={post._id}
                    value={candidate.id}
                      onChange={() => handleSelect(post._id, candidate.id)}
                      disabled={!canVote}
                  />
                  {candidate.photoUrl && (
                    <img
                      src={getImageUrl(candidate.photoUrl)}
                      alt={candidate.name}
                      style={{
                        width: "54px",
                        height: "54px",
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  )}
                  <div>
                    <strong>{candidate.name}</strong>
                    <small>{candidate.grade}</small>
                    {candidate.manifesto && (
                      <p className="manifesto">{candidate.manifesto}</p>
                    )}
                  </div>
                  {candidate.logoUrl && (
                    <img
                      src={getImageUrl(candidate.logoUrl)}
                      alt={`${candidate.name} logo`}
                      style={{ width: "42px", height: "42px", objectFit: "contain" }}
                    />
                  )}
                </label>
              ))}
            </div>
          </article>
          ))}
          {canVote && hasSelectablePosts && (
            <button
              className="btn primary"
              type="submit"
              disabled={!allPostsSelected || loading || tokenIsUsed}
            >
              {loading ? "Submitting..." : "Submit Ballot"}
            </button>
          )}
        </form>
      )}
      {message && <p className="info">{message}</p>}

      <section className="card">
        <h3>Live Results</h3>
        <div className="results-grid">
          {results.length === 0 && <p>No votes counted yet.</p>}
          {results.map((result) => (
            <article key={result.candidateId + result.postName} className="result-card">
              {result.photoUrl ? (
                <img src={result.photoUrl} alt={result.candidateName} />
              ) : (
                <div className="avatar-fallback">
                  {result.candidateName.substring(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <strong>{result.candidateName}</strong>
                <small>{result.postName}</small>
                <p>{result.votes} votes</p>
              </div>
              {result.logoUrl && (
                <img
                  src={result.logoUrl}
                  alt={`${result.candidateName} logo`}
                  style={{ borderRadius: "0.5rem", border: "none" }}
                />
              )}
            </article>
          ))}
        </div>
      </section>
    </section>
  );
};

export default Ballot;

