import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Navbar from "./components/Navbar";
import HomePage from "./components/HomePage";
import Login from "./Pages/Login";
import RegisterStudent from "./Pages/RegisterStudent";
import CandidateRegister from "./Pages/CandidateRegister";
import Ballot from "./Pages/Ballot";
import AdminDashboard from "./Pages/AdminDashboard";
import AdminGalleryUpload from "./Pages/AdminGalleyUpload";
import AdminStudents from "./Pages/AdminStudents";
import AdminCandidates from "./Pages/AdminCandidates";
import Gallery from "./Pages/Gallery";
import CandidateDashboard from "./Pages/CandidateDashboard";
import CampaignPosts from "./Pages/CampaignPosts";
import CampaignFeed from "./Pages/CampaignFeed";
import Profile from "./Pages/Profile";
import NotFound from "./Pages/NotFound";
import PrivateRoute from "./components/PrivateRoute";
import { AuthProvider } from "./context/AuthContext";
import { ElectionProvider } from "./context/ElectionContext";

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ElectionProvider>
          <div className="app-shell">
            <Navbar />
            <main className="app-content">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register/student" element={<RegisterStudent />} />
                <Route
                  path="/register/candidate"
                  element={<CandidateRegister />}
                />
                <Route
                  path="/ballot"
                  element={
                    <PrivateRoute
                      roles={["student", "candidate", "admin"]}
                      element={<Ballot />}
                    />
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <PrivateRoute roles={["admin"]} element={<AdminDashboard />} />
                  }
                />
                <Route
                  path="/admin/gallery"
                  element={
                    <PrivateRoute
                      roles={["admin"]}
                      element={<AdminGalleryUpload />}
                    />
                  }
                />
                <Route
                  path="/admin/students"
                  element={
                    <PrivateRoute
                      roles={["admin"]}
                      element={<AdminStudents />}
                    />
                  }
                />
                <Route
                  path="/admin/candidates"
                  element={
                    <PrivateRoute
                      roles={["admin"]}
                      element={<AdminCandidates />}
                    />
                  }
                />
                <Route
                  path="/gallery"
                  element={
                    <PrivateRoute
                      roles={["student", "candidate", "admin"]}
                      element={<Gallery />}
                    />
                  }
                />
                <Route
                  path="/candidate/dashboard"
                  element={
                    <PrivateRoute
                      roles={["candidate"]}
                      element={<CandidateDashboard />}
                    />
                  }
                />
                <Route
                  path="/candidate/campaigns"
                  element={
                    <PrivateRoute
                      roles={["candidate"]}
                      element={<CampaignPosts />}
                    />
                  }
                />
                <Route
                  path="/campaign-feed"
                  element={
                    <PrivateRoute
                      roles={["student", "candidate", "admin"]}
                      element={<CampaignFeed />}
                    />
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <PrivateRoute
                      roles={["student", "candidate", "admin"]}
                      element={<Profile />}
                    />
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </ElectionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
