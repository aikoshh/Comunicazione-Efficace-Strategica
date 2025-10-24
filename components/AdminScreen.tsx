import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';
import { userService } from '../services/userService';
import { COLORS } from '../constants';
import { useToast } from '../hooks/useToast';
import { Spinner } from './Loader';
import { DownloadIcon, UploadIcon, CloseIcon } from './Icons';

interface AdminScreenProps {
  onBack: () => void;
}

const UserRow: React.FC<{ user: UserProfile, onSave: (uid: string, data: Partial<UserProfile>) => void, onDelete: (uid:string) => void }> = ({ user, onSave, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [userData, setUserData] = useState(user);

    const handleSave = () => {
        onSave(user.uid, userData);
        setIsEditing(false);
    };

    const expiryDateForInput = userData.expiryDate ? userData.expiryDate.split('T')[0] : '';
    
    return (
        <tr style={styles.tableRow}>
            <td>{isEditing ? <input style={styles.tableInput} value={userData.firstName} onChange={e => setUserData({...userData, firstName: e.target.value})} /> : user.firstName}</td>
            <td>{isEditing ? <input style={styles.tableInput} value={userData.lastName} onChange={e => setUserData({...userData, lastName: e.target.value})} /> : user.lastName}</td>
            <td>{user.email}</td>
            <td>{isEditing ? <input style={styles.tableInput} type="date" value={expiryDateForInput} onChange={e => setUserData({...userData, expiryDate: e.target.value ? new Date(e.target.value).toISOString() : null})} /> : (user.expiryDate ? new Date(user.expiryDate).toLocaleDateString() : 'N/A')}</td>
            <td>
                {isEditing ? (
                    <select style={styles.tableInput} value={String(userData.enabled)} onChange={e => setUserData({...userData, enabled: e.target.value === 'true'})}>
                        <option value="true">Sì</option>
                        <option value="false">No</option>
                    </select>
                ) : (user.enabled ? 'Sì' : 'No')}
            </td>
            <td>
                {isEditing ? (
                    <select style={styles.tableInput} value={String(userData.isAdmin)} onChange={e => setUserData({...userData, isAdmin: e.target.value === 'true'})}>
                        <option value="true">Sì</option>
                        <option value="false">No</option>
                    </select>
                ) : (user.isAdmin ? 'Sì' : 'No')}
            </td>
            <td style={styles.actionsCell}>
                {isEditing ? (
                    <>
                        <button style={styles.saveButton} onClick={handleSave}>Salva</button>
                        <button style={styles.cancelButton} onClick={() => { setIsEditing(false); setUserData(user); }}>Annulla</button>
                    </>
                ) : (
                    <>
                        <button style={styles.editButton} onClick={() => setIsEditing(true)}>Modifica</button>
                        <button style={styles.deleteButton} onClick={() => onDelete(user.uid)}>Elimina</button>
                    </>
                )}
            </td>
        </tr>
    );
};

export const AdminScreen: React.FC<AdminScreenProps> = ({ onBack }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = userService.subscribeToUsers((userList) => {
      setUsers(userList);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSaveUser = async (uid: string, data: Partial<UserProfile>) => {
    try {
      await userService.updateUser(uid, data);
      addToast('Utente aggiornato con successo.', 'success');
    } catch (error: any) {
      addToast(`Errore: ${error.message}`, 'error');
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (window.confirm("Sei sicuro di voler eliminare questo utente e tutti i suoi dati? L'azione è irreversibile.")) {
        try {
            await userService.deleteUser(uid);
            addToast('Utente eliminato con successo.', 'success');
        } catch (error: any) {
            addToast(`Errore: ${error.message}`, 'error');
        }
    }
  };
  
  const handleExportDB = async () => {
      try {
          const jsonString = await userService.exportDB();
          const blob = new Blob([jsonString], {type: 'application/json'});
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `ces-coach-backup-${new Date().toISOString().split('T')[0]}.json`;
          a.click();
          URL.revokeObjectURL(url);
          addToast('Database esportato.', 'success');
      } catch (error: any) {
          addToast(`Esportazione fallita: ${error.message}`, 'error');
      }
  }

  const handleImportDB = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (!window.confirm("ATTENZIONE: Stai per sovrascrivere l'intero database. Sei assolutamente sicuro?")) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
          try {
              const jsonString = e.target?.result as string;
              await userService.importDB(jsonString);
              addToast('Database importato con successo! La pagina verrà ricaricata.', 'success');
              setTimeout(() => window.location.reload(), 2000);
          } catch (error: any) {
              addToast(`Importazione fallita: ${error.message}`, 'error');
          }
      };
      reader.readAsText(file);
  }

  return (
    <div style={styles.container}>
        <header style={styles.header}>
            <h1 style={styles.title}>Pannello di Amministrazione</h1>
            <div style={styles.headerActions}>
                <button style={styles.actionButton} onClick={handleExportDB}><DownloadIcon/> Esporta DB</button>
                <button style={styles.actionButton} onClick={() => fileInputRef.current?.click()}><UploadIcon/> Importa DB</button>
                <input type="file" ref={fileInputRef} style={{display: 'none'}} accept=".json" onChange={handleImportDB} />
                <button style={{...styles.actionButton, ...styles.closeButton}} onClick={onBack}><CloseIcon/> Chiudi</button>
            </div>
        </header>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
          <Spinner size={48} color={COLORS.primary} />
        </div>
      ) : (
        <div style={styles.tableContainer}>
            <table style={styles.table}>
            <thead>
                <tr style={styles.tableHeader}>
                <th>Nome</th>
                <th>Cognome</th>
                <th>Email</th>
                <th>Scadenza</th>
                <th>Abilitato</th>
                <th>Admin</th>
                <th>Azioni</th>
                </tr>
            </thead>
            <tbody>
                {users.map(user => (
                    <UserRow key={user.uid} user={user} onSave={handleSaveUser} onDelete={handleDeleteUser}/>
                ))}
            </tbody>
            </table>
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: { maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    title: { fontSize: '28px', fontWeight: 'bold', color: COLORS.textPrimary, margin: 0 },
    headerActions: { display: 'flex', gap: '12px' },
    actionButton: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', fontSize: '15px', border: `1px solid ${COLORS.divider}`, backgroundColor: COLORS.card, borderRadius: '8px', cursor: 'pointer' },
    closeButton: { borderColor: COLORS.error, color: COLORS.error },
    tableContainer: { overflowX: 'auto', backgroundColor: COLORS.card, borderRadius: '12px', border: `1px solid ${COLORS.divider}` },
    table: { width: '100%', borderCollapse: 'collapse' },
    tableHeader: { backgroundColor: COLORS.cardDark, textAlign: 'left' },
    tableRow: { borderBottom: `1px solid ${COLORS.divider}` },
    actionsCell: { display: 'flex', gap: '8px', alignItems: 'center' },
    editButton: { padding: '6px 12px', background: COLORS.secondary, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
    deleteButton: { padding: '6px 12px', background: COLORS.error, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
    saveButton: { padding: '6px 12px', background: COLORS.success, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
    cancelButton: { padding: '6px 12px', background: 'transparent', color: COLORS.textSecondary, border: `1px solid ${COLORS.divider}`, borderRadius: '6px', cursor: 'pointer' },
    tableInput: { width: '100%', padding: '4px', borderRadius: '4px', border: `1px solid ${COLORS.divider}` },
};

// Add this to your global CSS or a style tag if not already present, to style the table cells
const globalTableStyles = `
  th, td {
    padding: 12px 16px;
    font-size: 14px;
    color: ${COLORS.textPrimary};
  }
`;
(function() {
    const style = document.createElement('style');
    style.innerHTML = globalTableStyles;
    document.head.appendChild(style);
})();