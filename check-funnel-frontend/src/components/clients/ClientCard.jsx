import { Link } from "react-router-dom";
import {
  SocialLeaderboardIcon,
  PhotoIcon,
  VideoIcon,
  MailIcon,
  PhoneIcon,
  EditIcon,
  TrashIcon,
} from "./ClientIcons";

function PriorityBadge({ value }) {
  const styles = {
    "High Priority": "bg-[#7e8cfe]/20 text-[#071991]",
    Standard: "bg-[#e1e3e4] text-[#424751]",
    Seasonal: "bg-[#ffdbcb] text-[#793100]",
    Enterprise: "bg-[#7e8cfe]/20 text-[#071991]",
    "Influencer Focus": "bg-[#e1e3e4] text-[#424751]",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        styles[value] || "bg-[#e1e3e4] text-[#424751]"
      }`}
    >
      {value}
    </span>
  );
}

export default function ClientCard({ client, isAdmin, onEdit, onDelete }) {
  return (
    <article className="group/card relative flex min-h-[430px] flex-col rounded-3xl border border-[#c2c6d3] bg-[#ffffff] p-6 shadow-[0_20px_50px_rgba(25,28,29,0.04)] transition hover:-translate-y-1">
      {/* Admin Actions Overlay */}
      {isAdmin && (
        <div className="absolute right-4 top-4 z-10 flex gap-2 transition-opacity lg:opacity-0 lg:group-hover/card:opacity-100 opacity-100">
          <button
            onClick={(e) => {
              e.preventDefault();
              onEdit(client);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#003870] shadow-md border border-slate-100 transition hover:bg-[#003870] hover:text-white"
            title="Edit Client"
          >
            <EditIcon />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              onDelete(client);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#003870] shadow-md border border-slate-100 transition hover:bg-[#003870] hover:text-white"
            title="Delete Client"
          >
            <TrashIcon />
          </button>
        </div>
      )}

      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="h-14 w-14 overflow-hidden rounded-full border border-[#c2c6d3] bg-[#edeeef]">
          <img
            src={`http://localhost:3000/clients/${client.id}/logo`}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://via.placeholder.com/200x200.png?text=Logo";
            }}
            alt={client.name}
            className="h-full w-full object-cover"
          />
        </div>

        <div className={`hidden lg:flex items-center gap-2 text-[#4553c1] transition-all duration-300 ${isAdmin ? "group-hover/card:opacity-0 group-hover/card:invisible" : ""}`}>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f3f4f5]">
            <SocialLeaderboardIcon />
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f3f4f5]">
            <PhotoIcon />
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f3f4f5]">
            <VideoIcon />
          </span>
        </div>
      </div>

      <h3 className="text-2xl font-bold leading-tight text-[#191c1d]">
        {client.name}
      </h3>

      <p className="mt-3 line-clamp-2 text-sm leading-7 text-[#424751]">
        {client.shortDescription || "No description provided."}
      </p>

      <div className="mt-6 flex items-center justify-between rounded-2xl bg-[#f3f4f5] p-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#727782]">
            Monthly Target
          </p>
          <p className="mt-2 text-3xl font-extrabold text-[#003870]">
            {client.monthlyTargetPosts || 0}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs font-medium text-[#727782]">Posts / Reels</p>
          <div className="mt-2">
            <PriorityBadge value={client.priority || "Standard"} />
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3 text-sm text-[#424751]">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f3f4f5] text-[#727782]">
            <MailIcon />
          </span>
          <span className="truncate">{client.contactEmail}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f3f4f5] text-[#727782]">
            <PhoneIcon />
          </span>
          <span>{client.contactPhone || "Not provided"}</span>
        </div>
      </div>

      <Link
        to={`/clients/${client.id}/insights`}
        state={{ client }}
        className="mt-6 inline-flex items-center justify-center rounded-full border border-[#c2c6d3] px-5 py-3 text-sm font-bold text-[#003870] transition hover:bg-[#e7e8e9]"
      >
        View Curator Insights
      </Link>
    </article>
  );
}