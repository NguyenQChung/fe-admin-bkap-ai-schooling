import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Upload, Eye, EyeOff } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Alert from "../../components/ui/alert/Alert";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

interface ValidationResult {
  total: number;
  valid: number;
  errorCount: number;
  errors: string[];
}

interface ImportResult {
  total: number;
  success: number;
  error: number;
  errors: string[];
  message: string;
}

interface ParsedError {
  row: string;
  message: string;
  value: string;
}

interface User {
  id: number;
  username: string | null;
  email: string;
}

const getJwtToken = (token: string | null): string | null => {
  if (!token) return null;
  try {
    const parsedToken = JSON.parse(token);
    return parsedToken.token || token;
  } catch (e) {
    return token;
  }
};

const getCurrentUser = async (
  setMessage: (
    message: { type: "error" | "success"; text: string } | null
  ) => void
): Promise<User | null> => {
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("❌ Không tìm thấy token. Vui lòng đăng nhập lại.");
    setMessage({ type: "error", text: "❌ Vui lòng đăng nhập lại!" });
    return null;
  }

  const jwtToken = getJwtToken(token);
  if (!jwtToken) {
    console.error("❌ Token không hợp lệ.");
    setMessage({ type: "error", text: "❌ Token không hợp lệ!" });
    return null;
  }

  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL || "http://localhost:8080/api"}/auth/me`,
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    if (!response.ok) {
      const errorData = await response.json();
      console.error(
        `❌ Lỗi khi lấy user, status: ${response.status} ${response.statusText}`,
        errorData
      );
      setMessage({
        type: "error",
        text: `❌ Lỗi: ${
          errorData.message || "Không thể lấy thông tin người dùng"
        }`,
      });
      if (response.status === 401) {
        localStorage.removeItem("token");
        setMessage({
          type: "error",
          text: "❌ Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!",
        });
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const userData = await response.json();
    console.log("✅ Lấy thông tin user thành công");
    return {
      id: userData.id,
      username: userData.username || userData.email,
      email: userData.email,
    };
  } catch (err) {
    const error = err as Error;
    console.error("❌ Lỗi khi lấy thông tin user:", error.message);
    setMessage({
      type: "error",
      text: `❌ Lỗi: ${error.message || "Không thể kết nối server!"}`,
    });
    return null;
  }
};

export default function ImportExcel() {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showErrors, setShowErrors] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MySwal = withReactContent(Swal);
  const navigate = useNavigate();

  // Load results from localStorage and get current user on mount
  useEffect(() => {
    setIsLoading(true);
    getCurrentUser(setMessage).then((user) => {
      setIsLoading(false);
      if (!user) {
        navigate("/signin");
        return;
      }
      setCurrentUser(user);

      const storedValidationResult = localStorage.getItem("validationResult");
      const storedImportResult = localStorage.getItem("importResult");
      if (storedValidationResult) {
        setValidationResult(JSON.parse(storedValidationResult));
        setShowErrors(true);
      }
      if (storedImportResult) {
        setImportResult(JSON.parse(storedImportResult));
        setShowErrors(true);
      }
    });
  }, [navigate]);

  // Save results to localStorage
  useEffect(() => {
    if (validationResult) {
      localStorage.setItem(
        "validationResult",
        JSON.stringify(validationResult)
      );
    } else {
      localStorage.removeItem("validationResult");
    }
    if (importResult) {
      localStorage.setItem("importResult", JSON.stringify(importResult));
    } else {
      localStorage.removeItem("importResult");
    }
  }, [validationResult, importResult]);

  // Parse errors into structured format
  const parseErrors = (errors: string[]): ParsedError[] => {
    return errors.map((error) => {
      const match = error.match(/(?:Dòng|Row) (\d+): (.+?): (.+)/);
      if (match) {
        return {
          row: match[1],
          message: match[2],
          value: match[3],
        };
      }
      return { row: "N/A", message: error, value: "" };
    });
  };

  // Generate HTML table for SweetAlert2
  const generateErrorTableHtml = (errors: ParsedError[]): string => {
    return `
      <div class="overflow-x-auto">
        <table class="min-w-full bg-red-50 border border-red-200 rounded-lg">
          <thead>
            <tr>
              <th class="px-4 py-2 text-left text-sm font-semibold text-red-600">Dòng</th>
              <th class="px-4 py-2 text-left text-sm font-semibold text-red-600">Lỗi</th>
              <th class="px-4 py-2 text-left text-sm font-semibold text-red-600">Giá trị</th>
            </tr>
          </thead>
          <tbody>
            ${errors
              .map(
                (error, index) =>
                  `<tr class="${
                    index % 2 === 0 ? "bg-red-50" : "bg-red-100"
                  } hover:bg-red-200">
                    <td class="px-4 py-2 text-sm text-red-600">${error.row}</td>
                    <td class="px-4 py-2 text-sm text-red-600">${
                      error.message
                    }</td>
                    <td class="px-4 py-2 text-sm text-red-600 font-mono">${
                      error.value
                    }</td>
                  </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    if (selectedFile) {
      console.log("Selected File:", {
        name: selectedFile.name,
        size: selectedFile.size,
        lastModified: new Date(selectedFile.lastModified).toISOString(),
      });
    }
    setFile(selectedFile);
    setValidationResult(null);
    setImportResult(null);
    setShowErrors(false);
  };

  const handleValidate = () => {
    if (!file) {
      MySwal.fire({
        title: "Lỗi",
        text: "Vui lòng chọn file Excel (.xlsx)!",
        icon: "error",
      });
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}/import/students/validate`, true);

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data: ValidationResult = JSON.parse(xhr.responseText);
        console.log("Validation Response:", data);
        setValidationResult({
          ...data,
          errors: Array.isArray(data.errors) ? data.errors : [],
        });
        setImportResult(null);
        setShowErrors(data.errorCount > 0);

        if (data.errorCount === 0) {
          MySwal.fire({
            title: "Thành công",
            text: "File hợp lệ, sẵn sàng import!",
            icon: "success",
          });
        } else {
          MySwal.fire({
            title: "Cảnh báo",
            html: `
              <div class="text-left">
                <p class="text-sm text-gray-700 mb-2">Tổng: ${
                  data.total
                }, Hợp lệ: ${data.valid}, Lỗi: ${data.errorCount}</p>
                ${generateErrorTableHtml(parseErrors(data.errors))}
              </div>
            `,
            icon: "warning",
            width: "600px",
          });
        }
      } else {
        const errorMessage = xhr.responseText || "Lỗi khi kiểm tra file";
        console.error("Validation Error:", errorMessage);
        MySwal.fire({
          title: "Lỗi",
          text: `Không thể kiểm tra file: ${errorMessage}`,
          icon: "error",
        });
        setValidationResult(null);
        setShowErrors(false);
      }
      setIsLoading(false);
    };

    xhr.onerror = () => {
      console.error("Validation Error: Network error");
      let errorMessage = "Không thể kết nối đến server.";
      if (xhr.status === 0) {
        errorMessage =
          "File đã bị thay đổi hoặc không thể truy cập. Vui lòng chọn lại file.";
      }
      MySwal.fire({
        title: "Lỗi",
        text: `Không thể kiểm tra file: ${errorMessage}`,
        icon: "error",
      });
      setValidationResult(null);
      setShowErrors(false);
      setIsLoading(false);
    };

    console.log("Starting validation for file:", file.name);
    xhr.send(formData);
  };

  const handleImport = () => {
    if (!file || !currentUser) {
      MySwal.fire({
        title: "Lỗi",
        text: "Vui lòng chọn file và đảm bảo đã đăng nhập!",
        icon: "error",
      });
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append("userId", currentUser.id.toString());
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}/import/students`, true);

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data: ImportResult = JSON.parse(xhr.responseText);
        console.log("Import Response:", data);
        setImportResult({
          ...data,
          errors: Array.isArray(data.errors) ? data.errors : [],
        });
        setValidationResult(null);
        setShowErrors(data.error > 0);

        if (data.error === 0) {
          MySwal.fire({
            title: "Thành công",
            text: data.message,
            icon: "success",
          });
        } else {
          MySwal.fire({
            title: "Import có lỗi",
            html: `
              <div class="text-left">
                <p class="text-sm text-gray-700 mb-2">${data.message}</p>
                ${generateErrorTableHtml(parseErrors(data.errors))}
              </div>
            `,
            icon: "error",
            width: "600px",
          });
        }
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        setFile(null);
        localStorage.removeItem("validationResult");
        localStorage.removeItem("importResult");
      } else {
        const errorMessage = xhr.responseText || "Lỗi khi import";
        console.error("Import Error:", errorMessage);
        MySwal.fire({
          title: "Lỗi",
          text: `Không thể import: ${errorMessage}`,
          icon: "error",
        });
        setImportResult(null);
        setShowErrors(false);
      }
      setIsLoading(false);
    };

    xhr.onerror = () => {
      console.error("Import Error: Network error");
      let errorMessage = "Không thể kết nối đến server.";
      if (xhr.status === 0) {
        errorMessage =
          "File đã bị thay đổi hoặc không thể truy cập. Vui lòng chọn lại file.";
      }
      MySwal.fire({
        title: "Lỗi",
        text: `Không thể import: ${errorMessage}`,
        icon: "error",
      });
      setImportResult(null);
      setShowErrors(false);
      setIsLoading(false);
    };

    console.log(
      "Starting import for file:",
      file.name,
      "with userId:",
      currentUser.id
    );
    xhr.send(formData);
  };

  if (!currentUser) {
    return (
      <div className="text-center text-red-600">
        Vui lòng đăng nhập để sử dụng tính năng này!
        <button
          onClick={() => navigate("/signin")}
          className="ml-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Đăng nhập
        </button>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Import Học sinh | TailAdmin - React.js Admin Dashboard Template"
        description="Import danh sách học sinh từ file Excel"
      />
      <PageBreadcrumb pageTitle="Import Học sinh" />
      <div className="space-y-6">
        <ComponentCard title="Import Danh Sách Học sinh">
          <div className="space-y-4">
            {message && (
              <div
                className={`p-2 rounded-md border ${
                  message.type === "error"
                    ? "text-red-700 bg-red-100 border-red-300"
                    : "text-green-700 bg-green-100 border-green-300"
                }`}
              >
                {message.text}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teacher
                </label>
                <input
                  type="text"
                  value={currentUser.username || currentUser.email}
                  className="w-full border rounded-lg px-3 py-2 bg-gray-100"
                  disabled
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chọn file Excel (.xlsx) *
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileChange}
                  className="w-full border rounded-lg px-3 py-2 file:mr-4 file:py-1 file:px-4 file:rounded-lg file:border-0 file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="warning"
                startIcon={<Search className="h-4 w-4" />}
                onClick={handleValidate}
                disabled={isLoading || !file}
              >
                Kiểm tra file
              </Button>
              <Button
                variant="success"
                startIcon={<Upload className="h-4 w-4" />}
                onClick={handleImport}
                disabled={
                  isLoading ||
                  !file ||
                  !currentUser ||
                  (validationResult?.errorCount ?? 0) > 0
                }
              >
                Import
              </Button>
            </div>
          </div>

          {(validationResult || importResult) && (
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-semibold mb-2">Kết quả</h3>
              {validationResult && (
                <div>
                  <Alert
                    variant={
                      validationResult.errorCount === 0 ? "success" : "warning"
                    }
                    title={
                      validationResult.errorCount === 0
                        ? "Kiểm tra thành công"
                        : "Kiểm tra có lỗi"
                    }
                    message={
                      validationResult.errorCount === 0
                        ? `Tổng: ${validationResult.total}, Hợp lệ: ${validationResult.valid}`
                        : `Tổng: ${validationResult.total}, Hợp lệ: ${validationResult.valid}, Lỗi: ${validationResult.errorCount}`
                    }
                    showLink={false}
                  />
                  {validationResult.errorCount > 0 && (
                    <div className="mt-4">
                      <Button
                        startIcon={
                          showErrors ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )
                        }
                        onClick={() => setShowErrors(!showErrors)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 mb-2"
                      >
                        {showErrors ? "Ẩn chi tiết lỗi" : "Xem chi tiết lỗi"}
                      </Button>
                      {showErrors && validationResult.errors.length > 0 ? (
                        <Table className="bg-red-50 border border-red-200 rounded-lg shadow-sm">
                          <TableHeader>
                            <TableRow className="hover:bg-red-100">
                              <TableCell className="text-red-600 font-semibold">
                                Dòng
                              </TableCell>
                              <TableCell className="text-red-600 font-semibold">
                                Lỗi
                              </TableCell>
                              <TableCell className="text-red-600 font-semibold">
                                Giá trị
                              </TableCell>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {parseErrors(validationResult.errors).map(
                              (error, index) => (
                                <TableRow
                                  key={index}
                                  className="hover:bg-red-100"
                                >
                                  <TableCell className="text-red-600">
                                    {error.row}
                                  </TableCell>
                                  <TableCell className="text-red-600">
                                    {error.message}
                                  </TableCell>
                                  <TableCell className="text-red-600 font-mono">
                                    {error.value}
                                  </TableCell>
                                </TableRow>
                              )
                            )}
                          </TableBody>
                        </Table>
                      ) : showErrors ? (
                        <p className="text-sm text-red-500">
                          Không có chi tiết lỗi cụ thể từ server.
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>
              )}
              {importResult && (
                <div>
                  <Alert
                    variant={importResult.error === 0 ? "success" : "error"}
                    title={
                      importResult.error === 0
                        ? "Import thành công"
                        : "Import có lỗi"
                    }
                    message={importResult.message}
                    showLink={false}
                  />
                  {importResult.error > 0 && (
                    <div className="mt-4">
                      <Button
                        startIcon={
                          showErrors ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )
                        }
                        onClick={() => setShowErrors(!showErrors)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 mb-2"
                      >
                        {showErrors ? "Ẩn chi tiết lỗi" : "Xem chi tiết lỗi"}
                      </Button>
                      {showErrors && importResult.errors.length > 0 ? (
                        <Table className="bg-red-50 border border-red-200 rounded-lg shadow-sm">
                          <TableHeader>
                            <TableRow className="hover:bg-red-100">
                              <TableCell className="text-red-600 font-semibold">
                                Dòng
                              </TableCell>
                              <TableCell className="text-red-600 font-semibold">
                                Lỗi
                              </TableCell>
                              <TableCell className="text-red-600 font-semibold">
                                Giá trị
                              </TableCell>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {parseErrors(importResult.errors).map(
                              (error, index) => (
                                <TableRow
                                  key={index}
                                  className="hover:bg-red-100"
                                >
                                  <TableCell className="text-red-600">
                                    {error.row}
                                  </TableCell>
                                  <TableCell className="text-red-600">
                                    {error.message}
                                  </TableCell>
                                  <TableCell className="text-red-600 font-mono">
                                    {error.value}
                                  </TableCell>
                                </TableRow>
                              )
                            )}
                          </TableBody>
                        </Table>
                      ) : showErrors ? (
                        <p className="text-sm text-red-500">
                          Không có chi tiết lỗi cụ thể từ server.
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </ComponentCard>
      </div>
    </>
  );
}
