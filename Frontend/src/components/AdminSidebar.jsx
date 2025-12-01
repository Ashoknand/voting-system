import { NavLink } from "react-router-dom";

const AdminSidebar = ({ sections }) => {
  return (
    <aside className="admin-sidebar card">
      <h3>Admin Panel</h3>
      <ul>
        {sections.map((section) => (
          <li key={section.path}>
            {section.path.startsWith("#") ? (
              <a href={section.path}>{section.label}</a>
            ) : (
              <NavLink to={section.path}>{section.label}</NavLink>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default AdminSidebar;

