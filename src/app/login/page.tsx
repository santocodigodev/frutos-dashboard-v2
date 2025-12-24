"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import LoadingDialog from "../components/LoadingDialog";
import { getApiUrl } from "../utils/api";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(getApiUrl("/admin/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json", accept: "*/*" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        setError("Correo o contraseña incorrectos.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      localStorage.setItem("user", JSON.stringify(data));
      router.push("/");
    } catch (err) {
      setError("Error de conexión. Intenta de nuevo.");
      setLoading(false);
    }
  }

  return (
    <>
      {loading && <LoadingDialog text="Iniciando sesión..." />}
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg flex flex-col items-center">
        <Image src="/assets/logo.png" alt="Logo" width={60} height={60} className="mb-4" />
        <h1 className="text-3xl font-bold mb-2 text-purple-700">ZN Frutos congelados</h1>
        <h2 className="text-xxl text-gray-500">Administrador</h2>
        <h2 className="text-xl mb-6 text-gray-500">Inicio de sesión</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-80">
          <label>
            <p className="text-gray-500">Email</p>
            <input
              type="email"
              className="w-full border rounded px-2 py-1 mt-1 text-black"
              placeholder="ejemplo@znfrutas.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            <p className="text-gray-500">Contraseña</p>
            <input
              type="password"
              className="w-full border rounded px-2 py-1 mt-1 text-black"
              placeholder="********"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </label>
          <button
            type="submit"
            className="bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition"
          >
            ENTRAR
          </button>
          {error && <div className="text-red-600 text-sm">{error}</div>}
        </form>
      </div>
    </>
  );
}
