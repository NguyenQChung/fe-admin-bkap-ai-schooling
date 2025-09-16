import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { useNavigate } from "react-router-dom"; // 👈 thêm

export default function UserInfoCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const [formData, setFormData] = useState<Partial<ProfileDTO>>({});
  const MySwal = withReactContent(Swal);
  const navigate = useNavigate(); // 👈 thêm
  const [profile, setProfile] = useState<ProfileDTO | null>(null);
  const API_URL = import.meta.env.VITE_API_URL || "";
  const [errors, setErrors] = useState<{ email?: string; phone?: string }>({});

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

  const validate = () => {
    const newErrors: typeof errors = {};

    // validate email
    if (!formData.email) {
      newErrors.email = "Email là bắt buộc";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email không hợp lệ";
    }

    // validate phone
    if (!formData.phone) {
      newErrors.phone = "Số điện thoại là bắt buộc";
    } else if (!/^[0-9]{9,11}$/.test(formData.phone)) {
      newErrors.phone = "Số điện thoại phải từ 9-11 chữ số";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get<ProfileDTO>(`${API_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(res.data);
        setFormData(res.data); // copy vào formData để edit
      } catch (err: any) {
        console.error("Error fetching profile:", err);
        // 👇 nếu bị 401 thì redirect về login
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          localStorage.removeItem("token"); // xoá token cũ
          navigate("/signin"); // chuyển về trang login
        }
      }
    };
    fetchProfile();
  }, [API_URL, navigate]);

  const handleChange = (field: keyof ProfileDTO, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API_URL}/profile`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(formData as ProfileDTO);
      MySwal.fire("Thành công", "Cập nhật thông tin thành công", "success");

      closeModal();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        MySwal.fire("Lỗi", err.response.data.message, "error");
      } else {
        MySwal.fire("Lỗi", "Không thể cập nhật thông tin", "error");
      }
    }
  };

  if (!profile) return <div>Loading...</div>;

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
              Thông Tin Người Dùng
            </h4>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Tên Người Dùng
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {profile.fullName || profile.username}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  ID Giáo Viên
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {profile.code}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Địa Chỉ Email
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {profile.email}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Số điện thoại
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {profile.phone}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Chức Vụ
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {profile.objectType}
                </p>
              </div>
            </div>
          </div>
          {profile.objectType !== "SYSTEM" &&
            profile.objectType !== "SCHOOL" && (
              <button
                onClick={openModal}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
              >
                <svg
                  className="fill-current"
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                    fill=""
                  />
                </svg>
                Edit
              </button>
            )}
        </div>
      </div>
      {profile.objectType !== "SYSTEM" && profile.objectType !== "SCHOOL" && (
        <Modal
          isOpen={isOpen}
          onClose={closeModal}
          className="max-w-[500px] m-4"
        >
          <div className="bg-white p-6 rounded-xl dark:bg-gray-900">
            <h4 className="text-xl font-semibold mb-4">Edit Profile</h4>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <Label>Email</Label>
                <Input
                  type="text"
                  value={formData.email || ""}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                )}
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  type="text"
                  value={formData.phone || ""}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
                )}
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <Button variant="outline" onClick={closeModal}>
                  Close
                </Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </>
  );
}
