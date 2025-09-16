import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeftIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import axios from "axios";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
  const MySwal = withReactContent(Swal);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/auth/forgot-password`, {
        email,
      });

      // ✅ Toast
      MySwal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: res.data.message || "OTP đã được gửi tới email!",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });

      // Sau khi toast hiển thị, điều hướng
      setTimeout(() => {
        navigate("/reset-password", { state: { email } });
      }, 1000);
    } catch (err: any) {
      MySwal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: err.response?.data?.message || "Có lỗi xảy ra!",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-1/2 no-scrollbar">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <h1 className="mb-2 font-semibold text-gray-800 text-title-sm sm:text-title-md">
            Quên Mật Khẩu?
          </h1>
          <p className="text-sm text-gray-500">
            Nhập email để nhận mã OTP đặt lại mật khẩu.
          </p>

          <form onSubmit={handleSubmit} className="mt-4 space-y-5">
            <div>
              <Label>
                Email<span className="text-red-500">*</span>
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full px-4 py-3 text-sm font-medium text-white rounded-lg flex items-center justify-center gap-2 ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-brand-500 hover:bg-brand-600"
              }`}
            >
              {loading && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              )}
              {loading ? "Đang gửi OTP..." : "Gửi OTP"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
