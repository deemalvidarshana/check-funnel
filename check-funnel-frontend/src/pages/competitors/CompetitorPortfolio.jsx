import React, { useState, useEffect } from 'react';
import PortfolioCard from '../../components/competitors/PortfolioCard';
import PlatformLinksModal from '../../components/competitors/PlatformLinksModal';
import { getClients, updateClient } from '../../api/client';
import { useSidebar } from '../../context/SidebarContext';
import { canManageFeature } from '../../utils/permissions';

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const borderColor = type === "success" ? "border-[#0f3d91]" : "border-[#191c1d]";
  const iconColor = type === "success" ? "text-[#0f3d91]" : "text-[#191c1d]";

  return (
    <div className={`fixed top-6 right-6 z-[300] flex items-center gap-3 px-4 py-3 rounded-xl bg-white border-l-4 ${borderColor} shadow-xl animate-in slide-in-from-top-4 duration-300`}>
      <div className={iconColor}>
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

export default function CompetitorPortfolio() {
  const [clients, setClients] = useState([]);
  const [editingLinksClient, setEditingLinksClient] = useState(null);
  const [savingLinks, setSavingLinks] = useState(false);
  const [toast, setToast] = useState(null);
  const { isCollapsed } = useSidebar();
  const canEditPlatformLinks = canManageFeature('clients');

  useEffect(() => {
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

  const handleSavePlatformLinks = async (links) => {
    if (!editingLinksClient) return;

    setSavingLinks(true);
    try {
      const updatedClient = await updateClient(editingLinksClient.id, links);
      setClients((prev) => prev.map((client) => (
        client.id === updatedClient.id ? updatedClient : client
      )));
      setEditingLinksClient(null);
      setToast({ message: 'Platform links saved successfully!', type: 'success' });
    } catch (error) {
      console.error('Failed to save platform links', error);
      setToast({ message: 'Failed to save platform links.', type: 'error' });
    } finally {
      setSavingLinks(false);
    }
  };

  return (
    <section className="w-full bg-[#f8f9fa] pb-24">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header Section */}
      <header className="mb-10">
        <h1 className="text-4xl tracking-tight text-[#191c1d] sm:text-5xl mb-4">
          <span className="font-extrabold">Competitor Analysis </span>
          <span className="font-medium">Portfolio</span>
        </h1>
        <p className="text-base leading-8 text-[#424751] sm:text-lg max-w-2xl">
          Select a client to view their dedicated competitor intelligence dashboard and market positioning data.
        </p>
      </header>

      <div 
        className={`grid gap-8 transition-all duration-500 ease-in-out ${
          isCollapsed 
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
            : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        }`}
      >
        {clients.map((client) => (
            <PortfolioCard
              key={client.id}
              id={client.id}
              name={client.name}
              category={client.shortDescription}
              facebookUrl={client.facebookUrl}
              instagramUrl={client.instagramUrl}
              tiktokUrl={client.tiktokUrl}
              logo={client.logo}
              isActive={true}
              canEditLinks={canEditPlatformLinks}
              onEditLinks={() => setEditingLinksClient(client)}
            />
          ))}
      </div>

      <PlatformLinksModal
        key={editingLinksClient?.id || 'platform-links-modal'}
        open={Boolean(editingLinksClient)}
        client={editingLinksClient}
        saving={savingLinks}
        onClose={() => setEditingLinksClient(null)}
        onSave={handleSavePlatformLinks}
      />
    </section>
  );
}
