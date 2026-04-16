import { useState, useEffect } from "react";
import ClientCard from "../../components/clients/ClientCard";
import ClientEmptyCard from "../../components/clients/ClientEmptyCard";
import { PlusIcon } from "../../components/clients/ClientIcons";
import AddClientModal from "../../components/clients/AddClientModal";
import DeleteConfirmationModal from "../../components/clients/DeleteConfirmationModal";
import { getClients, createClient, updateClient, deleteClient } from "../../api/client";
import { useSidebar } from "../../context/SidebarContext";

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
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [userRole, setUserRole] = useState("viewer");
  const [editingClient, setEditingClient] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState({ open: false, client: null });
  const { isCollapsed } = useSidebar();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUserRole(parsed.role || "viewer");
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

  const isAdmin = userRole === "admin";

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
        instagramApiKey: formData.instagramApi || "",
        instagramAccountId: formData.instagramAccountId || "",
        tiktokApiKey: formData.tiktokApi || "",
        tiktokClientKey: formData.tiktokClientKey || "",
        tiktokClientSecret: formData.tiktokClientSecret || "",
        tiktokRefreshToken: formData.tiktokRefreshToken || "",
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
        <header className="mb-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-4xl tracking-tight text-[#191c1d] sm:text-5xl">
              <span className="font-extrabold">Client </span>
              <span className="font-medium">Directory</span>
            </h1>

            <p className="mt-3 text-base leading-8 text-[#424751] sm:text-lg">
              Manage and curate high-performance portfolios for Check Funnel
              partners. Oversee content strategy and multi-channel engagement
              across your entire network.
            </p>
          </div>
          
          {isAdmin && (
            <button
              onClick={() => setIsAddClientOpen(true)}
              className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-[linear-gradient(135deg,#003870_0%,#014f99_100%)] px-6 py-3 text-sm font-bold text-[#ffffff] shadow-lg transition hover:scale-[1.02] active:scale-95"
            >
              <PlusIcon />
              <span>Add New Client</span>
            </button>
          )}
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
          {clients.map((client) => (
            <ClientCard 
              key={client.id} 
              client={client} 
              isAdmin={isAdmin}
              onEdit={handleEditRequest}
              onDelete={handleDeleteClient}
            />
          ))}

          {isAdmin && (
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