import { useNavigate } from "react-router-dom";

export default function SidebarWidget() {
  const navigate = useNavigate();

  const handleSignOut = () => {
    localStorage.removeItem("token"); // xoá token
    navigate("/signin"); // chuyển về login
  };

  return (
    <div className="mx-auto mb-10 w-full max-w-60 rounded-2xl bg-gray-50 px-4 py-5 text-center dark:bg-white/[0.03]">
      <div className="flex flex-col gap-3">
        {/* Nút về trang chủ */}
        <a
          href="https://aispark.bkap.vn"
          className="flex items-center justify-center p-3 font-medium text-white rounded-lg bg-blue-500 text-theme-sm hover:bg-blue-600"
        >
          Trang chủ
        </a>

        {/* Nút đăng xuất */}
        <button
          onClick={handleSignOut}
          className="flex items-center justify-center p-3 font-medium text-white rounded-lg bg-red-500 text-theme-sm hover:bg-red-600"
        >
          Đăng Xuất
        </button>
      </div>
    </div>
  );
}
