import React, { useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import Swal from "sweetalert2";

export default function AddSchool() {
  const API_URL = import.meta.env.VITE_API_URL || "";

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [principalName, setPrincipalName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [errors, setErrors] = useState<{
    name?: string;
    address?: string;
    principalName?: string;
    email?: string;
    phone?: string;
  }>({});

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!name) newErrors.name = "Tên trường không được để trống";
    if (!address || address.length < 6)
      newErrors.address = "Địa chỉ phải có ít nhất 6 ký tự";
    if (!principalName) newErrors.principalName = "Tên phụ trách không được để trống";
    if (!email) newErrors.email = "Email không được để trống";
    else if (!/\S+@\S+\.\S+/.test(email))
      newErrors.email = "Email không hợp lệ";
    if (!phone) newErrors.phone = "Số điện thoại không được để trống";
    else if (!/^[0-9]{9,11}$/.test(phone))
      newErrors.phone = "Số điện thoại phải từ 9–11 chữ số";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const schoolData = {
      name,
      address,
      principalName,
      email,
      phone,
    };

    try {
      const res = await fetch(`${API_URL}/schools`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schoolData),
      });

      if (!res.ok) throw new Error("Failed to create school");

      Swal.fire({
        icon: "success",
        title: "Thành công!",
        text: "Tạo trường học thành công!",
        timer: 2000,
        showConfirmButton: false,
      });

      setName("");
      setAddress("");
      setPrincipalName("");
      setEmail("");
      setPhone("");
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Tạo trường học thất bại!",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  return (
    <>
      <PageMeta title="Thêm Trường Học" description="Trang Thêm Trường Học mới" />
      <PageBreadcrumb pageTitle="Thêm Trường Học" />
      <div className="space-y-6">
        <ComponentCard title="Thêm Trường Học">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Tên trường */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Tên Trường</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full border rounded-md px-3 py-2"
              />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>

            {/* Địa chỉ */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Địa Chỉ</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-1 block w-full border rounded-md px-3 py-2"
              />
              {errors.address && <p className="mt-1 text-sm text-red-500">{errors.address}</p>}
            </div>

            {/* Tên phụ trách */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Tên Phụ Trách</label>
              <input
                type="text"
                value={principalName}
                onChange={(e) => setPrincipalName(e.target.value)}
                className="mt-1 block w-full border rounded-md px-3 py-2"
              />
              {errors.principalName && (
                <p className="mt-1 text-sm text-red-500">{errors.principalName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full border rounded-md px-3 py-2"
              />
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
            </div>

            {/* Số điện thoại */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Số Điện Thoại</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 block w-full border rounded-md px-3 py-2"
              />
              {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
            </div>

            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Thêm Trường Học
            </button>
          </form>
        </ComponentCard>
      </div>
    </>
  );
}
