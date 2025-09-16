import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import axios from "axios";

// ... phần import giữ nguyên
export default function ResetPasswordForm() {
  const [step, setStep] = useState<1 | 2>(1);
  const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [canResend, setCanResend] = useState(false);
  const [resending, setResending] = useState(false); // ✅ trạng thái resend

  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string })?.email || "";
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
  const MySwal = withReactContent(Swal);

  const token = otpValues.join("").trim();

  // Countdown OTP
  useEffect(() => {
    if (step === 1 && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setCanResend(true);
    }
  }, [timeLeft, step]);

  const handleOtpChange = (value: string, index: number) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newOtp = [...otpValues];
    newOtp[index] = value;
    setOtpValues(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || token.length < 6) {
      setErrors({ token: "OTP phải đủ 6 số" });
      return;
    }

    try {
      await axios.post(`${API_URL}/auth/verify-otp`, { token });
      await MySwal.fire(
        "Thành công",
        "OTP hợp lệ, mời đặt lại mật khẩu",
        "success"
      );
      setStep(2);
      setErrors({});
    } catch (err: any) {
      setErrors({
        token:
          err.response?.data?.message || "OTP không hợp lệ hoặc đã hết hạn",
      });
    }
  };

  // Reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!newPassword) newErrors.newPassword = "Mật khẩu mới là bắt buộc";
    else if (newPassword.length < 6)
      newErrors.newPassword = "Mật khẩu phải có ít nhất 6 ký tự";

    if (confirmPassword !== newPassword)
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      await axios.post(`${API_URL}/auth/reset-password`, {
        token,
        newPassword,
      });
      await MySwal.fire(
        "Thành công",
        "Đặt lại mật khẩu thành công!",
        "success"
      );
      navigate("/signin");
    } catch (err: any) {
      setErrors({
        general: err.response?.data?.message || "Đặt lại mật khẩu thất bại",
      });
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!email) {
      MySwal.fire(
        "Lỗi",
        "Không tìm thấy email, quay lại bước nhập email",
        "error"
      );
      navigate("/forgot-password");
      return;
    }

    setResending(true);
    try {
      await axios.post(`${API_URL}/auth/forgot-password`, { email });
      setTimeLeft(120);
      setCanResend(false);
      setOtpValues(Array(6).fill(""));
      await MySwal.fire("Thành công", "OTP mới đã gửi đến email", "success");
    } catch (err: any) {
      MySwal.fire(
        "Lỗi",
        err.response?.data?.message || "Không thể gửi lại OTP",
        "error"
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-10 mx-auto">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeftIcon className="size-5" />
          Back to dashboard
        </Link>
      </div>

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm sm:text-title-md">
              Thay Đổi Mật Khẩu
            </h1>
            <p className="text-sm text-gray-500">
              {step === 1
                ? `Nhập mã OTP đã gửi đến ${email || "email của bạn"}`
                : "Nhập mật khẩu mới"}
            </p>
          </div>

          {errors.general && (
            <div className="mb-4 text-sm text-red-500">{errors.general}</div>
          )}

          {step === 1 && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <Label>
                  OTP <span className="text-error-500">*</span>
                </Label>
                <div className="flex justify-between gap-2">
                  {otpValues.map((val, i) => (
                    <input
                      key={i}
                      type="text"
                      maxLength={1}
                      value={val}
                      onChange={(e) => handleOtpChange(e.target.value, i)}
                      onKeyDown={(e) => handleKeyDown(e, i)}
                      ref={(el) => {
                        if (el) inputRefs.current[i] = el; // ✅ gán ref an toàn
                      }}
                      className="w-12 h-12 text-center text-lg border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-400"
                    />
                  ))}
                </div>
                {errors.token && (
                  <p className="mt-1 text-sm text-red-500">{errors.token}</p>
                )}
              </div>

              <div className="text-center text-sm text-gray-500">
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className={`text-blue-600 hover:underline flex items-center justify-center gap-2`}
                    disabled={resending}
                  >
                    {resending && (
                      <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                    )}
                    Gửi lại OTP
                  </button>
                ) : (
                  <>
                    OTP hết hạn sau <b>{timeLeft}s</b>
                  </>
                )}
              </div>

              <div>
                <Button className="w-full" size="sm" type="submit">
                  Xác minh OTP
                </Button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <Label>
                  Mật khẩu mới <span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu mới"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showPassword ? (
                      <EyeIcon className="fill-gray-500 size-5" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 size-5" />
                    )}
                  </span>
                </div>
                {errors.newPassword && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.newPassword}
                  </p>
                )}
              </div>

              <div>
                <Label>
                  Xác nhận mật khẩu <span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Nhập lại mật khẩu"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <span
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showConfirm ? (
                      <EyeIcon className="fill-gray-500 size-5" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 size-5" />
                    )}
                  </span>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <div>
                <Button className="w-full" size="sm" type="submit">
                  Đặt lại mật khẩu
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
