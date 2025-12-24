"use client";
import { useState, useEffect, useMemo } from "react";

const ROLES = [
  { value: "superadmin", label: "Superadmin" },
  { value: "admin", label: "Admin" },
  { value: "assembler", label: "Armador" },
  { value: "driver", label: "Repartidor" },
];

interface AdminData {
  name: string;
  email: string;
  identification: string;
  role: string;
  password: string;
}

interface AdminFormProps {
  initialData?: Partial<AdminData>;
  onSave: (data: AdminData) => void;
  loading?: boolean;
  isEdit?: boolean;
  showRole?: boolean;
  showPassword?: boolean;
}

export default function AdminForm({
  initialData = {},
  onSave,
  loading = false,
  isEdit = false,
  showRole = true,
  showPassword = true,
}: AdminFormProps) {
  const safeInitialData = useMemo(() => initialData || {}, [initialData]);
  const [form, setForm] = useState<AdminData>({
    name: safeInitialData.name || "",
    email: safeInitialData.email || "",
    identification: safeInitialData.identification || "",
    role: safeInitialData.role || "admin",
    password: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    setForm({
      name: safeInitialData.name || "",
      email: safeInitialData.email || "",
      identification: safeInitialData.identification || "",
      role: safeInitialData.role || "admin",
      password: "",
    });
  }, [safeInitialData]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.name || !form.email || !form.identification || (showPassword && !isEdit && !form.password)) {
      setError("Completa todos los campos obligatorios");
      return;
    }
    setError("");
    onSave(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Nombre</label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          className="mt-1 block w-full border rounded px-3 py-2"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          className="mt-1 block w-full border rounded px-3 py-2"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Identificación</label>
        <input
          name="identification"
          value={form.identification}
          onChange={handleChange}
          className="mt-1 block w-full border rounded px-3 py-2"
          required
        />
      </div>
      {showRole && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Rol</label>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="mt-1 block w-full border rounded px-3 py-2"
            required
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
      )}
      {showPassword && !isEdit && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Contraseña</label>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            className="mt-1 block w-full border rounded px-3 py-2"
            autoComplete="new-password"
            minLength={6}
          />
        </div>
      )}
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <button
        type="submit"
        className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition"
        disabled={loading}
      >
        {loading ? "Guardando..." : "Guardar"}
      </button>
    </form>
  );
} 