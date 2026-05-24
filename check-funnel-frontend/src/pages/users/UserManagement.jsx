import React, { useState, useEffect } from 'react';
import UserDirectoryTable from '../../components/users/UserDirectoryTable';
import PendingUsersTable from '../../components/users/PendingUsersTable';
import CreateUserModal from '../../components/users/CreateUserModal';
import EditUserModal from '../../components/users/EditUserModal';
import UserDeleteConfirmationModal from '../../components/users/UserDeleteConfirmationModal';
import UserApproveConfirmationModal from '../../components/users/UserApproveConfirmationModal';
import UserRejectConfirmationModal from '../../components/users/UserRejectConfirmationModal';
import { createUser, getAllUsers, getPendingUsers, updateUserStatus, deleteUser, updateUser } from "../../api/user";

const UserManagement = () => {
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [userToApprove, setUserToApprove] = useState(null);
  const [userToReject, setUserToReject] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [all, pending] = await Promise.all([
        getAllUsers(),
        getPendingUsers()
      ]);
      
      // Registered table shows processed users (approved or rejected)
      const processed = all.filter(u => u.status !== 'pending');
      
      setRegisteredUsers(processed);
      setPendingUsers(pending);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = (user) => {
    setUserToApprove(user);
  };

  const confirmApprove = async () => {
    if (!userToApprove) return;
    try {
      await updateUserStatus(userToApprove.id, 'approved');
      setUserToApprove(null);
      fetchData();
    } catch (error) {
      alert("Failed to approve user");
    }
  };

  const handleReject = (user) => {
    setUserToReject(user);
  };

  const confirmReject = async () => {
    if (!userToReject) return;
    try {
      await updateUserStatus(userToReject.id, 'rejected');
      setUserToReject(null);
      fetchData();
    } catch (error) {
      alert("Failed to reject user");
    }
  };

  const handleDelete = (id) => {
    const user = registeredUsers.find(u => u.id === id);
    if (user) {
      setUserToDelete(user);
      setIsDeleteModalOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    
    try {
      await deleteUser(userToDelete.id);
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      fetchData();
    } catch (error) {
      alert("Failed to delete user");
    }
  };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (id, data) => {
    try {
      await updateUser(id, data);
      fetchData();
    } catch (error) {
      alert("Failed to update user");
    }
  };

  const handleCreateUser = async (data) => {
    try {
      await createUser(data);
      setCreatedCredentials({
        email: data.email,
        password: data.password,
      });
      fetchData();
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to create user");
      throw error;
    }
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreatedCredentials(null);
  };

  const handleExport = () => {
    if (registeredUsers.length === 0) {
      alert("No data available to export.");
      return;
    }

    // Prepare data for export
    const dataToExport = registeredUsers.map(user => ({
      "Full Name": user.fullName || "",
      "Email Address": user.email || "",
      "System Role": (user.role || "").toUpperCase(),
      "Status": (user.status || "").charAt(0).toUpperCase() + (user.status || "").slice(1),
      "Processed By": user.processedByEmail || "System"
    }));

    // CSV Conversion
    const headers = Object.keys(dataToExport[0]).join(",");
    const csvContent = dataToExport.map(row => 
      Object.values(row)
        .map(value => `"${String(value).replace(/"/g, '""')}"`)
        .join(",")
    ).join("\n");

    const csvString = `${headers}\n${csvContent}`;
    
    // Create download link
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `User_Directory_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading && registeredUsers.length === 0 && pendingUsers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px] animate-pulse">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold text-sm tracking-widest uppercase">Synchronizing Directory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-700">
      {/* Page Header */}
      <header className="mb-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <h1 className="text-4xl tracking-tight text-[#191c1d] sm:text-5xl">
            <span className="font-extrabold">User </span>
            <span className="font-medium">Management</span>
          </h1>

          <p className="mt-3 text-base leading-8 text-[#424751] sm:text-lg">
            Oversee platform access, assign roles, and approve new registration requests 
            to maintain the integrity of your marketing funnel ecosystem.
          </p>
        </div>
        
        <div className="flex flex-col gap-3 sm:flex-row xl:self-start">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-[#003870] shadow-lg ring-1 ring-slate-200 transition hover:bg-blue-50 active:scale-95"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>Create User</span>
          </button>
          <button
            onClick={handleExport}
            disabled={registeredUsers.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#003870_0%,#014f99_100%)] px-6 py-3 text-sm font-bold text-[#ffffff] shadow-lg transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M16 9l-4 4m0 0l-4-4m4 4V3" />
            </svg>
            <span>Export Directory</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-10 mt-2">
        {/* Active User Directory */}
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both">
          <UserDirectoryTable 
            users={registeredUsers} 
            onDelete={handleDelete} 
            onEdit={handleEditClick}
          />
        </div>

        {/* Pending Approvals */}
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both">
          <PendingUsersTable 
            users={pendingUsers} 
            onApprove={handleApprove} 
            onReject={handleReject} 
          />
        </div>
      </div>

      <CreateUserModal
        open={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onCreate={handleCreateUser}
        createdCredentials={createdCredentials}
      />

      <EditUserModal 
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleUpdate}
        user={selectedUser}
      />

      <UserDeleteConfirmationModal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        userName={userToDelete ? userToDelete.fullName : ""}
      />

      <UserApproveConfirmationModal
        open={!!userToApprove}
        onClose={() => setUserToApprove(null)}
        onConfirm={confirmApprove}
        userName={userToApprove ? userToApprove.fullName : ""}
      />

      <UserRejectConfirmationModal
        open={!!userToReject}
        onClose={() => setUserToReject(null)}
        onConfirm={confirmReject}
        userName={userToReject ? userToReject.fullName : ""}
      />
    </div>
  );
};

export default UserManagement;
