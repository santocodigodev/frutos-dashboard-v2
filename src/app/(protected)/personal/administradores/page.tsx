"use client";
import { useEffect, useState } from "react";
import { useUserOrRedirect } from "../../../utils/auth";
import Dialog from "../../../components/Dialog";
import AdminForm from "./AdminForm";
import { FiEdit, FiTrash, FiKey } from "react-icons/fi";
import PersonalTable from "./PersonalTable";
import { getApiUrl } from "../../../utils/api";

const ROLES = {
  SUPERADMIN: "superadmin",
  ADMIN: "admin",
};

export default function AdministradoresPage() {
  const user = useUserOrRedirect();
  const [admins, setAdmins] = useState([]);
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

  function fetchAdmins() {
    if (!user) return;
    let filter = "role||$eq||admin";
    if (user.role === ROLES.SUPERADMIN) {
      filter = "role||$in||admin,superadmin";
    }
    fetch(getApiUrl(`/admin?filter=${encodeURIComponent(filter)}&limit=100&page=1`), {
      headers: {
        accept: "application/json",
        token: user.token,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setAdmins(Array.isArray(data.data) ? data.data : []);
        setLoading(false);
      })
      .catch(() => {
        setError("Error al cargar administradores");
        setLoading(false);
      });
  }

  useEffect(() => {
    fetchAdmins();
    // eslint-disable-next-line
  }, [user]);

  function handleCreate() {
    setEditData(null);
    setShowForm(true);
  }

  function handleEdit(admin: any) {
    setEditData(admin);
    setShowForm(true);
  }

  function handleDelete(admin: any) {
    setUserToDelete(admin);
    setShowDeleteDialog(true);
  }

  function confirmDelete() {
    if (!userToDelete) return;
    setSaving(true);
    fetch(getApiUrl(`/admin/${userToDelete.id}`), {
      method: "DELETE",
      headers: { accept: "application/json", token: user.token },
    })
      .then(() => fetchAdmins())
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
    const body = { ...data };
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
        fetchAdmins();
      })
      .finally(() => setSaving(false));
  }

  function handleOpenPassword(admin: any) {
    setPasswordUser(admin);
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

  if (loading) return <div>Cargando administradores...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="px-8">
      <h1 className="text-2xl font-bold mb-6 text-purple-700 flex items-center justify-between">
        Administradores
        <button
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition"
          onClick={handleCreate}
        >
          Crear nuevo
        </button>
      </h1>
      <PersonalTable
        users={admins}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onChangePassword={handleOpenPassword}
        canChangePassword={user.role === ROLES.SUPERADMIN}
        loading={loading || saving}
      />
      <Dialog
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditData(null); }}
        title={editData ? "Editar usuario" : "Crear usuario"}
        isLoading={saving}
        onSave={undefined}
      >
        <AdminForm
          initialData={editData}
          onSave={handleSave}
          loading={saving}
          isEdit={!!editData}
          showRole={true}
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
        title="Eliminar usuario"
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