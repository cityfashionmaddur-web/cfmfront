import React from "react";
import { Link } from "react-router-dom";

export default function AdminNotFound() {
  return (
    <div className="empty-state">
      <h2>Admin page not found</h2>
      <p>The admin route you requested does not exist.</p>
      <Link className="btn btn-primary" to="/admin">
        Back to dashboard
      </Link>
    </div>
  );
}
