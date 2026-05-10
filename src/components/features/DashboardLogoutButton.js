"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardLogoutButton() {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <button
      onClick={handleLogout}
      title="Logout"
      className="group relative flex items-center justify-start w-[45px] h-[45px] border-none rounded-full cursor-pointer overflow-hidden transition-all duration-300 shadow-[2px_2px_10px_rgba(0,0,0,0.199)] bg-[#ff4141] hover:w-[125px] hover:rounded-[40px] active:translate-x-[2px] active:translate-y-[2px]"
    >
      <div className="flex w-full items-center justify-center transition-all duration-300 group-hover:w-[30%] group-hover:pl-5">
        <svg viewBox="0 0 512 512" className="w-[17px]">
          <path fill="white" d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z"></path>
        </svg>
      </div>
      <div className="absolute right-0 w-0 opacity-0 text-white text-base font-semibold transition-all duration-300 group-hover:opacity-100 group-hover:w-[70%] group-hover:pr-2.5 flex items-center">
        Logout
      </div>
    </button>
  );
}
