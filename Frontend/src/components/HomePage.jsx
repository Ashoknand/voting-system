import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useElections } from "../context/ElectionContext";

const HomePage = () => {
  const { user } = useAuth();
  const { elections, activeElectionId, selectElection } = useElections();

  return (
    <section className="hero">
      <div>
        <h1>Digital Elections for Students</h1>
        <p>
          Register, get approvals, and run paperless elections with secure
          voting tokens. Students cast exactly one vote per post, and results
          update instantly with candidate photos and insignia.
        </p>
        {!user && (
          <div className="hero__cta">
            <Link to="/register/student" className="btn">
              Student Sign Up
            </Link>
            <Link to="/register/candidate" className="btn secondary">
              Candidate Sign Up
            </Link>
          </div>
        )}
      </div>
      <div className="hero__panel">
        <h2>Upcoming Elections</h2>
        {elections.length === 0 && <p>No elections yet.</p>}
        {elections.map((election) => (
          <button
            key={election._id}
            className={`card ${
              activeElectionId === election._id ? "card--active" : ""
            }`}
            onClick={() => selectElection(election._id)}
          >
            <span>{election.name}</span>
            <small>
              {new Date(election.startDate).toLocaleDateString()} -{" "}
              {new Date(election.endDate).toLocaleDateString()}
            </small>
          </button>
        ))}
      </div>
    </section>
  );
};

export default HomePage;

