import React, { useState, useEffect } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";

export default function ClassPage() {


  interface Class {
    id: number;
    name: string;
    schoolId: number;
    schoolName: string;
    schoolAddress: string;
  }

  const [classes, setClasses] = useState<Class[]>([]);
  const API_URL = import.meta.env.VITE_API_URL || "";

  useEffect(() => {
    fetch(`${API_URL}/class`)
      .then((res) => res.json())
      .then((data: Class[]) => setClasses(data))
      .catch((err) => console.error("Error fetching classes:", err));
  }, []);

  return (
    <>
      <PageMeta
        title="Danh sách Lớp"
        description="Danh sách lớp học kèm thông tin trường"
      />
      <PageBreadcrumb pageTitle="Danh sách Lớp" />
      <div className="space-y-6">
        <ComponentCard title="Danh sách Lớp">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên Lớp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trường
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {classes.map((cls) => (
                <tr key={cls.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{cls.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{cls.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {cls.schoolName}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ComponentCard>
      </div>
    </>
  );
}
