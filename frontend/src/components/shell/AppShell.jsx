import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

// Each page declares its `screen` key (drives breadcrumb + nav active state).
export default function AppShell({ screen }) {
  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar screen={screen} />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
