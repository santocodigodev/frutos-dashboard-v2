"use client";
import { useEffect, useState, useCallback } from "react";
import { useUserOrRedirect } from "../../../utils/auth";
import Dialog from "../../../components/Dialog";
import AdminForm from "../administradores/AdminForm";
import PersonalTable from "../administradores/PersonalTable";
import { FiEdit, FiTrash, FiKey } from "react-icons/fi";
import { getApiUrl } from "../../../utils/api";

export default function CajerosPage() {
  const { user, loading: authLoading } = useUserOrRedirect();
  const [cashiers, setCashiers] = useState([]);
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

  const fetchCashiers = useCallback(() => {
    if (!user?.token) return;
    
    fetch(getApiUrl(`/admin?filter=role||$eq||cashier&limit=100&page=1`), {
      headers: {
        accept: "application/json",
        token: user.token,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setCashiers(Array.isArray(data.data) ? data.data : []);
        setLoading(false);
      })
      .catch(() => {
        setError("Error al cargar cajeros");
        setLoading(false);
      });
  }, [user?.token]);

  useEffect(() => {
    if (!authLoading && user?.token) {
      fetchCashiers();
    }
  }, [authLoading, fetchCashiers]);

  function handleCreate() {
    setEditData(null);
    setShowForm(true);
  }

  function handleEdit(cashier: any) {
    setEditData(cashier);
    setShowForm(true);
  }

  function handleDelete(cashier: any) {
    setUserToDelete(cashier);
    setShowDeleteDialog(true);
  }

  function confirmDelete() {
    if (!userToDelete) return;
    setSaving(true);
    fetch(getApiUrl(`/admin/${userToDelete.id}`), {
      method: "DELETE",
      headers: { accept: "application/json", token: user.token },
    })
      .then(() => fetchCashiers())
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
    const body = { ...data, role: "cashier" };
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
        fetchCashiers();
      })
      .finally(() => setSaving(false));
  }

  function handleOpenPassword(cashier: any) {
    setPasswordUser(cashier);
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

  if (loading) return <div className="px-8">Cargando cajeros...</div>;
  if (error) return <div className="px-8">{error}</div>;

  return (
    <div className="px-8">
      <h1 className="text-2xl font-bold mb-6 text-purple-700 flex items-center justify-between">
        Cajeros
        <button
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition"
          onClick={handleCreate}
        >
          Crear nuevo
        </button>
      </h1>
      <PersonalTable
        users={cashiers}
        onEdit={canEdit ? handleEdit : undefined}
        onDelete={canEdit ? handleDelete : undefined}
        onChangePassword={canEdit ? handleOpenPassword : undefined}
        canChangePassword={user.role === "superadmin"}
        loading={loading || saving}
      />
      <Dialog
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditData(null); }}
        title={editData ? "Editar cajero" : "Crear cajero"}
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
        title="Eliminar cajero"
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
