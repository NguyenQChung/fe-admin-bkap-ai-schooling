import React, { useState, useEffect } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import Swal from "sweetalert2";

export default function AddSchool() {

  const API_URL = import.meta.env.VITE_API_URL || "";
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [errors, setErrors] = useState<{ name?: string; address?: string }>({});


  const validate = () => {
    const newErrors: typeof errors = {};
    if (!name) {
      newErrors.name = "Tên trường không được để trống ";
    }

    if (!address) {
      newErrors.address = "Địa chỉ không được để trống";
    } else if (address.length < 3) {
      newErrors.address = "địa chỉ phải có ít nhất 6 ký tự";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const teacherData = {
      name,
      address,
    };

    try {
      const res = await fetch(`${API_URL}/schools`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(teacherData),
      });

      if (!res.ok) throw new Error("Failed to create school");

      Swal.fire({
        icon: "success",
        title: "Thành công!",
        text: "Tạo lớp học thành công!",
        timer: 2000,
        showConfirmButton: false,
      });
      setName("");
      setAddress("");
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
        title="Thêm Trường Học "
        description="Trang Thêm Trường Học mới"
      />
      <PageBreadcrumb pageTitle="Thêm Trường Học" />
      <div className="space-y-6">
        <ComponentCard title="Thêm Trường Học">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tên Trường
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full border rounded-md px-3 py-2"
              />
            </div>
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Địa Chỉ
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-1 block w-full border rounded-md px-3 py-2"
              />
            </div>
            {errors.address && (
              <p className="mt-1 text-sm text-red-500">{errors.address}</p>
            )}

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
