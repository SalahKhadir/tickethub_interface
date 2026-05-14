"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ROLES } from "@/constants/roles";
import toast from "react-hot-toast";
import api from "@/services/api";
import { UserCheck, X, Plus, CheckCircle, Clock } from "lucide-react";

const TABS = ["Pending Approvals", "All Users"];
const BASE = "http://localhost:8080";

const ROLE_OPTIONS = [
    { value: "CLIENT",     label: "Client" },
    { value: "TECHNICIAN", label: "Technician" },
];

const parseError = (err) => {
    if (err?.response?.status === 403) return "Accès refusé : Droits insuffisants (ROLE_ADMIN requis).";
    if (err?.response?.status === 401) return "Session expirée. Veuillez vous reconnecter.";
    return err?.response?.data?.message || err?.message || "Une erreur est survenue.";
};

const roleBadge = (roles) => {
    const raw = Array.isArray(roles) ? roles[0] : roles;
    const r = String(raw || "").toUpperCase().replace("ROLE_", "");
    const map = {
        ADMIN:      "bg-purple-100 text-purple-700 border border-purple-200",
        TECHNICIAN: "bg-blue-100 text-blue-700 border border-blue-200",
        TECH:       "bg-blue-100 text-blue-700 border border-blue-200",
        CLIENT:     "bg-emerald-100 text-emerald-700 border border-emerald-200",
    };
    return (
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${map[r] || "bg-gray-100 text-gray-500 border border-gray-200"}`}>
            {r || "UNKNOWN"}
        </span>
    );
};

function CreateUserModal({ onClose, onCreated }) {
    const [form, setForm] = useState({ nom: "", prenom: "", tel: "", email: "", password: "", retypePassword: "", role: "CLIENT" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password !== form.retypePassword) {
            setError("Les mots de passe ne correspondent pas.");
            return;
        }
        setLoading(true);
        setError("");
        try {
            await api.post(`${BASE}/api/admin/users`, {
                nom: form.nom,
                prenom: form.prenom,
                tel: form.tel,
                email: form.email,
                password: form.password,
                retypePassword: form.retypePassword,
                role: form.role,
            });
            toast.success("Utilisateur créé avec succès.");
            onCreated();
        } catch (err) {
            setError(parseError(err));
        } finally {
            setLoading(false);
        }
    };

    const field = (label, name, type = "text", placeholder = "") => (
        <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">{label}</label>
            <input
                type={type}
                value={form[name]}
                onChange={(e) => setForm((p) => ({ ...p, [name]: e.target.value }))}
                placeholder={placeholder}
                required
                className="h-10 rounded-xl border border-gray-200 px-3 text-sm text-gray-800 focus:border-blue-400 focus:outline-none bg-white"
            />
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
                    <h2 className="text-base font-bold text-gray-900">Ajouter un Utilisateur</h2>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 transition">
                        <X size={16} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        {field("Nom",    "nom",    "text", "Dupont")}
                        {field("Prénom", "prenom", "text", "Jean")}
                    </div>
                    {field("Téléphone",              "tel",            "text",     "0612345678")}
                    {field("Email",                  "email",          "email",    "jean@company.com")}
                    {field("Mot de passe",            "password",       "password", "••••••••")}
                    {field("Confirmer mot de passe",  "retypePassword", "password", "••••••••")}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-600">Rôle</label>
                        <select
                            value={form.role}
                            onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                            className="h-10 rounded-xl border border-gray-200 px-3 text-sm text-gray-800 focus:border-blue-400 focus:outline-none bg-white"
                        >
                            {ROLE_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>
                    {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">{error}</p>}
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                            Annuler
                        </button>
                        <button type="submit" disabled={loading}
                            className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50">
                            {loading ? "Création…" : "Créer"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function AdminUsersPage() {
    const router = useRouter();
    const { user, loading: authLoading, isAuthenticated } = useAuth();
    const [tab, setTab]                 = useState(0);
    const [pending, setPending]         = useState([]);
    const [allUsers, setAllUsers]       = useState([]);
    const [loading, setLoading]         = useState(false);
    const [error, setError]             = useState("");
    const [approvingId, setApprovingId] = useState(null);
    const [showModal, setShowModal]     = useState(false);

    const isAdmin = String(user?.role || "").toLowerCase() === ROLES.ADMIN;

    useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated || !isAdmin) router.replace("/login");
    }, [authLoading, isAuthenticated, isAdmin, router]);

    const loadPending = useCallback(async () => {
        setLoading(true); setError("");
        try {
            const { data } = await api.get(`${BASE}/api/admin/users/pending`);
            setPending(Array.isArray(data) ? data : data?.content ?? []);
        } catch (err) { setError(parseError(err)); }
        finally { setLoading(false); }
    }, []);

    const loadAllUsers = useCallback(async () => {
        setLoading(true); setError("");
        try {
            const { data } = await api.get(`${BASE}/api/admin/users`);
            const list = Array.isArray(data) ? data : data?.content ?? [];
            console.log("[AllUsers] sample record:", list[0]);
            setAllUsers(list);
        } catch (err) { setError(parseError(err)); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        if (!isAdmin) return;
        if (tab === 0) loadPending(); else loadAllUsers();
    }, [tab, isAdmin, loadPending, loadAllUsers]);

    const handleApprove = async (id) => {
        setApprovingId(id);
        try {
            await api.post(`${BASE}/api/admin/users/${id}/approve`);
            setPending((prev) => prev.filter((u) => u.id !== id));
            toast.success("Compte approuvé avec succès.");
        } catch (err) {
            setError(parseError(err));
        } finally { setApprovingId(null); }
    };

    if (authLoading || (!isAuthenticated && !isAdmin)) return null;

    const thClass = "px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider";
    const tdClass = "px-4 py-3 text-sm text-gray-800";

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Gestion des Utilisateurs</h1>
                    <p className="mt-1 text-sm text-gray-500">Approbation des inscriptions et gestion des comptes</p>
                </div>
                {tab === 1 && (
                    <button onClick={() => setShowModal(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 hover:shadow-md transition">
                        <Plus size={16} /> Ajouter un Utilisateur
                    </button>
                )}
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 flex items-center gap-2">
                    <span className="font-bold">!</span> {error}
                </div>
            )}

            <div className="flex gap-1 border-b border-gray-200">
                {TABS.map((t, i) => (
                    <button key={t} onClick={() => setTab(i)}
                        className={`px-5 py-2.5 text-sm font-medium transition-colors relative ${
                            tab === i
                                ? "text-blue-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600"
                                : "text-gray-500 hover:text-gray-800"
                        }`}>
                        {t}
                        {i === 0 && pending.length > 0 && (
                            <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                                {pending.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <p className="px-6 py-10 text-sm text-gray-400 text-center">Chargement…</p>
                ) : tab === 0 ? (
                    pending.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                            <CheckCircle size={36} className="mb-3 text-green-400" />
                            <p className="text-sm">Aucune approbation en attente.</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className={thClass}>Nom</th>
                                    <th className={thClass}>Email</th>
                                    <th className={thClass}>Téléphone</th>
                                    <th className={thClass}>Rôle</th>
                                    <th className={thClass}>Inscription</th>
                                    <th className={thClass}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pending.map((u) => (
                                    <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50 transition">
                                        <td className={tdClass}>{u.prenom} {u.nom}</td>
                                        <td className={tdClass}>{u.email}</td>
                                        <td className={tdClass}>{u.tel || "—"}</td>
                                        <td className={tdClass}>{roleBadge(u.roles || u.role)}</td>
                                        <td className={`${tdClass} text-gray-400 text-xs`}>
                                            <span className="flex items-center gap-1">
                                                <Clock size={12} />
                                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                                            </span>
                                        </td>
                                        <td className={tdClass}>
                                            <button
                                                onClick={() => handleApprove(u.id)}
                                                disabled={approvingId === u.id}
                                                className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition disabled:opacity-50"
                                            >
                                                <UserCheck size={13} />
                                                {approvingId === u.id ? "Approbation…" : "Approuver"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )
                ) : (
                    allUsers.length === 0 ? (
                        <p className="px-6 py-10 text-sm text-gray-400 text-center">Aucun utilisateur trouvé.</p>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className={thClass}>Nom</th>
                                    <th className={thClass}>Email</th>
                                    <th className={thClass}>Rôle</th>
                                    <th className={thClass}>Statut</th>
                                    <th className={thClass}>Inscription</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allUsers.map((u) => {
                                    const fullName =
                                        u.fullName ||
                                        [u.prenom, u.nom].filter(Boolean).join(" ") ||
                                        u.username ||
                                        u.email ||
                                        "—";
                                    const roleVal = u.roles || u.role || u.userRole || u.authority;
                                    // enabled: true/false, or derive from status string
                                    const isEnabled =
                                        typeof u.enabled === "boolean" ? u.enabled :
                                        typeof u.active  === "boolean" ? u.active  :
                                        String(u.status || "").toUpperCase() === "ACTIVE";
                                    const joined = u.createdAt || u.registeredAt || u.joinedAt;
                                    return (
                                        <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50 transition">
                                            <td className={tdClass}>{fullName}</td>
                                            <td className={tdClass}>{u.email || "—"}</td>
                                            <td className={tdClass}>{roleBadge(roleVal)}</td>
                                            <td className={tdClass}>
                                                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                                    isEnabled ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                                                }`}>
                                                    {isEnabled ? "Actif" : "En attente"}
                                                </span>
                                            </td>
                                            <td className={`${tdClass} text-gray-400 text-xs`}>
                                                {joined ? new Date(joined).toLocaleDateString() : "—"}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )
                )}
            </div>

            {showModal && (
                <CreateUserModal
                    onClose={() => setShowModal(false)}
                    onCreated={() => { setShowModal(false); loadAllUsers(); }}
                />
            )}
        </div>
    );
}
