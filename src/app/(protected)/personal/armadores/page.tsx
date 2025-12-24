"use client";
import { useEffect, useState } from "react";
import { useUserOrRedirect } from "../../../utils/auth";
import Dialog from "../../../components/Dialog";
import AdminForm from "../administradores/AdminForm";
import PersonalTable from "../administradores/PersonalTable";
import { FiEdit, FiTrash, FiKey } from "react-icons/fi";
import { getApiUrl } from "../../../utils/api";

export default function ArmadoresPage() {
  const user = useUserOrRedirect();
  const [assemblers, setAssemblers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordUser, setPasswordUser] = useState<any>(null);
  const [password, setPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [passwordError, setPasswordError] = useState("");

  const canEdit = user?.role === "admin" || user?.role === "superadmin";

  function fetchAssemblers() {
    if (!user) return;
    fetch(getApiUrl(`/admin?filter=role||$eq||assembler&limit=100&page=1`), {
      headers: {
        accept: "application/json",
        token: user.token,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setAssemblers(Array.isArray(data.data) ? data.data : []);
        setLoading(false);
      })
      .catch(() => {
        setError("Error al cargar armadores");
        setLoading(false);
      });
  }

  useEffect(() => {
    fetchAssemblers();
  }, [user]);

  function handleCreate() {
    setEditData(null);
    setShowForm(true);
  }

  function handleEdit(assembler: any) {
    setEditData(assembler);
    setShowForm(true);
  }

  function handleDelete(assembler: any) {
    setUserToDelete(assembler);
    setShowDeleteDialog(true);
  }

  function confirmDelete() {
    if (!userToDelete) return;
    setSaving(true);
    fetch(getApiUrl(`/admin/${userToDelete.id}`), {
      method: "DELETE",
      headers: { accept: "application/json", token: user.token },
    })
      .then(() => fetchAssemblers())
      .finally(() => {
        setSaving(false);
        setShowDeleteDialog(false);
        setUserToDelete(null);
      });
  }

  function handleSave(data: any) {
    setSaving(true);
    const method = editData ? "PATCH" : "POST";
    const url = editData ? getApiUrl(`/admin/${editData.id}`) : getApiUrl("/admin");
    const body = { ...data, role: "assembler" };
    if (editData && !data.password) delete body.password;
    fetch(url, {
      method,
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        token: user.token,
      },
      body: JSON.stringify(body),
    })
      .then(() => {
        setShowForm(false);
        setEditData(null);
        fetchAssemblers();
      })
      .finally(() => setSaving(false));
  }

  function handleOpenPassword(assembler: any) {
    setPasswordUser(assembler);
    setPassword("");
    setShowPasswordDialog(true);
  }

  function handleChangePassword() {
    if (!passwordUser || !password) {
      setPasswordError("La contraseña no puede estar vacía");
      return;
    }
    setPasswordLoading(true);
    fetch(getApiUrl(`/admin/${passwordUser.id}/change-password`), {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        token: user.token,
      },
      body: JSON.stringify({ password }),
    })
      .then(() => {
        setShowPasswordDialog(false);
        setPasswordUser(null);
        setPassword("");
        setPasswordError("");
      })
      .finally(() => setPasswordLoading(false));
  }

  if (loading) return <div className="px-8">Cargando armadores...</div>;
  if (error) return <div className="px-8">{error}</div>;

  return (
    <div className="px-8">
      <h1 className="text-2xl font-bold mb-6 text-purple-700 flex items-center justify-between">
        Armadores
        <button
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition"
          onClick={handleCreate}
        >
          Crear nuevo
        </button>
      </h1>
      <PersonalTable
        users={assemblers}
        onEdit={canEdit ? handleEdit : undefined}
        onDelete={canEdit ? handleDelete : undefined}
        onChangePassword={canEdit ? handleOpenPassword : undefined}
        canChangePassword={user.role === "superadmin"}
        loading={loading || saving}
      />
      <Dialog
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditData(null); }}
        title={editData ? "Editar armador" : "Crear armador"}
        isLoading={saving}
        onSave={undefined}
      >
        <AdminForm
          initialData={editData}
          onSave={handleSave}
          loading={saving}
          isEdit={!!editData}
          showRole={false}
          showPassword={true}
        />
      </Dialog>
      <Dialog
        isOpen={showPasswordDialog}
        onClose={() => { setShowPasswordDialog(false); setPasswordError(""); }}
        title="Cambiar contraseña"
        isLoading={passwordLoading}
        onSave={handleChangePassword}
        saveText="Cambiar"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nueva contraseña</label>
          <input
            type="password"
            className="block w-full border rounded px-3 py-2 mb-2"
            value={password}
            onChange={e => { setPassword(e.target.value); setPasswordError(""); }}
            minLength={6}
          />
          {passwordError && <div className="text-red-600 text-sm">{passwordError}</div>}
        </div>
      </Dialog>
      <Dialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="Eliminar armador"
        isLoading={saving}
        onSave={confirmDelete}
        saveText="Eliminar"
      >
        <div>
          ¿Seguro que deseas eliminar a <b>{userToDelete?.name}</b>?
        </div>
      </Dialog>
    </div>
  );
} 