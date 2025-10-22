import React, { useState, useEffect, useCallback, useRef } from 'react';
// FIX: Changed import from User to UserProfile and aliased as User to match the Firebase data model.
import type { UserProfile as User } from '../types';
import { userService } from '../services/userService';
import { databaseService } from '../services/databaseService';
import { COLORS } from '../constants';
import { useToast } from '../hooks/useToast';
import { HomeIcon, CloseIcon, UploadIcon, DownloadIcon } from './Icons';
import { Spinner } from './Loader';

const UserModal: React.FC<{
    user: Partial<User> | null;
    onClose: () => void;
    onSave: (user: Partial<User> & { password?: string }) => Promise<void>;
}> = ({ user, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<User> & { password?: string }>({});
    const [isLoading, setIsLoading] = useState(false);
    const isNewUser = !user?.email;

    useEffect(() => {
        setFormData(user ? { ...user } : { isAdmin: false, enabled: true });
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        await onSave(formData);
        setIsLoading(false);
    };

    if (!user) return null;

    return (
        <div style={styles.modalOverlay} onClick={onClose}>
            <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                <header style={styles.modalHeader}>
                    <h3 style={styles.modalTitle}>{isNewUser ? 'Aggiungi Nuovo Utente' : 'Modifica Utente'}</h3>
                    <button onClick={onClose} style={styles.closeButton}><CloseIcon /></button>
                </header>
                <form onSubmit={handleSubmit} style={styles.modalForm}>
                    <div style={styles.inputGroup}>
                        <label htmlFor="email" style={styles.modalLabel}>Email</label>
                        <input style={styles.modalInput} type="email" id="email" name="email" value={formData.email || ''} onChange={handleChange} required disabled={!isNewUser} />
                    </div>
                    <div style={styles.inputGroup}>
                        <label htmlFor="firstName" style={styles.modalLabel}>Nome</label>
                        <input style={styles.modalInput} type="text" id="firstName" name="firstName" value={formData.firstName || ''} onChange={handleChange} required />
                    </div>
                    <div style={styles.inputGroup}>
                        <label htmlFor="lastName" style={styles.modalLabel}>Cognome</label>
                        <input style={styles.modalInput} type="text" id="lastName" name="lastName" value={formData.lastName || ''} onChange={handleChange} required />
                    </div>
                    <div style={styles.inputGroup}>
                        <label htmlFor="password" style={styles.modalLabel}>{isNewUser ? 'Password' : 'Nuova Password (opzionale)'}</label>
                        <input style={styles.modalInput} type="password" id="password" name="password" value={formData.password || ''} onChange={handleChange} required={isNewUser} />
                    </div>
                    <div style={styles.inputGroup}>
                        <label htmlFor="expiryDate" style={styles.modalLabel}>Data Scadenza (YYYY-MM-DD o vuoto per illimitato)</label>
                        <input style={styles.modalInput} type="text" id="expiryDate" name="expiryDate" value={formData.expiryDate || ''} onChange={handleChange} placeholder="es. 2025-12-31" />
                    </div>
                    <div style={styles.checkboxGroup}>
                        <input type="checkbox" id="isAdmin" name="isAdmin" checked={!!formData.isAdmin} onChange={handleChange} />
                        <label htmlFor="isAdmin">È Amministratore</label>
                    </div>
                    <div style={styles.checkboxGroup}>
                        <input type="checkbox" id="enabled" name="enabled" checked={!!formData.enabled} onChange={handleChange} />
                        <label htmlFor="enabled">Account Attivo</label>
                    </div>
                    <div style={styles.modalFooter}>
                        <button type="button" onClick={onClose} style={styles.secondaryButton}>Annulla</button>
                        <button type="submit" style={styles.primaryButton} disabled={isLoading}>
                            {isLoading ? <Spinner size={20} color="white" /> : 'Salva Utente'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


export const AdminScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
    const { addToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchUsers = useCallback(() => {
        setIsLoading(true);
        // FIX: The original userService was stateful and based on a local DB.
        // It's been refactored to fetch fresh data from Firestore.
        userService.reloadUsers().then(() => {
            setUsers(userService.listUsers());
            setIsLoading(false);
        });
    }, []);

    useEffect(() => {
        // FIX: Implemented subscribe method in databaseService to listen for realtime updates.
        const unsubscribe = databaseService.subscribe('users', (docs) => {
            const updatedUsers = docs.map(doc => ({ uid: doc.id, ...doc.data() })) as User[];
            setUsers(updatedUsers.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
        });
        fetchUsers();
        return () => unsubscribe();
    }, [fetchUsers]);

    const handleEdit = (user: User) => {
        setEditingUser({ ...user });
    };

    const handleAddUser = () => {
        setEditingUser({});
    };

    const handleDelete = async (user: User) => {
        if (window.confirm(`Sei sicuro di voler eliminare l'utente ${user.email}? L'azione è irreversibile e cancellerà solo il profilo, non l'account di autenticazione.`)) {
            const success = await userService.deleteUser(user.uid);
            if (success) {
                addToast('Utente eliminato.', 'success');
            } else {
                addToast("Impossibile eliminare l'utente.", 'error');
            }
        }
    };
    
    const handleExtend = async (email: string) => {
        const user = await userService.extendSubscription(email, 30);
        if (user) {
            addToast(`Abbonamento per ${email} esteso di 30 giorni.`, 'success');
        } else {
             addToast('Utente non trovato.', 'error');
        }
    };

    const handleSaveUser = async (userData: Partial<User> & { password?: string }) => {
        try {
            if (userData.email && !userService.getUser(userData.email)) {
                if (!userData.password) {
                    addToast('La password è obbligatoria per i nuovi utenti.', 'error');
                    return;
                }
                await userService.addUser(userData.email, userData.password, userData.firstName || '', userData.lastName || '', !!userData.isAdmin);
                addToast('Utente creato con successo. La pagina si ricaricherà.', 'success');
                setTimeout(() => window.location.reload(), 2000);

            } else if (userData.uid) {
                await userService.updateUser(userData.uid, userData);
                addToast('Utente aggiornato con successo.', 'success');
            }
            setEditingUser(null);
        } catch (e: any) {
            addToast(e.message || 'Errore durante il salvataggio.', 'error');
        }
    };

    const handleExport = async () => {
        try {
            // FIX: Implemented exportDatabase in databaseService to export collections.
            const jsonData = await databaseService.exportDatabase();
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const date = new Date().toISOString().split('T')[0];
            a.href = url;
            a.download = `ces_coach_backup_${date}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            addToast('Database esportato con successo.', 'success');
        } catch (e) {
            console.error(e);
            addToast('Errore durante l\'esportazione del database.', 'error');
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const content = e.target?.result as string;
                // FIX: Implemented importDatabase in databaseService to import collections.
                const stats = await databaseService.importDatabase(content);
                addToast(`Database importato: ${stats.users} utenti, ${stats.progress} progressi, ${stats.entitlements} licenze.`, 'success');
            } catch (err: any) {
                addToast(err.message || 'Errore nell\'importazione del file.', 'error');
            } finally {
                if (event.target) {
                    event.target.value = '';
                }
            }
        };
        reader.onerror = () => {
            addToast('Impossibile leggere il file.', 'error');
        };
        reader.readAsText(file);
    };

    if (isLoading) {
        return <div style={styles.container}><Spinner size={48} color={COLORS.primary} /></div>;
    }

    return (
        <div style={styles.container}>
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".json"
                onChange={handleFileChange}
            />
            <header style={styles.header}>
                <h1 style={styles.title}>Pannello di Amministrazione</h1>
                <div style={styles.headerActions}>
                    <button onClick={onBack} style={styles.secondaryButton}><HomeIcon/> Torna alla Home</button>
                    <button onClick={handleExport} style={styles.secondaryButton}><DownloadIcon/> Esporta Database</button>
                    <button onClick={handleImportClick} style={styles.secondaryButton}><UploadIcon/> Carica Database</button>
                    <button onClick={handleAddUser} style={styles.primaryButton}>Aggiungi Utente</button>
                </div>
            </header>
            <div style={styles.tableContainer}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.tableHeader}>Email</th>
                            <th style={styles.tableHeader}>Nome</th>
                            <th style={styles.tableHeader}>Stato</th>
                            <th style={styles.tableHeader}>Scadenza</th>
                            <th style={styles.tableHeader}>Admin</th>
                            <th style={styles.tableHeader}>Azioni</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => {
                            const isExpired = user.expiryDate ? new Date(user.expiryDate) < new Date() : false;
                            return (
                                <tr key={user.email}>
                                    <td style={styles.tableCell}>{user.email}</td>
                                    <td style={styles.tableCell}>{user.firstName} {user.lastName}</td>
                                    <td style={styles.tableCell}>
                                        <span style={{...styles.statusPill, backgroundColor: user.enabled && !isExpired ? COLORS.success : COLORS.error}}>
                                            {user.enabled && !isExpired ? 'Attivo' : (isExpired ? 'Scaduto' : 'Disabilitato')}
                                        </span>
                                    </td>
                                    <td style={styles.tableCell}>{user.expiryDate ? new Date(user.expiryDate).toLocaleDateString() : 'Illimitato'}</td>
                                    <td style={styles.tableCell}>{user.isAdmin ? 'Sì' : 'No'}</td>
                                    <td style={{...styles.tableCell, ...styles.actionsCell}}>
                                        <button onClick={() => handleEdit(user)}>Modifica</button>
                                        <button onClick={() => handleExtend(user.email)}>+30gg</button>
                                        <button onClick={() => handleDelete(user)} style={{color: COLORS.error}}>Elimina</button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
            {editingUser && <UserModal user={editingUser} onClose={() => setEditingUser(null)} onSave={handleSaveUser} />}
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: { maxWidth: '1200px', margin: '0 auto', padding: '40px 20px', backgroundColor: COLORS.base, minHeight: 'calc(100vh - 64px)' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' },
    title: { fontSize: '28px', color: COLORS.primary, margin: 0 },
    headerActions: { display: 'flex', gap: '16px', flexWrap: 'wrap' },
    primaryButton: { padding: '10px 20px', fontSize: '15px', fontWeight: 'bold', border: 'none', backgroundColor: COLORS.secondary, color: 'white', borderRadius: '8px', cursor: 'pointer' },
    secondaryButton: { padding: '10px 20px', fontSize: '15px', border: `1px solid ${COLORS.secondary}`, backgroundColor: 'transparent', color: COLORS.secondary, borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' },
    tableContainer: { overflowX: 'auto', backgroundColor: COLORS.card, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
    actionsCell: { display: 'flex', gap: '8px' },
    statusPill: { color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1010 },
    modalContent: { backgroundColor: COLORS.card, padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '500px' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    modalTitle: { margin: 0, fontSize: '20px', color: COLORS.textPrimary },
    closeButton: { background: 'none', border: 'none', cursor: 'pointer' },
    modalForm: { display: 'flex', flexDirection: 'column', gap: '16px' },
    inputGroup: { display: 'flex', flexDirection: 'column' },
    checkboxGroup: { display: 'flex', alignItems: 'center', gap: '10px' },
    modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' },
    tableHeader: { padding: '16px', borderBottom: `2px solid ${COLORS.divider}`, color: COLORS.textSecondary, textTransform: 'uppercase', fontSize: '13px' },
    tableCell: { padding: '16px', borderTop: `1px solid ${COLORS.divider}` },
    modalLabel: { marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: COLORS.textSecondary },
    modalInput: { padding: '10px', fontSize: '15px', borderRadius: '8px', border: `1px solid ${COLORS.divider}` },
};
