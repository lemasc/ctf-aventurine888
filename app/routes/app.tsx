import { Outlet, useNavigate } from "react-router";
import logo from "~/medias/hsr_logo.png";
import { rpc } from "~/lib/rpc";

export default function AppLayout() {
  const navigate = useNavigate();
  const logout = async () => {
    if (confirm("Are you sure you want to logout?")) {
      await rpc.api.logout.$post().catch(() => {});
      navigate("/login");
    }
  };

  return (
    <div className="h-screen w-screen relative app-bg overflow-hidden">
      <div className="flex items-center justify-center p-6">
        <img src={logo} alt="Logo" className="h-24 w-auto" />
      </div>
      <Outlet />
      <div className="absolute top-0 right-0 p-8">
        <button
          onClick={logout}
          className="bg-[#e3dfde] hover:bg-amber-50 transition-colors text-neutral-700 font-semibold px-6 py-2 rounded-xl"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
