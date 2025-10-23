import React, { useState, useEffect, useRef } from 'react';
import { COLORS } from '../constants';
import { BackIcon, DownloadIcon, UploadIcon } from './Icons';
import { userService } from '../services/userService';
import type { UserProfile } from '../types';
import { useToast } from '../hooks/useToast';
import { Spinner } from './Loader';

// Component for a single user row in the table
const UserRow: React.FC<{ user: UserProfile; onUpdate: (uid: string, data: Partial<UserProfile>) => void; onDelete: (uid: string, email: string) => void; }> = ({ user, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Partial<UserProfile>>({});

    const handleEdit = () => {
        setEditData({
            isAdmin: user.isAdmin,
            enabled: user.enabled,
            expiryDate: user.expiryDate ? user.expiryDate.split('T')[0] : '', // Format for date input
        });
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditData({});
    };

    const handleSave = () => {
        onUpdate(user.uid, editData);
        setIsEditing(false);
    };

    return (
        <tr style={styles.tableRow}>
            <td style={styles.tableCell}>{user.firstName} {user.lastName}</td>
            <td style={styles.tableCell}>{user.email}</td>
            <td style={styles.tableCell}>
                {isEditing ? (
                    <input type="checkbox" checked={editData.enabled} onChange={e => setEditData({...editData, enabled: e.target.checked})} />
                ) : (
                    <span style={{ color: user.enabled ? COLORS.success : COLORS.error }}>{user.enabled ? 'Sì' : 'No'}</span>
                )}
            </td>
            <td style={styles.tableCell}>
                {isEditing ? (
                    <input type="checkbox" checked={editData.isAdmin} onChange={e => setEditData({...editData, isAdmin: e.target.checked})} />
                ) : (
                    <span style={{ fontWeight: user.isAdmin ? 'bold' : 'normal' }}>{user.isAdmin ? 'Sì' : 'No'}</span>
                )}
            </td>
            <td style={styles.tableCell}>
                {isEditing ? (
                    <input type="date" value={editData.expiryDate || ''} onChange={e => setEditData({...editData, expiryDate: e.target.value})} style={styles.dateInput} />
                ) : (
                    user.expiryDate ? new Date(user.expiryDate).toLocaleDateString('it-IT') : 'N/A'
                )}
            </td>
            <td style={{...styles.tableCell, ...styles.actionsCell}}>
                {isEditing ? (
                    <>
                        <button onClick={handleSave} style={{...styles.actionButton, ...styles.saveButton}}>Salva</button>
                        <button onClick={handleCancel} style={{...styles.actionButton, ...styles.cancelButton}}>Annulla</button>
                    </>
                ) : (
                    <>
                        <button onClick={handleEdit} style={{...styles.actionButton, ...styles.editButton}}>Modifica</button>
                        <button onClick={() => onDelete(user.uid, user.email)} style={{...styles.actionButton, ...styles.deleteButton}}>Elimina</button>
                    </>
                )}
            </td>
        </tr>
    );
};

export const AdminScreen: React.FC<{ onBack: () => void; }> = ({ onBack }) => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newUser, setNewUser] = useState({ email: '', firstName: '', lastName: '' });
    const { addToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const unsubscribe = userService.subscribeToUsers(
            (fetchedUsers) => {
                setUsers(fetchedUsers);
                setIsLoading(false);
            },
        );
        return () => unsubscribe();
    }, []);

    const handleUpdateUser = async (uid: string, data: Partial<UserProfile>) => {
        try {
            await userService.updateUser(uid, data);
            addToast('Utente aggiornato con successo.', 'success');
        } catch (e: any) {
            addToast(`Errore: ${e.message}`, 'error');
        }
    };
    
    const handleDeleteUser = async (uid: string, email: string) => {
        if (window.confirm(`Sei sicuro di voler eliminare l'utente ${email}? Questa azione è irreversibile e cancellerà anche i suoi progressi.`)) {
            try {
                await userService.deleteUser(uid);
                addToast('Utente eliminato con successo.', 'success');
            } catch (e: any) {
                addToast(`Errore: ${e.message}`, 'error');
            }
        }
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUser.email || !newUser.firstName || !newUser.lastName) {
            addToast('Tutti i campi sono obbligatori.', 'error');
            return;
        }
        try {
            await userService.addUser(newUser);
            addToast(`Profilo per ${newUser.email} creato. L'utente deve essere creato anche in Firebase Authentication per poter accedere.`, 'success');
            setNewUser({ email: '', firstName: '', lastName: '' });
        } catch (e: any) {
            addToast(`Errore: ${e.message}`, 'error');
        }
    };

    const handleExport = async () => {
        try {
            const jsonString = await userService.exportDB();
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ces-coach-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            addToast('Database esportato con successo.', 'success');
        } catch (e: any) {
            addToast(`Errore durante l'esportazione: ${e.message}`, 'error');
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!window.confirm("ATTENZIONE: L'importazione sovrascriverà tutti i dati esistenti con quelli del file. Sei sicuro di voler procedere?")) {
            return;
        }
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const json = e.target?.result as string;
                await userService.importDB(json);
                addToast('Database importato con successo. La pagina si aggiornerà.', 'success');
            } catch (err: any) {
                addToast(`Errore durante l'importazione: ${err.message}`, 'error');
            }
        };
        reader.readAsText(file);
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button onClick={onBack} style={styles.backButton}><BackIcon /></button>
                    <h1 style={styles.title}>Pannello Amministratore</h1>
                </div>
                 <a 
                    href="https://console.firebase.google.com/project/ces-coach/authentication/users" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={styles.firebaseButton}
                >
                    Pannello FireBase
                </a>
            </header>

            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Aggiungi Utente</h2>
                <form onSubmit={handleAddUser} style={styles.addUserForm}>
                    <input type="text" placeholder="Nome" value={newUser.firstName} onChange={e => setNewUser({...newUser, firstName: e.target.value})} style={styles.input} />
                    <input type="text" placeholder="Cognome" value={newUser.lastName} onChange={e => setNewUser({...newUser, lastName: e.target.value})} style={styles.input} />
                    <input type="email" placeholder="Email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} style={styles.input} />
                    <button type="submit" style={styles.addButton}>Aggiungi Profilo</button>
                </form>
                 <p style={styles.note}>Nota: la creazione di un profilo qui non crea l'account di accesso. Per abilitare il login, crea l'utente con la stessa email nel pannello 'Authentication' di Firebase.</p>
            </div>

            <div style={styles.section}>
                 <h2 style={styles.sectionTitle}>Gestione Database</h2>
                 <div style={styles.dbActions}>
                    <button onClick={handleExport} style={styles.dbButton}><DownloadIcon/> Esporta Database</button>
                    <button onClick={handleImportClick} style={{...styles.dbButton, ...styles.importButton}}><UploadIcon/> Importa Database</button>
                    <input type="file" accept=".json" ref={fileInputRef} onChange={handleImport} style={{ display: 'none' }} />
                 </div>
            </div>

            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Utenti Registrati ({users.length})</h2>
                {isLoading ? <Spinner size={48} /> : error ? <p style={{color: COLORS.error}}>{error}</p> : (
                    <div style={styles.tableContainer}>
                        <table style={styles.userTable}>
                            <thead>
                                <tr style={styles.tableHeaderRow}>
                                    <th style={styles.tableHeader}>Nome</th>
                                    <th style={styles.tableHeader}>Email</th>
                                    <th style={styles.tableHeader}>Abilitato</th>
                                    <th style={styles.tableHeader}>Admin</th>
                                    <th style={styles.tableHeader}>Scadenza</th>
                                    <th style={styles.tableHeader}>Azioni</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => <UserRow key={user.uid} user={user} onUpdate={handleUpdateUser} onDelete={handleDeleteUser} />)}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: { maxWidth: '1200px', margin: '0 auto', padding: '40px 20px', minHeight: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', gap: '32px' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', paddingBottom: '16px', borderBottom: `1px solid ${COLORS.divider}` },
    title: { fontSize: '24px', fontWeight: 'bold', color: COLORS.textPrimary, margin: 0 },
    backButton: { background: 'none', border: 'none', cursor: 'pointer', color: COLORS.textSecondary, padding: '8px' },
    firebaseButton: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 20px',
        fontSize: '15px',
        fontWeight: 'bold',
        border: 'none',
        backgroundColor: COLORS.warning,
        color: 'white',
        borderRadius: '6px',
        cursor: 'pointer',
        textDecoration: 'none',
    },
    section: { backgroundColor: COLORS.card, padding: '24px', borderRadius: '12px', border: `1px solid ${COLORS.divider}` },
    sectionTitle: { fontSize: '20px', fontWeight: 'bold', color: COLORS.primary, margin: '0 0 16px 0' },
    addUserForm: { display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' },
    input: { padding: '10px', fontSize: '15px', borderRadius: '6px', border: `1px solid ${COLORS.divider}`, flex: 1, minWidth: '180px' },
    dateInput: { padding: '8px', fontSize: '14px', borderRadius: '6px', border: `1px solid ${COLORS.divider}` },
    addButton: { padding: '10px 20px', fontSize: '15px', fontWeight: 'bold', border: 'none', backgroundColor: COLORS.secondary, color: 'white', borderRadius: '6px', cursor: 'pointer' },
    note: { fontSize: '13px', color: COLORS.textSecondary, margin: '12px 0 0 0', fontStyle: 'italic' },
    dbActions: { display: 'flex', gap: '16px' },
    dbButton: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '15px', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer' },
    importButton: { backgroundColor: COLORS.warning, color: 'white' },
    tableContainer: { overflowX: 'auto' },
    userTable: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
    tableHeaderRow: { borderBottom: `2px solid ${COLORS.divider}` },
    tableHeader: { padding: '12px', fontWeight: 'bold', color: COLORS.textSecondary },
    tableRow: { borderBottom: `1px solid ${COLORS.divider}` },
    tableCell: { padding: '12px' },
    actionsCell: { display: 'flex', gap: '8px', alignItems: 'center' },
    actionButton: { padding: '6px 12px', fontSize: '13px', fontWeight: '500', border: 'none', borderRadius: '6px', cursor: 'pointer' },
    editButton: { backgroundColor: COLORS.accentBeige, color: COLORS.textAccent },
    deleteButton: { backgroundColor: COLORS.error, color: 'white' },
    saveButton: { backgroundColor: COLORS.success, color: 'white' },
    cancelButton: { backgroundColor: '#ccc', color: 'black' },
};