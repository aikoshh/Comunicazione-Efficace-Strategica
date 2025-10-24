import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';
import { userService } from '../services/userService';
import { COLORS } from '../constants';
import { BackIcon, DownloadIcon, UploadIcon } from './Icons';
import { Spinner } from './Loader';
import { useToast } from '../hooks/useToast';

export const AdminScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = userService.subscribeToUsers((userList) => {
      setUsers(userList);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async (user: UserProfile) => {
    try {
      await userService.updateUser(user.uid, {
        enabled: user.enabled,
        isAdmin: user.isAdmin,
        expiryDate: user.expiryDate ? new Date(user.expiryDate).toISOString() : null,
      });
      addToast('Utente aggiornato con successo', 'success');
      setEditingUser(null);
    } catch (error: any) {
      addToast(`Errore: ${error.message}`, 'error');
    }
  };

  const handleDelete = async (uid: string) => {
    if (window.confirm("Sei sicuro di voler eliminare questo utente e tutti i suoi dati? L'azione è irreversibile.")) {
      try {
        await userService.deleteUser(uid);
        addToast('Utente eliminato', 'success');
      } catch (error: any) {
        addToast(`Errore: ${error.message}`, 'error');
      }
    }
  };

  const handleExport = async () => {
    try {
      const json = await userService.exportDB();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ces-coach-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addToast('Database esportato', 'success');
    } catch (error: any) {
      addToast(`Errore esportazione: ${error.message}`, 'error');
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if(window.confirm("Sei sicuro di voler importare questo file? L'operazione sovrascriverà tutti i dati attuali.")) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const json = e.target?.result as string;
            await userService.importDB(json);
            addToast('Database importato con successo!', 'success');
          } catch (error: any) {
            addToast(`Errore importazione: ${error.message}`, 'error');
          }
        };
        reader.readAsText(file);
      }
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={onBack} style={styles.backButton}><BackIcon/> Indietro</button>
        <h1 style={styles.title}>Pannello di Amministrazione</h1>
        <div style={styles.actions}>
            <button onClick={handleExport} style={styles.actionButton}><DownloadIcon/> Esporta DB</button>
            <button onClick={() => fileInputRef.current?.click()} style={styles.actionButton}><UploadIcon/> Importa DB</button>
            <input type="file" ref={fileInputRef} onChange={handleImport} style={{ display: 'none' }} accept=".json"/>
        </div>
      </header>

      {isLoading ? (
        <Spinner size={48} color={COLORS.primary} />
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Email</th>
                <th>Nome</th>
                <th>Abilitato</th>
                <th>Admin</th>
                <th>Scadenza</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.uid}>
                  <td>{user.email}</td>
                  <td>{`${user.firstName} ${user.lastName}`}</td>
                  <td><input type="checkbox" checked={user.enabled} onChange={(e) => setUsers(users.map(u => u.uid === user.uid ? {...u, enabled: e.target.checked} : u))} /></td>
                  <td><input type="checkbox" checked={user.isAdmin} onChange={(e) => setUsers(users.map(u => u.uid === user.uid ? {...u, isAdmin: e.target.checked} : u))} /></td>
                  <td><input type="date" value={user.expiryDate ? user.expiryDate.split('T')[0] : ''} onChange={(e) => setUsers(users.map(u => u.uid === user.uid ? {...u, expiryDate: e.target.value} : u))} /></td>
                  <td>
                    <button onClick={() => handleSave(user)} style={styles.saveButton}>Salva</button>
                    <button onClick={() => handleDelete(user.uid)} style={styles.deleteButton}>Elimina</button>
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
  container: { maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  title: { fontSize: '28px', fontWeight: 'bold', color: COLORS.primary },
  backButton: { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' },
  actions: { display: 'flex', gap: '12px' },
  actionButton: { padding: '10px 16px', fontSize: '15px', border: `1px solid ${COLORS.secondary}`, backgroundColor: 'transparent', color: COLORS.secondary, borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  tableContainer: { overflowX: 'auto', backgroundColor: COLORS.card, borderRadius: '12px', padding: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  saveButton: { padding: '6px 12px', backgroundColor: COLORS.success, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginRight: '8px' },
  deleteButton: { padding: '6px 12px', backgroundColor: COLORS.error, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
};

// Add styles for table headers and cells to the styles object
styles.table = {
    ...styles.table,
    fontSize: '14px',
};

const thTdStyle: React.CSSProperties = {
    padding: '12px 16px',
    textAlign: 'left',
    borderBottom: `1px solid ${COLORS.divider}`,
};

styles.table.thead = {
    backgroundColor: COLORS.cardDark,
};

styles.table.th = {
    ...thTdStyle,
    fontWeight: 600,
    color: COLORS.textPrimary,
};

styles.table.td = {
    ...thTdStyle,
    color: COLORS.textSecondary,
};

styles.table.tbody = {
    ...styles.table.tbody,
};
