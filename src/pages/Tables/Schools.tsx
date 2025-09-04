import React, { useState, useEffect } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";

export default function School() {

  interface School {
    id: number;
    name: string;
    address: string;
  }

  const [schools, setSchools] = useState<School[]>([]);
  const API_URL = import.meta.env.VITE_API_URL || "";

  useEffect(() => {
    fetch(`${API_URL}/schools`)
      .then((res) => res.json())
      .then((data) => {
        console.log("API /schools response:", data);

        // Nếu backend trả về { data: [...] }
        if (Array.isArray(data)) {
          setSchools(data);
        } else if (data && Array.isArray(data.content)) {
          // Ví dụ backend có phân trang: { content: [...], totalPages: 2 }
          setSchools(data.content);
        } else {
          console.error("Unexpected API format:", data);
          setSchools([]); // fallback an toàn
        }
      })
      .catch((err) => console.error("Error fetching schools:", err));
  }, []);

  return (
    <>
      <PageMeta
        title="React.js Basic Tables Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Basic Tables Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Basic Tables" />
      <div className="space-y-6">
        <ComponentCard title="Danh sách Trường">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên Trường
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Địa chỉ
                </th>
              </tr>
            </thead>
            <tbody>
              {schools.length > 0 ? (
                schools.map((school) => (
                  <tr key={school.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{school.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{school.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{school.address}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="text-center py-4">
                    No schools found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </ComponentCard>
      </div>
    </>
  );
}
