import React, { useState, useRef, useEffect, useCallback } from 'react';
import { User } from '../types';
import { userService } from '../services/userService';
import { databaseService } from '../services/databaseService';
import { COLORS } from '../constants';
import { BackIcon, SettingsIcon } from './Icons';
import { useToast } from '../hooks/useToast';
import { soundService } from '../services/soundService';

interface AdminScreenProps {
  onBack: () => void;
}

// A type for the data being edited to avoid type conflicts with the main User type
type EditableUserData = Partial<Pick<User, 'firstName' | 'lastName' | 'isAdmin' | 'enabled' | 'expiryDate'>> & { password?: string };

const isoToDateTimeLocal = (isoString: string | null): string => {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    const timezoneOffset = date.getTimezoneOffset() * 60000;
    const localTime = new Date(date.getTime() - timezoneOffset);
    return localTime.toISOString().slice(0, 16);
  } catch (e) {
    return "";
  }
};

export const AdminScreen: React.FC<AdminScreenProps> = ({ onBack }) => {
  const [users, setUsers] = useState<User[]>(() => userService.listUsers());
  const { addToast } = useToast();
  const importInputRef = useRef<HTMLInputElement>(null);

  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const [editingUserEmail, setEditingUserEmail] = useState<string | null>(null);
  const [editedUserData, setEditedUserData] = useState<EditableUserData>({});
  
  const [fileToImport, setFileToImport] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  const refreshUserList = useCallback(() => {
    setUsers(userService.listUsers());
  }, []);

  // Subscribe to database changes to keep the user list in sync
  useEffect(() => {
    const unsubscribe = databaseService.subscribe(refreshUserList);
    return () => unsubscribe();
  }, [refreshUserList]);


  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    soundService.playClick();
    if (!newEmail || !newPassword || !newFirstName) {
        addToast("Email, Nome e Password sono obbligatori.", "error");
        return;
    }
    setIsAdding(true);
    try {
        await userService.addUser(newEmail, newPassword, newFirstName, newLastName);
        addToast("Utente aggiunto con successo.", "success");
        // Reset form - UI will update automatically via subscription
        setNewEmail('');
        setNewPassword('');
        setNewFirstName('');
        setNewLastName('');
    } catch (e: any) {
        addToast(e.message, 'error');
    } finally {
        setIsAdding(false);
    }
  };

  const startEditing = (user: User) => {
    soundService.playClick();
    setEditingUserEmail(user.email);
    setEditedUserData({
      firstName: user.firstName,
      lastName: user.lastName,
      isAdmin: user.isAdmin,
      enabled: user.enabled,
      expiryDate: user.expiryDate,
      password: '',
    });
  };

  const cancelEditing = () => {
    soundService.playClick();
    setEditingUserEmail(null);
    setEditedUserData({});
  };

  const handleSaveUser = async (email: string) => {
    soundService.playClick();
    try {
      const updates: EditableUserData = { ...editedUserData };
      // Only include the password in the update if it's not empty
      if (!updates.password?.trim()) {
        delete updates.password;
      }

      await userService.updateUser(email, updates);
      addToast("Utente aggiornato con successo.", "success");
      cancelEditing();
    } catch (e: any) {
      addToast(e.message, 'error');
    }
  };

  const handleEditFormChange = (field: keyof EditableUserData, value: string | boolean | null) => {
      setEditedUserData(prev => ({...prev, [field]: value}));
  };

  const handleDeleteUser = (email: string) => {
    soundService.playClick();
    if (confirm(`Sei sicuro di voler eliminare l'utente ${email}? L'azione è irreversibile.`)) {
        if (userService.deleteUser(email)) {
            addToast("Utente eliminato.", "success");
            // UI will update automatically
        } else {
            addToast("Impossibile trovare l'utente.", "error");
        }
    }
  };

  const handleExtendSubscription = (email: string) => {
    soundService.playClick();
    const daysStr = prompt("Quanti giorni vuoi aggiungere? (default: 30)", "30");
    const days = parseInt(daysStr || '30', 10);
    if (isNaN(days) || days <= 0) {
        addToast("Numero di giorni non valido.", "error");
        return;
    }
    
    const updatedUser = userService.extendSubscription(email, days);
    if (updatedUser) {
        addToast(`Abbonamento esteso. Nuova scadenza: ${updatedUser.expiryDate ? new Date(updatedUser.expiryDate).toLocaleDateString() : 'Nessuna'}`, "success");
        // UI will update automatically
    } else {
        addToast("Impossibile trovare l'utente.", "error");
    }
  };
  
  const handleExport = () => {
    soundService.playClick();
    try {
        const jsonString = databaseService.exportDatabase();
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ces_coach_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        addToast("Database esportato con successo.", "success");
    } catch (e) {
        addToast("Errore durante l'esportazione del database.", "error");
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setFileToImport(file || null);
  };

  const handleImport = () => {
    if (!fileToImport) {
        addToast("Nessun file selezionato per l'importazione.", "error");
        return;
    }

    soundService.playClick();
    if (!confirm("Sei sicuro di voler importare questo file? L'operazione sovrascriverà TUTTI i dati attuali (utenti, progressi, acquisti). Questa azione è irreversibile.")) {
        setFileToImport(null);
        if (importInputRef.current) importInputRef.current.value = '';
        return;
    }

    setIsImporting(true);
    setImportProgress(0);

    // Simulate progress for UX
    const progressInterval = setInterval(() => {
        setImportProgress(prev => {
            if (prev >= 95) { // Stop just before 100
                clearInterval(progressInterval);
                return prev;
            }
            return prev + 5;
        });
    }, 50);

    const reader = new FileReader();
    reader.onload = (e) => {
        clearInterval(progressInterval);
        setImportProgress(100);

        setTimeout(() => { // Brief delay to show 100%
            try {
                const content = e.target?.result;
                if (typeof content !== 'string') {
                    throw new Error("Contenuto del file non valido o illeggibile.");
                }
                const summary = databaseService.importDatabase(content);
                addToast(`Importazione completata! Caricati: ${summary.users} utenti, ${summary.progress} progressi, ${summary.entitlements} acquisti.`, "success");
            } catch (error: any) {
                addToast(error.message, 'error');
            } finally {
                setIsImporting(false);
                setFileToImport(null);
                if (importInputRef.current) importInputRef.current.value = '';
            }
        }, 300);
    };
    reader.onerror = () => {
      clearInterval(progressInterval);
      setIsImporting(false);
      addToast("Errore durante la lettura del file.", "error");
    };
    reader.readAsText(fileToImport);
  };


  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.titleContainer}>
            <SettingsIcon width={32} height={32} color={COLORS.primary} />
            <h1 style={styles.title}>Pannello di Amministrazione</h1>
        </div>
        <button onClick={onBack} style={styles.backButton}><BackIcon/> Torna alla Home</button>
      </header>
      
      <div style={styles.addUserForm}>
        <h2 style={styles.formTitle}>Aggiungi Nuovo Utente</h2>
        <form onSubmit={handleAddUser} style={styles.formGrid}>
          <input
            type="email"
            placeholder="Email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            style={styles.formInput}
            required
            disabled={isAdding}
          />
          <input
            type="password"
            placeholder="Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={styles.formInput}
            required
            disabled={isAdding}
          />
          <input
            type="text"
            placeholder="Nome"
            value={newFirstName}
            onChange={(e) => setNewFirstName(e.target.value)}
            style={styles.formInput}
            required
            disabled={isAdding}
          />
          <input
            type="text"
            placeholder="Cognome (Opzionale)"
            value={newLastName}
            onChange={(e) => setNewLastName(e.target.value)}
            style={styles.formInput}
            disabled={isAdding}
          />
          <button type="submit" style={styles.addButton} disabled={isAdding}>
            {isAdding ? 'Aggiungendo...' : 'Aggiungi'}
          </button>
        </form>
      </div>

      <div style={styles.addUserForm}>
        <h2 style={styles.formTitle}>Import / Export Dati</h2>
        <div style={styles.importExportSection}>
            <div style={styles.importExportActions}>
                <button onClick={handleExport} style={{...styles.actionButton, ...styles.exportButton}} disabled={isImporting}>
                    Esporta Database (.json)
                </button>
                <button onClick={() => importInputRef.current?.click()} style={{...styles.actionButton, ...styles.importButton}} disabled={isImporting}>
                    Seleziona File di Backup...
                </button>
                <input
                    type="file"
                    ref={importInputRef}
                    style={{ display: 'none' }}
                    accept=".json,.txt"
                    onChange={handleFileSelect}
                />
            </div>
            {fileToImport && !isImporting && (
                <div style={styles.fileSelectedContainer}>
                    <span style={styles.fileName}>{fileToImport.name}</span>
                    <button onClick={handleImport} style={{...styles.actionButton, ...styles.loadButton}}>
                        Carica File
                    </button>
                </div>
            )}
            {isImporting && (
                <div style={styles.progressBarContainer}>
                    <div style={styles.progressText}>Caricamento: {importProgress}%</div>
                    <div style={styles.progressBar}>
                        <div style={{ ...styles.progressBarFill, width: `${importProgress}%`}} />
                    </div>
                </div>
            )}
        </div>
        <p style={styles.importExportDescription}>
            Esporta tutti i dati (utenti, progressi, acquisti) in un singolo file. Importa un file per ripristinare lo stato dell'applicazione.
        </p>
      </div>

      <div style={styles.userListHeader}>
        <h2 style={styles.userCount}>{users.length} Utenti Registrati</h2>
      </div>

      <div style={styles.userListContainer}>
        {users.length === 0 ? (
            <p>Nessun utente trovato.</p>
        ) : (
            users.map(user => (
              editingUserEmail === user.email ? (
                <div key={user.email} style={{...styles.userCard, ...styles.editingCard}}>
                    <div style={styles.editForm}>
                      <div style={styles.editGroup}>
                          <label style={styles.editLabel}>Email</label>
                          <input type="text" value={user.email} style={styles.editInput} disabled />
                      </div>
                       <div style={styles.editGroup}>
                          <label style={styles.editLabel}>Nome</label>
                          <input type="text" value={editedUserData.firstName} onChange={e => handleEditFormChange('firstName', e.target.value)} style={styles.editInput} />
                      </div>
                       <div style={styles.editGroup}>
                          <label style={styles.editLabel}>Cognome</label>
                          <input type="text" value={editedUserData.lastName} onChange={e => handleEditFormChange('lastName', e.target.value)} style={styles.editInput} />
                      </div>
                      <div style={styles.editGroup}>
                          <label style={styles.editLabel}>Nuova Password</label>
                          <input type="password" placeholder="Lascia vuoto per non cambiare" value={editedUserData.password} onChange={e => handleEditFormChange('password', e.target.value)} style={styles.editInput} />
                      </div>
                       <div style={styles.editGroup}>
                          <label style={styles.editLabel}>Scadenza</label>
                          <input type="datetime-local" value={isoToDateTimeLocal(editedUserData.expiryDate ?? null)} onChange={e => handleEditFormChange('expiryDate', e.target.value ? new Date(e.target.value).toISOString() : null)} style={styles.editInput} />
                      </div>
                      <div style={styles.checkboxGroup}>
                          <label style={styles.checkboxLabel}>
                              <input type="checkbox" checked={!!editedUserData.isAdmin} onChange={e => handleEditFormChange('isAdmin', e.target.checked)} />
                              Amministratore
                          </label>
                          <label style={styles.checkboxLabel}>
                              <input type="checkbox" checked={!!editedUserData.enabled} onChange={e => handleEditFormChange('enabled', e.target.checked)} />
                              Abilitato
                          </label>
                      </div>
                    </div>
                    <div style={styles.userActions}>
                        <button onClick={() => handleSaveUser(user.email)} style={{...styles.actionButton, ...styles.saveButton}}>Salva</button>
                        <button onClick={cancelEditing} style={{...styles.actionButton, ...styles.cancelButton}}>Annulla</button>
                    </div>
                </div>
              ) : (
                <div key={user.email} style={styles.userCard}>
                    <div style={styles.userInfo}>
                        <div style={styles.userName}>{user.firstName} {user.lastName}</div>
                        <div style={styles.userEmail}>{user.email}</div>
                        <div style={styles.userDetails}>
                            <span>Admin: <strong style={{color: user.isAdmin ? COLORS.success : COLORS.error}}>{user.isAdmin ? 'Sì' : 'No'}</strong></span>
                            <span>Abilitato: <strong style={{color: user.enabled ? COLORS.success : COLORS.error}}>{user.enabled ? 'Sì' : 'No'}</strong></span>
                        </div>
                         <div style={styles.userExpiry}>
                           Scadenza: {user.expiryDate ? new Date(user.expiryDate).toLocaleString() : 'Nessuna'}
                        </div>
                    </div>
                    <div style={styles.userActions}>
                        <button onClick={() => startEditing(user)} style={{...styles.actionButton, ...styles.editButton}}>Modifica</button>
                        <button onClick={() => handleDeleteUser(user.email)} style={{...styles.actionButton, ...styles.deleteButton}}>Elimina</button>
                        {!user.isAdmin && <button onClick={() => handleExtendSubscription(user.email)} style={{...styles.actionButton, ...styles.extendButton}}>Estendi</button>}
                    </div>
                </div>
              )
            ))
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: { maxWidth: '1000px', margin: '0 auto', padding: '40px 20px', backgroundColor: COLORS.base, minHeight: '100vh' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' },
    titleContainer: { display: 'flex', alignItems: 'center', gap: '16px' },
    title: { fontSize: '28px', color: COLORS.textPrimary, fontWeight: 'bold', margin: 0 },
    backButton: { display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: `1px solid ${COLORS.divider}`, borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '15px', color: COLORS.textSecondary, fontWeight: '500' },
    addUserForm: {
        backgroundColor: COLORS.card,
        padding: '24px',
        borderRadius: '12px',
        marginBottom: '32px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    },
    formTitle: {
        fontSize: '20px',
        color: COLORS.textPrimary,
        margin: '0 0 16px 0',
        paddingBottom: '8px',
        borderBottom: `1px solid ${COLORS.divider}`
    },
    importExportSection: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    },
    importExportActions: {
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
    },
    fileSelectedContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        backgroundColor: COLORS.cardDark,
        padding: '8px 12px',
        borderRadius: '8px',
        width: '100%',
        boxSizing: 'border-box'
    },
    fileName: {
        flex: 1,
        fontSize: '14px',
        color: COLORS.textSecondary,
        fontStyle: 'italic',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    loadButton: {
        backgroundColor: COLORS.success,
        flexShrink: 0,
    },
    exportButton: {
        backgroundColor: COLORS.primary,
    },
    importButton: {
        backgroundColor: COLORS.secondary,
    },
    progressBarContainer: {
        width: '100%',
    },
    progressText: {
        fontSize: '14px',
        color: COLORS.textSecondary,
        marginBottom: '4px',
        textAlign: 'center'
    },
    progressBar: {
        height: '10px',
        backgroundColor: COLORS.divider,
        borderRadius: '5px',
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: COLORS.success,
        borderRadius: '5px',
        transition: 'width 0.1s linear',
    },
    importExportDescription: {
        fontSize: '14px',
        color: COLORS.textSecondary,
        marginTop: '16px',
        lineHeight: 1.5,
    },
    formGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        alignItems: 'flex-end',
    },
    formInput: {
        padding: '10px',
        fontSize: '14px',
        borderRadius: '8px',
        border: `1px solid ${COLORS.divider}`,
        width: '100%',
        boxSizing: 'border-box',
    },
    userListHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    userCount: { fontSize: '20px', color: COLORS.textPrimary, margin: 0 },
    addButton: { padding: '10px 18px', fontSize: '15px', fontWeight: 'bold', color: 'white', backgroundColor: COLORS.success, border: 'none', borderRadius: '8px', cursor: 'pointer', height: '40px' },
    userListContainer: { display: 'flex', flexDirection: 'column', gap: '16px' },
    userCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', backgroundColor: COLORS.card, padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', transition: 'all 0.3s ease' },
    editingCard: {
        backgroundColor: COLORS.cardDark,
        borderColor: COLORS.secondary,
        boxShadow: `0 0 0 2px ${COLORS.secondary}, 0 4px 12px rgba(0,0,0,0.1)`,
        flexDirection: 'column',
        alignItems: 'stretch',
    },
    editForm: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        width: '100%',
        marginBottom: '16px'
    },
    editGroup: { display: 'flex', flexDirection: 'column' },
    editLabel: { fontSize: '12px', color: COLORS.textSecondary, marginBottom: '4px', fontWeight: 500 },
    editInput: { padding: '8px', fontSize: '14px', borderRadius: '6px', border: `1px solid ${COLORS.divider}` },
    checkboxGroup: { gridColumn: '1 / -1', display: 'flex', gap: '20px', alignItems: 'center', marginTop: '8px' },
    checkboxLabel: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' },
    userInfo: { display: 'flex', flexDirection: 'column', gap: '4px' },
    userName: { fontSize: '18px', fontWeight: '600', color: COLORS.textPrimary },
    userEmail: { fontSize: '14px', color: COLORS.textSecondary },
    userDetails: { display: 'flex', gap: '16px', fontSize: '14px', color: COLORS.textSecondary, marginTop: '8px' },
    userExpiry: { fontSize: '13px', color: COLORS.textSecondary, fontStyle: 'italic', marginTop: '4px' },
    userActions: { display: 'flex', flexWrap: 'wrap', gap: '12px', flexShrink: 0, alignSelf: 'center' },
    actionButton: { padding: '8px 16px', fontSize: '14px', fontWeight: '500', border: 'none', borderRadius: '8px', cursor: 'pointer', color: 'white' },
    editButton: { backgroundColor: COLORS.secondary },
    deleteButton: { backgroundColor: COLORS.error },
    extendButton: { backgroundColor: COLORS.warning, color: COLORS.textPrimary },
    saveButton: { backgroundColor: COLORS.success },
    cancelButton: { backgroundColor: COLORS.textSecondary },
};
