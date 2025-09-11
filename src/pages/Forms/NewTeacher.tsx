import React, { useState, useEffect } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import Swal from "sweetalert2";

export default function AddTeacherPage() {
  interface Class {
    id: number;
    name: string;
  }

  const API_URL = import.meta.env.VITE_API_URL || "";
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [homeroomClassId, setHomeroomClassId] = useState<number | "">("");

  const [classes, setClasses] = useState<Class[]>([]);

  const [errors, setErrors] = useState<{ fullName?: string; email?: string; phone?: string; code?: string }>({});

  const validate = () => {
    const newErrors: typeof errors = {};

    // Họ và tên
    if (!fullName) {
      newErrors.fullName = "Họ và Tên không được để trống";
    } else if (fullName.length < 6) {
      newErrors.fullName = "Họ và Tên phải nhiều hơn 6 ký tự";
    }

    // Email
    if (!email) {
      newErrors.email = "Email không được để trống";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Email không hợp lệ";
    }

    // Phone
    if (!phone) {
      newErrors.phone = "Số điện thoại không được để trống";
    } else if (!/^[0-9]+$/.test(phone)) {
      newErrors.phone = "Số điện thoại chỉ được chứa số";
    } else if (phone.length < 9 || phone.length > 11) {
      newErrors.phone = "Số điện thoại phải từ 9 đến 11 số";
    }

    // Code
    if (!code) {
      newErrors.code = "Mã GV không được để trống";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const checkEmailExists = async (value: string) => {
    if (!value) {
      setErrors((prev) => ({ ...prev, email: "Email không được để trống" }));
      return;
    }

    try {
      const res = await fetch(`${API_URL}/teachers/check-email?email=${value}`);
      const data = await res.json();
      if (data.exists) {
        setErrors((prev) => ({ ...prev, email: "Email đã tồn tại" }));
      } else {
        setErrors((prev) => ({ ...prev, email: undefined })); // xoá lỗi email
      }
    } catch {
      setErrors((prev) => ({ ...prev, email: "Không thể kiểm tra email" }));
    }
  };

  // check code tồn tại
  const checkCodeExists = async (value: string) => {
    if (!value) {
      setErrors((prev) => ({ ...prev, code: "Mã GV không được để trống" }));
      return;
    }

    try {
      const res = await fetch(`${API_URL}/teachers/check-code?code=${value}`);
      const data = await res.json();
      if (data.exists) {
        setErrors((prev) => ({ ...prev, code: "Mã Giáo viên đã tồn tại" }));
      } else {
        setErrors((prev) => ({ ...prev, code: undefined })); // xoá lỗi code
      }
    } catch {
      setErrors((prev) => ({ ...prev, code: "Không thể kiểm tra mã GV" }));
    }
  };


  // load danh sách class để chọn lớp chủ nhiệm
  useEffect(() => {
    fetch(`${API_URL}/class`)
      .then((res) => res.json())
      .then((data: Class[]) => setClasses(data))
      .catch((err) => console.error("Error fetching classes:", err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    await checkEmailExists(email);
    await checkCodeExists(code);

    // nếu sau khi check mà vẫn còn lỗi thì dừng
    if (errors.email || errors.code) return;


    const teacherData = {
      fullName,
      email,
      phone,
      code,
      homeroomClass: homeroomClassId ? { id: Number(homeroomClassId) } : null,
    };

    try {
      const res = await fetch(`${API_URL}/teachers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(teacherData),
      });


      if (!res.ok) throw new Error("Failed to create teacher");

      Swal.fire({
        icon: "success",
        title: "Thành công!",
        text: "Tạo lớp học thành công!",
        timer: 2000,
        showConfirmButton: false,
      });
      setFullName("");
      setEmail("");
      setPhone("");
      setCode("");
      setHomeroomClassId("");
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Tạo lớp học thất bại!",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  return (
    <>
      <PageMeta
        title="Thêm Giáo viên | TailAdmin"
        description="Trang thêm giáo viên mới"
      />
      <PageBreadcrumb pageTitle="Thêm Giáo viên" />
      <div className="space-y-6">
        <ComponentCard title="Thêm Giáo viên">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Họ và Tên
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 block w-full border rounded-md px-3 py-2"

              />
            </div>
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={(e) => checkEmailExists(e.target.value)}
                className="mt-1 block w-full border rounded-md px-3 py-2"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email}</p>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Số điện thoại
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 block w-full border rounded-md px-3 py-2"
              />
            </div>
            {errors.phone && (
              <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Mã Giáo viên
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onBlur={(e) => checkCodeExists(e.target.value)} // check khi rời khỏi ô input
                className="mt-1 block w-full border rounded-md px-3 py-2"

              />
            </div>
            {errors.code && (
              <p className="mt-1 text-sm text-red-500">{errors.code}</p>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Lớp Chủ nhiệm
              </label>
              <select
                value={homeroomClassId}
                onChange={(e) => setHomeroomClassId(Number(e.target.value))}
                className="mt-1 block w-full border rounded-md px-3 py-2"
              >
                <option value="">— Chọn lớp —</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Thêm Giáo viên
            </button>
          </form>
        </ComponentCard>
      </div>
    </>
  );
}
