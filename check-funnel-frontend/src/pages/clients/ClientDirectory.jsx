import { useState, useEffect } from "react";
import ClientCard from "../../components/clients/ClientCard";
import ClientEmptyCard from "../../components/clients/ClientEmptyCard";
import { PlusIcon } from "../../components/clients/ClientIcons";
import AddClientModal from "../../components/clients/AddClientModal";
import DeleteConfirmationModal from "../../components/clients/DeleteConfirmationModal";
import { getClients, createClient, updateClient, deleteClient } from "../../api/client";
import { getAllUsers, getAssignableUsers } from "../../api/user";
import { useSidebar } from "../../context/SidebarContext";
import { canManageFeature } from "../../utils/permissions";
import { Users } from "lucide-react";

function FilterChevronIcon({ isOpen }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`text-[#727782] transition-transform ${isOpen ? "rotate-180" : ""}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function ResponsibleFilterDropdown({ value, options, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const allOptions = [{ value: "all", label: "All Clients" }, ...options];
  const selectedLabel = allOptions.find((option) => option.value === value)?.label || "All Clients";

  return (
    <div className="relative w-full sm:w-auto">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-center justify-between gap-2 rounded-full border border-[#c2c6d3]/20 bg-[#f3f4f5]/50 px-4 py-2 transition hover:bg-[#f3f4f5] sm:w-auto sm:justify-start sm:px-5"
      >
        <Users className="h-[17px] w-[17px] flex-shrink-0 text-[#003870]" strokeWidth={2.5} />
        <span className="truncate text-base font-bold text-[#003870]">{selectedLabel}</span>
        <FilterChevronIcon isOpen={isOpen} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 max-h-60 w-48 overflow-y-auto rounded-2xl border border-[#c2c6d3]/20 bg-white py-2 shadow-xl animate-in fade-in slide-in-from-top-1 duration-200 no-scrollbar sm:right-0">
          {allOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full truncate px-4 py-3 text-left text-sm font-bold transition hover:bg-[#f3f4f5] ${
                option.value === value ? "bg-[#003870]/5 text-[#003870]" : "text-[#727782]"
              }`}
              title={option.label}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------- Toast Component ----------------
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const borderColor = type === "success" ? "border-[#0f3d91]" : "border-[#191c1d]";
  const iconColor = type === "success" ? "text-[#0f3d91]" : "text-[#191c1d]";

  return (
    <div className={`fixed top-6 right-6 z-[300] flex items-center gap-3 px-4 py-3 rounded-xl bg-white border-l-4 ${borderColor} shadow-xl animate-in slide-in-from-top-4 duration-300`}>
       <div className={`${iconColor}`}>
         {type === "success" ? (
           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
           </svg>
         ) : (
           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
           </svg>
         )}
       </div>
       <p className="text-sm font-semibold text-slate-700 tracking-tight">{message}</p>
    </div>
  );
}

