"use client";
import { FiEdit, FiTrash, FiKey } from "react-icons/fi";

interface User {
  id: number;
  name: string;
  email: string;
  identification: string;
  role?: string;
}

interface PersonalTableProps {
  users: User[];
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => void;
  onChangePassword?: (user: User) => void;
  canChangePassword?: boolean;
  loading?: boolean;
}

export default function PersonalTable({ users, onEdit, onDelete, onChangePassword, canChangePassword, loading }: PersonalTableProps) {
  if (loading) {
    return <div className="bg-white rounded-lg shadow p-8 w-full text-center text-gray-500">Cargando...</div>;
  }
  if (!users.length) {
    return <div className="bg-white rounded-lg shadow p-8 w-full text-center text-gray-500">No hay usuarios.</div>;
  }
  return (
    <div className="bg-white rounded-lg shadow p-4 w-full overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500">
            <th className="py-2 px-3">Nombre</th>
            <th className="py-2 px-3">Email</th>
            <th className="py-2 px-3">Identificación</th>
            {onEdit || onDelete || onChangePassword ? (
              <th className="py-2 px-3">Acciones</th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-t text-gray-500">
              <td className="py-2 px-3">{user.name}</td>
              <td className="py-2 px-3">{user.email}</td>
              <td className="py-2 px-3">{user.identification}</td>
              {(onEdit || onDelete || onChangePassword) && (
                <td className="py-2 px-3 flex gap-2">
                  {onEdit && (
                    <button
                      className="text-purple-600 hover:text-purple-900"
                      onClick={() => onEdit(user)}
                      title="Editar"
                    >
                      <FiEdit />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      className="text-red-600 hover:text-red-900"
                      onClick={() => onDelete(user)}
                      title="Eliminar"
                      disabled={loading}
                    >
                      <FiTrash />
                    </button>
                  )}
                  {canChangePassword && onChangePassword && (
                    <button
                      className="text-gray-600 hover:text-gray-900"
                      onClick={() => onChangePassword(user)}
                      title="Cambiar contraseña"
                    >
                      <FiKey />
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 