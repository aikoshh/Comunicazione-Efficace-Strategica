// components/AdminScreen.tsx
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { databaseService } from '../services/databaseService';
import { COLORS } from '../constants';
import { BackIcon } from './Icons';

interface AdminScreenProps {
  onBack: () => void;
}

const AdminScreen: React.FC<AdminScreenProps> = ({ onBack }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    setUsers(databaseService.getAllUsers());
  }, []);

  const handleSave = () => {
    if (editingUser) {
      databaseService.updateUser(editingUser);
      setUsers(databaseService.getAllUsers()); // Refresh list
      setEditingUser(null);
    }
  };

  const handleEditChange = (field: keyof User, value: any) => {
    if (editingUser) {
        // Special handling for boolean 'enabled'
        if (field === 'enabled' || field === 'isAdmin') {
             setEditingUser({ ...editingUser, [field]: value === 'true' });
        } else {
            setEditingUser({ ...editingUser, [field]: value });
        }
    }
  };

  const tableStyles: { [key: string]: React.CSSProperties } = {
    'th, td': { padding: '12px 15px', borderBottom: `1px solid ${COLORS.divider}`, textAlign: 'left' },
    'thead tr': { backgroundColor: COLORS.cardDark },
    'th': { fontWeight: 600 }
  };

  return (
    <div style={styles.container}>
      <style>{`
        #admin-table th, #admin-table td {
            padding: 12px 15px;
            border-bottom: 1px solid ${COLORS.divider};
            text-align: left;
        }
        #admin-table thead tr {
            background-color: ${COLORS.cardDark};
        }
        #admin-table th {
            font-weight: 600;
        }
      `}</style>
      <button onClick={onBack} style={styles.backButton}>
        <BackIcon /> Torna all'App
      </button>
      <h1 style={styles.title}>Pannello di Amministrazione</h1>
      
      {editingUser ? (
        <div style={styles.editForm}>
          <h2 style={styles.editTitle}>Modifica Utente: {editingUser.email}</h2>
          <div style={styles.inputGroup}>
            <label>Nome:</label>
            <input style={styles.input} type="text" value={editingUser.firstName} onChange={(e) => handleEditChange('firstName', e.target.value)} />
          </div>
          <div style={styles.inputGroup}>
            <label>Cognome:</label>
            <input style={styles.input} type="text" value={editingUser.lastName} onChange={(e) => handleEditChange('lastName', e.target.value)} />
          </div>
          <div style={styles.inputGroup}>
            <label>Data Scadenza:</label>
            <input style={styles.input} type="text" value={editingUser.expiryDate || ''} onChange={(e) => handleEditChange('expiryDate', e.target.value)} placeholder="YYYY-MM-DDTHH:MM:SS.sssZ"/>
          </div>
          <div style={styles.inputGroup}>
            <label>Admin:</label>
            <select style={styles.select} value={String(editingUser.isAdmin)} onChange={(e) => handleEditChange('isAdmin', e.target.value)}>
                <option value="true">Sì</option>
                <option value="false">No</option>
            </select>
          </div>
           <div style={styles.inputGroup}>
            <label>Abilitato:</label>
            <select style={styles.select} value={String(editingUser.enabled)} onChange={(e) => handleEditChange('enabled', e.target.value)}>
                <option value="true">Sì</option>
                <option value="false">No</option>
            </select>
          </div>
          <div style={styles.buttonGroup}>
            <button onClick={handleSave} style={styles.saveButton}>Salva</button>
            <button onClick={() => setEditingUser(null)} style={styles.cancelButton}>Annulla</button>
          </div>
        </div>
      ) : (
        <div style={styles.tableContainer}>
          <table id="admin-table" style={styles.table}>
            <thead>
              <tr>
                <th>Email</th>
                <th>Nome</th>
                <th>Scadenza</th>
                <th>Admin</th>
                <th>Abilitato</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.email}>
                  <td>{user.email}</td>
                  <td>{user.firstName} {user.lastName}</td>
                  <td>{user.expiryDate ? new Date(user.expiryDate).toLocaleDateString() : 'N/A'}</td>
                  <td>{user.isAdmin ? '✔️' : '❌'}</td>
                  <td>{user.enabled ? '✔️' : '❌'}</td>
                  <td>
                    <button onClick={() => setEditingUser(user)} style={styles.editButton}>Modifica</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: { maxWidth: '1200px', margin: '0 auto', padding: '40px 20px', minHeight: '100vh', backgroundColor: COLORS.base },
    title: { fontSize: '28px', color: COLORS.primary, marginBottom: '24px' },
    backButton: { display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: `1px solid ${COLORS.divider}`, borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '15px', color: COLORS.textSecondary, marginBottom: '24px' },
    tableContainer: { overflowX: 'auto', backgroundColor: COLORS.card, borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
    table: { width: '100%', borderCollapse: 'collapse' },
    editForm: { backgroundColor: COLORS.card, padding: '24px', borderRadius: '8px', marginBottom: '24px' },
    editTitle: { marginTop: 0, color: COLORS.textPrimary },
    inputGroup: { marginBottom: '16px', display: 'flex', flexDirection: 'column' },
    input: { padding: '8px', borderRadius: '4px', border: `1px solid ${COLORS.divider}`},
    select: { padding: '8px', borderRadius: '4px', border: `1px solid ${COLORS.divider}`},
    buttonGroup: { display: 'flex', gap: '12px', marginTop: '24px' },
    saveButton: { backgroundColor: COLORS.success, color: 'white', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer' },
    cancelButton: { backgroundColor: COLORS.textSecondary, color: 'white', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer' },
    editButton: { backgroundColor: COLORS.secondary, color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' },
};

export default AdminScreen;
