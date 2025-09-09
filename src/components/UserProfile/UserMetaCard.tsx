import { useState, useEffect } from "react";
import axios from "axios";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";


export default function UserMetaCard() {
  interface ProfileDTO {
    userId: number;
    username?: string;
    email?: string;
    phone?: string;
    role?: string;
    objectType?: string;
    fullName?: string;
    code?: string;
    className?: string;
    homeroom?: string;
    hobbies?: string[];
  }

  const [profile, setProfile] = useState<ProfileDTO | null>(null);
  const API_URL = import.meta.env.VITE_API_URL || "";


  // Fetch profile từ API
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get<ProfileDTO>(`${API_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(res.data);
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };
    fetchProfile();
  }, []);

  // Handler Save



  if (!profile) return <div>Loading...</div>;

  return (
    <>
      {/* Card hiển thị profile */}
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
              <img src="/images/user/owner.jpg" alt="user" />
            </div>
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {profile.fullName || profile.username}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">{profile.objectType}</p>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{profile.code}</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Modal edit */}

    </>
  );
}
