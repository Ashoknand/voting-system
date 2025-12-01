import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <section className="page card" style={{ textAlign: "center" }}>
      <h2>Page not found</h2>
      <p>The page you are looking for does not exist.</p>
      <Link className="btn" to="/">
        Go Home
      </Link>
    </section>
  );
};

export default NotFound;
