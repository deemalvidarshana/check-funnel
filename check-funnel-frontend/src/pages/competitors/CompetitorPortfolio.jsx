import React, { useState, useEffect } from 'react';
import PortfolioCard from '../../components/competitors/PortfolioCard';
import { getClients } from '../../api/client';
import { useSidebar } from '../../context/SidebarContext';
export default function CompetitorPortfolio() {
  const [clients, setClients] = useState([]);
  const { isCollapsed } = useSidebar();

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

  return (
    <section className="w-full bg-[#f8f9fa] pb-24">
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
        {clients.map((client) => {
          let trackedCount = 5;
          try {
            const channels = JSON.parse(client.activeChannels || "[]");
            if (Array.isArray(channels)) {
              trackedCount = channels.length * 2 + 5;
            }
          } catch (e) {
            // fallback to default
          }

          return (
            <PortfolioCard
              key={client.id}
              id={client.id}
              name={client.name}
              category={client.shortDescription}
              competitorsTracked={trackedCount}
              logo={client.logo}
              isActive={true}
            />
          );
        })}
      </div>
    </section>
  );
}