export default function ClientDirectory() {
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [responsibleFilter, setResponsibleFilter] = useState("all");
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState({ open: false, client: null });
  const { isCollapsed } = useSidebar();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setCurrentUser(parsed);
      } catch (e) {
        console.error("Failed to parse user role", e);
      }
    }

    async function loadClients() {
      try {
        const fetchClients = await getClients();
        setClients(fetchClients);
      } catch (error) {
        console.error("Failed to load clients", error);
      }
    }
    loadClients();
  }, []);

  const canManageClients = canManageFeature("clients", currentUser);

  useEffect(() => {
    if (!canManageClients) return;

    async function loadUsers() {
      try {
        const fetchedUsers = currentUser?.role === "admin"
          ? await getAllUsers()
          : await getAssignableUsers();
        setUsers(fetchedUsers);
      } catch {
        setUsers([]);
      }
    }

    loadUsers();
  }, [canManageClients, currentUser?.role]);

  const responsibleFilterOptions = clients.reduce((options, client) => {
    if (!client.responsiblePersonName) return options;

    const value = client.responsiblePersonId
      ? String(client.responsiblePersonId)
      : client.responsiblePersonName;

    if (!options.some((option) => option.value === value)) {
      options.push({ value, label: client.responsiblePersonName });
    }

    return options;
  }, []);

  const visibleClients = responsibleFilter === "all"
    ? clients
    : clients.filter((client) => {
        const value = client.responsiblePersonId
          ? String(client.responsiblePersonId)
          : client.responsiblePersonName;

        return value === responsibleFilter;
      });

  const handleCreateOrUpdateClient = async (formData, clientId) => {
    try {
      const activeChannels = [];
      if (formData.facebook) activeChannels.push("facebook");
      if (formData.instagram) activeChannels.push("instagram");
      if (formData.tiktok) activeChannels.push("tiktok");

      const hashtagsArray = formData.hashtags 
        ? formData.hashtags.split(" ").filter(h => h) 
        : [];

      const payload = {
        name: formData.clientName || "New Client",
        shortDescription: formData.description || "No description added yet.",
        monthlyTargetPosts: Number(formData.monthlyTarget) || 0,
        contactEmail: formData.email || "no-email@client.com",
        contactPhone: formData.phone || "Not provided",
        activeChannels: JSON.stringify(activeChannels),
        hashtags: JSON.stringify(hashtagsArray),
        facebookApiKey: formData.facebookApi || "",
        facebookPageId: formData.facebookPageId || "",
        metaAdAccountId: formData.metaAdAccountId || "",
        metaAdsAccessToken: formData.metaAdsAccessToken || "",
        instagramApiKey: formData.instagramApi || "",
        instagramAccountId: formData.instagramAccountId || "",
        responsiblePersonId: formData.responsiblePersonId || "",
        responsiblePersonName: formData.responsiblePersonName || "",
        tiktokApiKey: formData.tiktokApi || "",
        tiktokClientKey: formData.tiktokClientKey || "",
        tiktokClientSecret: formData.tiktokClientSecret || "",
        tiktokRefreshToken: formData.tiktokRefreshToken || "",
        googleAnalyticsAccountId: formData.googleAnalyticsAccountId || "",
        googleAnalyticsAccountName: formData.googleAnalyticsAccountName || "",
        googleAnalyticsPropertyId: formData.googleAnalyticsPropertyId || "",
        googleAnalyticsPropertyName: formData.googleAnalyticsPropertyName || "",
      };


      if (formData.logo) {
        payload.logo = formData.logo;
      }
      
      if (clientId) {
        // Update Mode
        const updated = await updateClient(clientId, payload);
        setClients(prev => prev.map(c => c.id === clientId ? updated : c));
        setToast({ message: "Client updated successfully!", type: "success" });
      } else {
        // Create Mode
        const created = await createClient(payload);
        setClients(prev => [created, ...prev]);
        setToast({ message: "Client created successfully!", type: "success" });
      }
      setEditingClient(null);
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || "Failed to process request";
      setToast({ message: errorMsg, type: "error" });
    }
  };

  const handleEditRequest = (client) => {
    setEditingClient(client);
    setIsAddClientOpen(true);
  };

  const handleDeleteClient = (client) => {
    setDeleteConfirmation({ open: true, client });
  };

  const handleConfirmDelete = async () => {
    const { client } = deleteConfirmation;
    if (!client) return;

    try {
      await deleteClient(client.id);
      setClients(prev => prev.filter(c => c.id !== client.id));
      setToast({ message: "Client deleted successfully", type: "success" });
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || "Failed to delete client";
      setToast({ message: errorMsg, type: "error" });
    } finally {
      setDeleteConfirmation({ open: false, client: null });
    }
  };

  return (
    <>
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
      <section className="w-full bg-[#f8f9fa]">
        <header className="mb-10 grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
          <div className="min-w-0 max-w-3xl">
            <h1 className="text-3xl tracking-tight text-[#191c1d] min-[420px]:text-4xl xl:text-[40px] 2xl:text-5xl">
              <span className="font-extrabold">Client </span>
              <span className="font-medium">Directory</span>
            </h1>

            <p className="mt-3 text-base leading-8 text-[#424751] sm:text-lg">
              Manage and curate high-performance portfolios for Check Funnel
              partners. Oversee content strategy and multi-channel engagement
              across your entire network.
            </p>
          </div>
          
          <div className="flex w-full flex-col items-start gap-3 xl:w-auto xl:items-end">
            {canManageClients && (
              <button
                onClick={() => setIsAddClientOpen(true)}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 self-start whitespace-nowrap rounded-full bg-[linear-gradient(135deg,#003870_0%,#014f99_100%)] px-5 text-sm font-bold text-[#ffffff] shadow-lg transition hover:scale-[1.02] active:scale-95 xl:self-end"
              >
                <PlusIcon />
                <span>Add New Client</span>
              </button>
            )}

            <ResponsibleFilterDropdown
              value={responsibleFilter}
              options={responsibleFilterOptions}
              onChange={setResponsibleFilter}
            />
          </div>
        </header>

        {/* 
            Responsive Grid Logic:
            - Default: 1 column
            - md: 2 columns
            - lg: 3 columns
            - If Sidebar is Collapsed AND screen is large (xl), allow 4 columns to prevent 'fat' cards.
        */}
        <div 
          className={`grid gap-8 transition-all duration-500 ease-in-out ${
            isCollapsed 
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
              : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {visibleClients.map((client) => (
            <ClientCard 
              key={client.id} 
              client={client} 
              isAdmin={canManageClients}
              onEdit={handleEditRequest}
              onDelete={handleDeleteClient}
            />
          ))}

          {canManageClients && (
            <div onClick={() => setIsAddClientOpen(true)}>
              <ClientEmptyCard />
            </div>
          )}
        </div>
      </section>

      <AddClientModal
        open={isAddClientOpen}
        onClose={() => {
          setIsAddClientOpen(false);
          setEditingClient(null);
        }}
        onCreate={handleCreateOrUpdateClient}
        initialData={editingClient}
        users={users}
      />

      <DeleteConfirmationModal
        open={deleteConfirmation.open}
        clientName={deleteConfirmation.client?.name}
        onClose={() => setDeleteConfirmation({ open: false, client: null })}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
